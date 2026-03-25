import { Prisma } from '@prisma/client'
import { sumDecimals } from '@/lib/utils/decimal'
import type { EngineConfig, GeneratedOffer, ScoredProduct } from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function sortByAffinity(
  products: ScoredProduct[],
  affinityFn: (product: ScoredProduct) => number,
  jitterStrength = 0
): ScoredProduct[] {
  const jittered = products.map((p) => ({
    product: p,
    jitter: jitterStrength > 0 ? (Math.random() - 0.5) * 2 * jitterStrength : 0,
  }))

  jittered.sort((a, b) => {
    const affinityDiff = (affinityFn(b.product) + b.jitter) - (affinityFn(a.product) + a.jitter)
    if (Math.abs(affinityDiff) > 1e-9) return affinityDiff

    const compositeDiff = b.product.compositeScore - a.product.compositeScore
    if (Math.abs(compositeDiff) > 1e-9) return compositeDiff

    return a.product.productId.localeCompare(b.product.productId)
  })

  return jittered.map((j) => j.product)
}

function selectWithCategoryCap(
  products: ScoredProduct[],
  count: number,
  bundleSize: number,
  maxCategoryPercent: number,
  categoryCounts: Map<string, number>
): ScoredProduct[] {
  const selected: ScoredProduct[] = []
  const categoryLimit = maxCategoryPercent * bundleSize

  for (const product of products) {
    if (selected.length >= count) break

    const currentCount = categoryCounts.get(product.category) ?? 0
    if (currentCount + 1 > categoryLimit) continue

    selected.push(product)
    categoryCounts.set(product.category, currentCount + 1)
  }

  return selected
}

export function buildBundle(
  scoredProducts: ScoredProduct[],
  config: EngineConfig,
  clientAvgOrderSize: number,
  selectedUpsellIds?: string[]
): GeneratedOffer {
  const anchorProducts = scoredProducts.filter((p) => p.role === 'anchor')
  const upsellProducts = scoredProducts.filter((p) => p.role === 'upsell')

  const configuredBundleSize =
    clientAvgOrderSize > 0
      ? clamp(Math.round(clientAvgOrderSize), config.minBundleSize, config.maxBundleSize)
      : config.minBundleSize

  const jitter = 0.15
  const categoryCounts = new Map<string, number>()

  const anchorRanked = sortByAffinity(
    anchorProducts,
    (product) => product.scoreBreakdown.clientFrequency + product.scoreBreakdown.globalPopularity,
    jitter
  )

  const anchorCount = Math.min(
    Math.round(configuredBundleSize * config.anchorRatio),
    anchorRanked.length
  )

  const selectedAnchors = selectWithCategoryCap(
    anchorRanked,
    anchorCount,
    configuredBundleSize,
    config.maxCategoryPercent,
    categoryCounts
  )

  let selectedUpsells: ScoredProduct[]
  if (selectedUpsellIds && selectedUpsellIds.length > 0) {
    const upsellIdSet = new Set(selectedUpsellIds)
    selectedUpsells = upsellProducts.filter((p) => upsellIdSet.has(p.productId))
  } else {
    const upsellCount = Math.min(
      configuredBundleSize - selectedAnchors.length,
      upsellProducts.length
    )
    const upsellRanked = sortByAffinity(
      upsellProducts,
      (product) => product.scoreBreakdown.slowMoverPush + product.scoreBreakdown.margin,
      jitter
    )
    selectedUpsells = selectWithCategoryCap(
      upsellRanked,
      upsellCount,
      configuredBundleSize,
      config.maxCategoryPercent,
      categoryCounts
    )
  }

  const bundleItems = [
    ...selectedAnchors.map((item) => ({ ...item, role: 'anchor' as const })),
    ...selectedUpsells.map((item) => ({ ...item, role: 'upsell' as const })),
  ]

  const bundleSize = bundleItems.length

  const totalValue = sumDecimals(bundleItems.map((item) => item.effectivePrice))

  const weightedMarginSum = sumDecimals(
    bundleItems.map((item) => item.marginPercent.times(item.effectivePrice))
  )

  const totalMargin = totalValue.equals(0)
    ? new Prisma.Decimal(0)
    : weightedMarginSum.dividedBy(totalValue)

  return {
    clientId: '',
    items: bundleItems,
    totalValue,
    totalMargin,
    anchorCount: bundleItems.filter((item) => item.role === 'anchor').length,
    upsellCount: bundleItems.filter((item) => item.role === 'upsell').length,
    bundleSize,
    engineConfig: {
      ...config,
      weights: { ...config.weights },
    },
    generatedAt: new Date(),
  }
}
