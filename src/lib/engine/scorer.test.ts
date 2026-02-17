import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { createMockClient, createMockOrder, createMockOrderItem, createMockProduct } from '@/test/helpers'
import { DEFAULT_ENGINE_CONFIG } from './defaults'

const mockPrisma = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
  },
  client: {
    findUnique: vi.fn(),
  },
  orderItem: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

const { scoreProducts } = await import('./scorer')

const d = (value: number | string) => new Prisma.Decimal(value)

describe('scoreProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'))
  })

  it('prioritizes products frequently ordered by the client', async () => {
    const productA = createMockProduct({ id: 'p-a', name: 'Product A', sku: 'A-001' })
    const productB = createMockProduct({ id: 'p-b', name: 'Product B', sku: 'B-001' })

    const client = createMockClient({ id: 'client-1', discountPercent: d('10') })

    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockPrisma.product.findMany.mockResolvedValue([productA, productB])

    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce([
        {
          ...createMockOrderItem({ id: 'ci-1', productId: 'p-a', quantity: 3 }),
          order: createMockOrder({ id: 'co-1', clientId: 'client-1', orderDate: new Date('2026-01-20') }),
        },
        {
          ...createMockOrderItem({ id: 'ci-2', productId: 'p-a', quantity: 2 }),
          order: createMockOrder({ id: 'co-2', clientId: 'client-1', orderDate: new Date('2026-01-15') }),
        },
        {
          ...createMockOrderItem({ id: 'ci-3', productId: 'p-b', quantity: 4 }),
          order: createMockOrder({ id: 'co-3', clientId: 'client-1', orderDate: new Date('2026-01-10') }),
        },
      ])
      .mockResolvedValueOnce([
        { ...createMockOrderItem({ id: 'gi-1', productId: 'p-a', quantity: 9 }) },
        { ...createMockOrderItem({ id: 'gi-2', productId: 'p-b', quantity: 2 }) },
      ])

    const scored = await scoreProducts('client-1', DEFAULT_ENGINE_CONFIG)

    const scoredA = scored.find((item) => item.productId === 'p-a')
    const scoredB = scored.find((item) => item.productId === 'p-b')

    expect(scoredA).toBeDefined()
    expect(scoredB).toBeDefined()
    expect(scoredA!.scoreBreakdown.clientFrequency).toBe(1)
    expect(scoredB!.scoreBreakdown.clientFrequency).toBe(0.5)
    expect(scoredA!.compositeScore).toBeGreaterThan(scoredB!.compositeScore)
  })

  it('assigns high globalPopularity to globally popular products', async () => {
    const productA = createMockProduct({ id: 'p-a', name: 'Product A', sku: 'A-001' })
    const productB = createMockProduct({ id: 'p-b', name: 'Product B', sku: 'B-001' })

    mockPrisma.client.findUnique.mockResolvedValue(createMockClient({ id: 'client-1', discountPercent: d('0') }))
    mockPrisma.product.findMany.mockResolvedValue([productA, productB])

    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ...createMockOrderItem({ id: 'g-1', productId: 'p-a', quantity: 100 }) },
        { ...createMockOrderItem({ id: 'g-2', productId: 'p-b', quantity: 25 }) },
      ])

    const scored = await scoreProducts('client-1', DEFAULT_ENGINE_CONFIG)
    const scoredA = scored.find((item) => item.productId === 'p-a')
    const scoredB = scored.find((item) => item.productId === 'p-b')

    expect(scoredA!.scoreBreakdown.globalPopularity).toBe(1)
    expect(scoredB!.scoreBreakdown.globalPopularity).toBe(0.25)
  })

  it('sets clientFrequency and recency to 0 when client has no orders', async () => {
    const products = [
      createMockProduct({ id: 'p-a', sku: 'A-001' }),
      createMockProduct({ id: 'p-b', sku: 'B-001' }),
    ]

    mockPrisma.client.findUnique.mockResolvedValue(createMockClient({ id: 'client-1', discountPercent: d('15') }))
    mockPrisma.product.findMany.mockResolvedValue(products)
    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const scored = await scoreProducts('client-1', DEFAULT_ENGINE_CONFIG)

    for (const item of scored) {
      expect(item.scoreBreakdown.clientFrequency).toBe(0)
      expect(item.scoreBreakdown.recency).toBe(0)
    }
  })

  it('scores unsold products as globalPopularity 0 and slowMoverPush 1', async () => {
    const productA = createMockProduct({ id: 'p-a', sku: 'A-001' })
    const newProduct = createMockProduct({ id: 'p-new', sku: 'NEW-001' })

    mockPrisma.client.findUnique.mockResolvedValue(createMockClient({ id: 'client-1', discountPercent: d('0') }))
    mockPrisma.product.findMany.mockResolvedValue([productA, newProduct])
    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ...createMockOrderItem({ id: 'g-1', productId: 'p-a', quantity: 50 }) },
      ])

    const scored = await scoreProducts('client-1', DEFAULT_ENGINE_CONFIG)
    const scoredNew = scored.find((item) => item.productId === 'p-new')

    expect(scoredNew).toBeDefined()
    expect(scoredNew!.scoreBreakdown.globalPopularity).toBe(0)
    expect(scoredNew!.scoreBreakdown.slowMoverPush).toBe(1)
  })

  it('returns scores in descending composite order with valid shape', async () => {
    const products = [
      createMockProduct({ id: 'p-a', name: 'High', sku: 'A-001', unitPrice: d('200'), costPrice: d('80') }),
      createMockProduct({ id: 'p-b', name: 'Mid', sku: 'B-001', unitPrice: d('120'), costPrice: d('72') }),
      createMockProduct({ id: 'p-c', name: 'Low', sku: 'C-001', unitPrice: d('100'), costPrice: d('95') }),
    ]

    mockPrisma.client.findUnique.mockResolvedValue(createMockClient({ id: 'client-1', discountPercent: d('10') }))
    mockPrisma.product.findMany.mockResolvedValue(products)
    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce([
        {
          ...createMockOrderItem({ id: 'ci-1', productId: 'p-a', quantity: 10 }),
          order: createMockOrder({ id: 'co-1', clientId: 'client-1', orderDate: new Date('2026-01-31') }),
        },
        {
          ...createMockOrderItem({ id: 'ci-2', productId: 'p-b', quantity: 1 }),
          order: createMockOrder({ id: 'co-2', clientId: 'client-1', orderDate: new Date('2025-12-01') }),
        },
      ])
      .mockResolvedValueOnce([
        { ...createMockOrderItem({ id: 'gi-1', productId: 'p-a', quantity: 200 }) },
        { ...createMockOrderItem({ id: 'gi-2', productId: 'p-b', quantity: 50 }) },
        { ...createMockOrderItem({ id: 'gi-3', productId: 'p-c', quantity: 5 }) },
      ])

    const scored = await scoreProducts('client-1', DEFAULT_ENGINE_CONFIG)

    expect(scored).toHaveLength(3)
    for (let i = 1; i < scored.length; i += 1) {
      expect(scored[i - 1].compositeScore).toBeGreaterThanOrEqual(scored[i].compositeScore)
    }

    for (const item of scored) {
      expect(item.compositeScore).toBeGreaterThanOrEqual(0)
      expect(item.compositeScore).toBeLessThanOrEqual(1)
      expect(item.scoreBreakdown).toEqual(
        expect.objectContaining({
          clientFrequency: expect.any(Number),
          globalPopularity: expect.any(Number),
          margin: expect.any(Number),
          recency: expect.any(Number),
          slowMoverPush: expect.any(Number),
        })
      )
      expect(item.role).toBe('anchor')
      expect(item.effectivePrice).toBeInstanceOf(Prisma.Decimal)
      expect(item.effectivePrice.toFixed(2)).toBe(item.unitPrice.times(0.9).toFixed(2))
    }
  })
})
