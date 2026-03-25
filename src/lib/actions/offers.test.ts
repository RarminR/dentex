import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

const d = (val: number | string) => new Prisma.Decimal(val)

const mockPrisma = {
  client: {
    findUnique: vi.fn(),
  },
  order: {
    aggregate: vi.fn(),
    count: vi.fn(),
  },
  offer: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockScoreProducts = vi.fn()
const mockBuildBundle = vi.fn()
const mockGetEngineConfig = vi.fn()

vi.mock('@/lib/engine/scorer', () => ({
  scoreProducts: mockScoreProducts,
}))

vi.mock('@/lib/engine/bundler', () => ({
  buildBundle: mockBuildBundle,
}))

vi.mock('@/lib/actions/settings', () => ({
  getEngineConfig: mockGetEngineConfig,
}))

const { generateOffer, getOffer, updateOffer, getClientOffers } = await import('./offers')

function makeScoredProduct(overrides: Partial<{
  productId: string
  name: string
  category: string
  role: 'anchor' | 'upsell'
  effectivePrice: Prisma.Decimal
  marginPercent: Prisma.Decimal
  suggestedQuantity: number
}> = {}) {
  return {
    productId: overrides.productId ?? 'prod-1',
    name: overrides.name ?? 'Compozit A1',
    category: overrides.category ?? 'Materiale Compozite',
    sku: 'SKU-001',
    unitPrice: d('100.00'),
    effectivePrice: overrides.effectivePrice ?? d('90.00'),
    costPrice: d('60.00'),
    marginPercent: overrides.marginPercent ?? d('40.00'),
    compositeScore: 0.85,
    scoreBreakdown: {
      clientFrequency: 0.8,
      globalPopularity: 0.7,
      margin: 0.6,
      recency: 0.5,
      slowMoverPush: 0.3,
    },
    suggestedQuantity: overrides.suggestedQuantity ?? 5,
    role: overrides.role ?? ('anchor' as const),
  }
}

const defaultConfig = {
  weights: {
    clientFrequency: 0.30,
    globalPopularity: 0.20,
    margin: 0.25,
    recency: 0.15,
    slowMoverPush: 0.10,
  },
  anchorRatio: 0.60,
  minBundleSize: 5,
  maxBundleSize: 15,
  maxCategoryPercent: 0.40,
  scoringTimeframeDays: 365,
}

describe('generateOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('orchestrates the full pipeline: score \u2192 bundle \u2192 save', async () => {
    const client = {
      id: 'client-1',
      companyName: 'Clinica Test SRL',
      discountPercent: d('10.00'),
    }
    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockGetEngineConfig.mockResolvedValue(defaultConfig)

    const scoredProducts = [
      makeScoredProduct({ productId: 'p1', role: 'anchor' }),
      makeScoredProduct({ productId: 'p2', role: 'upsell' }),
    ]
    mockScoreProducts.mockResolvedValue(scoredProducts)

    const bundle = {
      clientId: 'client-1',
      items: scoredProducts,
      totalValue: d('180.00'),
      totalMargin: d('40.00'),
      anchorCount: 1,
      upsellCount: 1,
      bundleSize: 2,
      engineConfig: defaultConfig,
      generatedAt: new Date(),
    }
    mockBuildBundle.mockReturnValue(bundle)

    mockPrisma.order.aggregate.mockResolvedValue({
      _avg: { totalAmount: d('500.00') },
    })
    mockPrisma.order.count.mockResolvedValue(5)

    const savedOffer = {
      id: 'offer-1',
      clientId: 'client-1',
      items: JSON.stringify(scoredProducts),
      engineConfig: JSON.stringify(defaultConfig),
      totalValue: d('180.00'),
      totalMargin: d('40.00'),
      isEdited: false,
      aiInsight: null,
      pitchNote: null,
      generatedAt: new Date(),
      createdAt: new Date(),
    }
    mockPrisma.offer.create.mockResolvedValue(savedOffer)

    const result = await generateOffer('client-1')

    expect(result.success).toBe(true)
    expect(result.offerId).toBe('offer-1')
    expect(mockScoreProducts).toHaveBeenCalledWith('client-1', defaultConfig)
    expect(mockBuildBundle).toHaveBeenCalled()
    expect(mockPrisma.offer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'client-1',
          totalValue: d('180.00'),
          totalMargin: d('40.00'),
        }),
      })
    )
  })

  it('throws when client not found', async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null)

    const result = await generateOffer('nonexistent')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Client')
  })

  it('calculates clientAvgOrderSize from order history', async () => {
    const client = {
      id: 'client-1',
      companyName: 'Clinica Test',
      discountPercent: d('0'),
    }
    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockGetEngineConfig.mockResolvedValue(defaultConfig)
    mockScoreProducts.mockResolvedValue([makeScoredProduct()])

    mockPrisma.order.aggregate.mockResolvedValue({
      _avg: { totalAmount: d('1000.00') },
    })
    mockPrisma.order.count.mockResolvedValue(10)

    const bundle = {
      clientId: 'client-1',
      items: [makeScoredProduct()],
      totalValue: d('90.00'),
      totalMargin: d('40.00'),
      anchorCount: 1,
      upsellCount: 0,
      bundleSize: 1,
      engineConfig: defaultConfig,
      generatedAt: new Date(),
    }
    mockBuildBundle.mockReturnValue(bundle)
    mockPrisma.offer.create.mockResolvedValue({ id: 'offer-2', ...bundle })

    await generateOffer('client-1')

    expect(mockBuildBundle).toHaveBeenCalledWith(
      expect.any(Array),
      defaultConfig,
      expect.any(Number),
      undefined
    )
  })
})

describe('getOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads offer from DB and parses JSON items', async () => {
    const items = [makeScoredProduct({ productId: 'p1' })]
    const offer = {
      id: 'offer-1',
      clientId: 'client-1',
      items: JSON.stringify(items),
      engineConfig: JSON.stringify(defaultConfig),
      totalValue: d('90.00'),
      totalMargin: d('40.00'),
      isEdited: false,
      aiInsight: 'Test insight',
      pitchNote: 'Test pitch',
      generatedAt: new Date(),
      createdAt: new Date(),
      client: { companyName: 'Clinica Test SRL' },
    }
    mockPrisma.offer.findUnique.mockResolvedValue(offer)

    const result = await getOffer('offer-1')

    expect(result).not.toBeNull()
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0].productId).toBe('p1')
    expect(result!.clientName).toBe('Clinica Test SRL')
  })

  it('returns null for nonexistent offer', async () => {
    mockPrisma.offer.findUnique.mockResolvedValue(null)

    const result = await getOffer('nonexistent')

    expect(result).toBeNull()
  })
})

describe('updateOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates items JSON and sets isEdited = true', async () => {
    const updatedItems = [
      makeScoredProduct({ productId: 'p1', suggestedQuantity: 10 }),
    ]
    mockPrisma.offer.update.mockResolvedValue({
      id: 'offer-1',
      items: JSON.stringify(updatedItems),
      isEdited: true,
    })

    const result = await updateOffer('offer-1', updatedItems)

    expect(result.success).toBe(true)
    expect(mockPrisma.offer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'offer-1' },
        data: expect.objectContaining({
          isEdited: true,
        }),
      })
    )
  })
})

describe('getClientOffers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists past offers for a client', async () => {
    const offers = [
      {
        id: 'offer-1',
        createdAt: new Date('2026-01-15'),
        totalValue: d('500.00'),
        isEdited: false,
      },
      {
        id: 'offer-2',
        createdAt: new Date('2026-01-10'),
        totalValue: d('750.00'),
        isEdited: true,
      },
    ]
    mockPrisma.offer.findMany.mockResolvedValue(offers)

    const result = await getClientOffers('client-1')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('offer-1')
    expect(mockPrisma.offer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: 'client-1' },
        orderBy: { createdAt: 'desc' },
      })
    )
  })
})
