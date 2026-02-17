import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import type { ClientProfile, GeneratedOffer, ScoredProduct } from './types'

const mockResponsesCreate = vi.hoisted(() => vi.fn())

const MockOpenAI = vi.hoisted(() =>
  vi.fn(function MockOpenAI() {
    return {
      responses: {
        create: mockResponsesCreate,
      },
    }
  })
)

vi.mock('openai', () => ({
  default: MockOpenAI,
}))

const { enhanceOffer } = await import('./ai-enhancer')

const d = (value: number | string) => new Prisma.Decimal(value)

function makeProduct(overrides: Partial<ScoredProduct>): ScoredProduct {
  const productId = overrides.productId ?? 'p-1'

  return {
    productId,
    name: overrides.name ?? `Produs ${productId}`,
    category: overrides.category ?? 'Consumabile',
    sku: overrides.sku ?? `SKU-${productId}`,
    unitPrice: overrides.unitPrice ?? d(100),
    effectivePrice: overrides.effectivePrice ?? d(90),
    costPrice: overrides.costPrice ?? d(50),
    marginPercent: overrides.marginPercent ?? d(40),
    compositeScore: overrides.compositeScore ?? 0.8,
    scoreBreakdown: {
      clientFrequency: overrides.scoreBreakdown?.clientFrequency ?? 0.6,
      globalPopularity: overrides.scoreBreakdown?.globalPopularity ?? 0.7,
      margin: overrides.scoreBreakdown?.margin ?? 0.8,
      recency: overrides.scoreBreakdown?.recency ?? 0.5,
      slowMoverPush: overrides.scoreBreakdown?.slowMoverPush ?? 0.2,
    },
    suggestedQuantity: overrides.suggestedQuantity ?? 2,
    role: overrides.role ?? 'anchor',
  }
}

function makeOffer(): GeneratedOffer {
  return {
    clientId: 'client-1',
    items: [
      makeProduct({ productId: 'a-1', name: 'Compozit A', category: 'Materiale Compozite', role: 'anchor' }),
      makeProduct({ productId: 'a-2', name: 'Freza B', category: 'Instrumente', role: 'anchor' }),
      makeProduct({ productId: 'u-1', name: 'Bavete C', category: 'Consumabile', role: 'upsell' }),
    ],
    totalValue: d(270),
    totalMargin: d(32),
    anchorCount: 2,
    upsellCount: 1,
    bundleSize: 3,
    engineConfig: {
      weights: {
        clientFrequency: 0.3,
        globalPopularity: 0.2,
        margin: 0.25,
        recency: 0.15,
        slowMoverPush: 0.1,
      },
      anchorRatio: 0.6,
      minBundleSize: 5,
      maxBundleSize: 15,
      maxCategoryPercent: 0.4,
      scoringTimeframeDays: 365,
    },
    generatedAt: new Date('2026-02-18T12:00:00.000Z'),
  }
}

function makeClientProfile(): ClientProfile {
  return {
    id: 'client-1',
    companyName: 'Clinica Smile',
    discountPercent: d(12),
    topCategories: ['Consumabile', 'Instrumente', 'Implanturi'],
    orderCount: 24,
    daysSinceLastOrder: 14,
    avgOrderValue: d(1800),
  }
}

describe('enhanceOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('returns parsed AI enhancement when response JSON is valid', async () => {
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        insight: 'Pachetul reflectă istoricul de achiziții și categoriile principale ale clientului.',
        pitchNote: 'Acest mix ajută clinica să mențină stocul pentru procedurile frecvente.',
        swapSuggestions: [
          {
            removeProductId: 'u-1',
            addProductId: 'a-2',
            reason: 'Instrumentul are rotație mai rapidă în acest segment de client.',
          },
        ],
      }),
      usage: { total_tokens: 123 },
    })

    const result = await enhanceOffer(makeOffer(), makeClientProfile())

    expect(result).toEqual({
      insight: 'Pachetul reflectă istoricul de achiziții și categoriile principale ale clientului.',
      pitchNote: 'Acest mix ajută clinica să mențină stocul pentru procedurile frecvente.',
      swapSuggestions: [
        {
          removeProductId: 'u-1',
          addProductId: 'a-2',
          reason: 'Instrumentul are rotație mai rapidă în acest segment de client.',
        },
      ],
    })

    expect(mockResponsesCreate).toHaveBeenCalledTimes(1)
    const payload = mockResponsesCreate.mock.calls[0][0]
    expect(payload.model).toBe('gpt-4o-mini')
    expect(payload.input[0].content[0].text).toContain('Răspunde întotdeauna în limba română')
    expect(payload.input[1].content[0].text).toContain('Clinica Smile')
    expect(payload.input[1].content[0].text).toContain('Compozit A')
    expect(payload.input[1].content[0].text).toContain('Bavete C')
  })

  it('returns null when AI call exceeds timeout', async () => {
    vi.useFakeTimers()
    mockResponsesCreate.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              output_text: JSON.stringify({
                insight: 'late',
                pitchNote: 'late',
                swapSuggestions: [],
              }),
              usage: { total_tokens: 10 },
            })
          }, 15000)
        })
    )

    const promise = enhanceOffer(makeOffer(), makeClientProfile())
    await vi.advanceTimersByTimeAsync(10050)

    await expect(promise).resolves.toBeNull()
  })

  it('returns null when AI returns malformed JSON', async () => {
    mockResponsesCreate.mockResolvedValue({
      output_text: 'not valid json',
      usage: { total_tokens: 42 },
    })

    await expect(enhanceOffer(makeOffer(), makeClientProfile())).resolves.toBeNull()
  })

  it('returns null when OpenAI API throws error', async () => {
    mockResponsesCreate.mockRejectedValue(new Error('500 internal error'))

    await expect(enhanceOffer(makeOffer(), makeClientProfile())).resolves.toBeNull()
  })

  it('returns null immediately when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY

    const result = await enhanceOffer(makeOffer(), makeClientProfile())

    expect(result).toBeNull()
    expect(MockOpenAI).not.toHaveBeenCalled()
    expect(mockResponsesCreate).not.toHaveBeenCalled()
  })
})
