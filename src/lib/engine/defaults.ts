import type { EngineConfig } from './types'

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  weights: {
    clientFrequency: 0.30,   // w1: Client's own purchase frequency
    globalPopularity: 0.20,  // w2: Global sales rank
    margin: 0.25,            // w3: Profit margin
    recency: 0.15,           // w4: How recently client ordered
    slowMoverPush: 0.10,     // w5: Incentive to push slow movers
  },
  anchorRatio: 0.60,           // 60% anchor products
  minBundleSize: 5,            // Minimum 5 products per offer
  maxBundleSize: 15,           // Maximum 15 products per offer
  maxCategoryPercent: 0.40,    // No category > 40% of bundle
  scoringTimeframeDays: 365,   // Look back 1 year
}

// Validate that weights sum to 1.0 (within tolerance)
export function validateWeights(weights: { [key: string]: number }): boolean {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 1.0) < 0.001 // tolerance for floating point
}

// Product categories used in the app
export const PRODUCT_CATEGORIES = [
  'Materiale Compozite',
  'Instrumente',
  'Consumabile',
  'Implanturi',
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
