import { describe, expect, it } from 'vitest'
import { Prisma } from '@prisma/client'
import { DEFAULT_ENGINE_CONFIG } from './defaults'
import type { EngineConfig, ScoredProduct } from './types'

const { buildBundle } = await import('./bundler')

const d = (value: number | string) => new Prisma.Decimal(value)

function makeScoredProduct(overrides: Partial<ScoredProduct>): ScoredProduct {
  const index = overrides.productId ?? 'product-1'
  return {
    productId: index,
    name: overrides.name ?? `Product ${index}`,
    category: overrides.category ?? 'Consumabile',
    sku: overrides.sku ?? `${index}-SKU`,
    unitPrice: overrides.unitPrice ?? d('100'),
    effectivePrice: overrides.effectivePrice ?? d('90'),
    costPrice: overrides.costPrice ?? d('60'),
    marginPercent: overrides.marginPercent ?? d('40'),
    compositeScore: overrides.compositeScore ?? 0.5,
    scoreBreakdown: {
      clientFrequency: overrides.scoreBreakdown?.clientFrequency ?? 0,
      globalPopularity: overrides.scoreBreakdown?.globalPopularity ?? 0,
      margin: overrides.scoreBreakdown?.margin ?? 0,
      recency: overrides.scoreBreakdown?.recency ?? 0,
      slowMoverPush: overrides.scoreBreakdown?.slowMoverPush ?? 0,
    },
    suggestedQuantity: overrides.suggestedQuantity ?? 1,
    role: overrides.role ?? 'anchor',
  }
}

function makeConfig(overrides?: Partial<EngineConfig>): EngineConfig {
  return {
    ...DEFAULT_ENGINE_CONFIG,
    ...overrides,
    weights: {
      ...DEFAULT_ENGINE_CONFIG.weights,
      ...(overrides?.weights ?? {}),
    },
  }
}

describe('buildBundle', () => {
  it('splits bundle with 60/40 anchor upsell ratio for avg order size 8', () => {
    const scoredProducts = Array.from({ length: 12 }, (_, i) => {
      const score = 12 - i
      const category =
        i % 4 === 0
          ? 'Consumabile'
          : i % 4 === 1
            ? 'Instrumente'
            : i % 4 === 2
              ? 'Implanturi'
              : 'Materiale Compozite'

      return makeScoredProduct({
        productId: `p-${i + 1}`,
        category,
        effectivePrice: d(100 + i),
        marginPercent: d(20 + i),
        scoreBreakdown: {
          clientFrequency: score / 12,
          globalPopularity: score / 24,
          margin: score / 12,
          recency: 0,
          slowMoverPush: score / 24,
        },
      })
    })

    const offer = buildBundle(scoredProducts, makeConfig(), 8)

    expect(offer.bundleSize).toBe(8)
    expect(offer.anchorCount).toBe(5)
    expect(offer.upsellCount).toBe(3)
    expect(offer.items).toHaveLength(8)
  })

  it('uses min bundle size for new client with no order history', () => {
    const scoredProducts = Array.from({ length: 10 }, (_, i) =>
      makeScoredProduct({
        productId: `p-${i + 1}`,
        category: i % 3 === 0 ? 'Consumabile' : i % 3 === 1 ? 'Instrumente' : 'Implanturi',
        scoreBreakdown: {
          clientFrequency: 1 - i * 0.05,
          globalPopularity: 0.5,
          margin: 0.5,
          recency: 0,
          slowMoverPush: 0.5,
        },
      })
    )

    const offer = buildBundle(scoredProducts, makeConfig(), 0)

    expect(offer.bundleSize).toBe(DEFAULT_ENGINE_CONFIG.minBundleSize)
    expect(offer.items).toHaveLength(DEFAULT_ENGINE_CONFIG.minBundleSize)
    expect(offer.anchorCount).toBe(Math.round(DEFAULT_ENGINE_CONFIG.minBundleSize * DEFAULT_ENGINE_CONFIG.anchorRatio))
    expect(offer.upsellCount).toBe(DEFAULT_ENGINE_CONFIG.minBundleSize - offer.anchorCount)
  })

  it('enforces category diversity so no category exceeds 40 percent', () => {
    const scoredProducts = [
      makeScoredProduct({
        productId: 'c1',
        category: 'Consumabile',
        scoreBreakdown: { clientFrequency: 1, globalPopularity: 1, margin: 0.2, recency: 0, slowMoverPush: 0.1 },
      }),
      makeScoredProduct({
        productId: 'c2',
        category: 'Consumabile',
        scoreBreakdown: { clientFrequency: 0.95, globalPopularity: 0.95, margin: 0.2, recency: 0, slowMoverPush: 0.1 },
      }),
      makeScoredProduct({
        productId: 'c3',
        category: 'Consumabile',
        scoreBreakdown: { clientFrequency: 0.9, globalPopularity: 0.9, margin: 0.2, recency: 0, slowMoverPush: 0.1 },
      }),
      makeScoredProduct({
        productId: 'i1',
        category: 'Instrumente',
        scoreBreakdown: { clientFrequency: 0.6, globalPopularity: 0.6, margin: 0.8, recency: 0, slowMoverPush: 0.9 },
      }),
      makeScoredProduct({
        productId: 'i2',
        category: 'Instrumente',
        scoreBreakdown: { clientFrequency: 0.55, globalPopularity: 0.55, margin: 0.7, recency: 0, slowMoverPush: 0.8 },
      }),
      makeScoredProduct({
        productId: 'm1',
        category: 'Materiale Compozite',
        scoreBreakdown: { clientFrequency: 0.5, globalPopularity: 0.5, margin: 0.6, recency: 0, slowMoverPush: 0.7 },
      }),
      makeScoredProduct({
        productId: 'imp1',
        category: 'Implanturi',
        scoreBreakdown: { clientFrequency: 0.45, globalPopularity: 0.45, margin: 0.5, recency: 0, slowMoverPush: 0.6 },
      }),
    ]

    const offer = buildBundle(scoredProducts, makeConfig(), 5)
    const countsByCategory = offer.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})

    const maxAllowed = Math.floor(DEFAULT_ENGINE_CONFIG.maxCategoryPercent * offer.bundleSize)
    Object.values(countsByCategory).forEach((count) => {
      expect(count).toBeLessThanOrEqual(maxAllowed)
    })
  })

  it('calculates totalValue from effective prices and totalMargin as weighted average', () => {
    const scoredProducts = [
      makeScoredProduct({
        productId: 'a1',
        category: 'Consumabile',
        effectivePrice: d('100'),
        marginPercent: d('10'),
        scoreBreakdown: { clientFrequency: 1, globalPopularity: 1, margin: 0.2, recency: 0, slowMoverPush: 0.1 },
      }),
      makeScoredProduct({
        productId: 'a2',
        category: 'Instrumente',
        effectivePrice: d('200'),
        marginPercent: d('30'),
        scoreBreakdown: { clientFrequency: 0.9, globalPopularity: 0.9, margin: 0.3, recency: 0, slowMoverPush: 0.2 },
      }),
      makeScoredProduct({
        productId: 'u1',
        category: 'Implanturi',
        effectivePrice: d('300'),
        marginPercent: d('50'),
        scoreBreakdown: { clientFrequency: 0.1, globalPopularity: 0.1, margin: 1, recency: 0, slowMoverPush: 1 },
      }),
      makeScoredProduct({
        productId: 'u2',
        category: 'Materiale Compozite',
        effectivePrice: d('400'),
        marginPercent: d('20'),
        scoreBreakdown: { clientFrequency: 0.05, globalPopularity: 0.05, margin: 0.9, recency: 0, slowMoverPush: 0.9 },
      }),
      makeScoredProduct({
        productId: 'u3',
        category: 'Consumabile',
        effectivePrice: d('500'),
        marginPercent: d('40'),
        scoreBreakdown: { clientFrequency: 0.04, globalPopularity: 0.04, margin: 0.8, recency: 0, slowMoverPush: 0.8 },
      }),
    ]

    const offer = buildBundle(scoredProducts, makeConfig(), 5)

    expect(offer.totalValue.toFixed(2)).toBe('1500.00')
    expect(offer.totalMargin.toFixed(2)).toBe('33.33')
  })

  it('assigns anchor and upsell roles to selected items', () => {
    const scoredProducts = Array.from({ length: 10 }, (_, i) =>
      makeScoredProduct({
        productId: `p-${i + 1}`,
        category: i % 4 === 0 ? 'Consumabile' : i % 4 === 1 ? 'Instrumente' : i % 4 === 2 ? 'Implanturi' : 'Materiale Compozite',
        scoreBreakdown: {
          clientFrequency: 1 - i * 0.03,
          globalPopularity: 0.8 - i * 0.03,
          margin: 0.2 + i * 0.02,
          recency: 0,
          slowMoverPush: 0.3 + i * 0.02,
        },
      })
    )

    const offer = buildBundle(scoredProducts, makeConfig(), 5)
    const anchors = offer.items.filter((item) => item.role === 'anchor')
    const upsells = offer.items.filter((item) => item.role === 'upsell')

    expect(anchors).toHaveLength(offer.anchorCount)
    expect(upsells).toHaveLength(offer.upsellCount)
    expect(offer.items).toHaveLength(offer.bundleSize)
  })
})
