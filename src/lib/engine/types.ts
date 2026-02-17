import type { Prisma } from '@prisma/client'

// Scoring weights (configurable via Settings)
export interface ScoringWeights {
  clientFrequency: number   // w1 — how often this client orders this product
  globalPopularity: number  // w2 — how well this product sells globally
  margin: number            // w3 — profit margin of the product
  recency: number           // w4 — how recently client ordered this product
  slowMoverPush: number     // w5 — push for products that sell slowly
}

// Full engine configuration
export interface EngineConfig {
  weights: ScoringWeights
  anchorRatio: number           // 0-1: fraction of bundle that are anchor products (default 0.60)
  minBundleSize: number         // minimum products in offer (default 5)
  maxBundleSize: number         // maximum products in offer (default 15)
  maxCategoryPercent: number    // max fraction from one category (default 0.40)
  scoringTimeframeDays: number  // how far back to look at order history (default 365)
}

// A product scored for a specific client
export interface ScoredProduct {
  productId: string
  name: string
  category: string
  sku: string
  unitPrice: Prisma.Decimal
  effectivePrice: Prisma.Decimal   // unit price after client discount
  costPrice: Prisma.Decimal
  marginPercent: Prisma.Decimal
  compositeScore: number            // 0-1 combined score
  scoreBreakdown: {
    clientFrequency: number         // normalized 0-1
    globalPopularity: number        // normalized 0-1
    margin: number                  // normalized 0-1
    recency: number                 // normalized 0-1
    slowMoverPush: number           // normalized 0-1 (inverse of popularity)
  }
  suggestedQuantity: number         // based on client's typical order qty
  role: 'anchor' | 'upsell'        // assigned by bundler
}

// The complete generated offer
export interface GeneratedOffer {
  clientId: string
  items: ScoredProduct[]
  totalValue: Prisma.Decimal        // sum of effectivePrice × quantity
  totalMargin: Prisma.Decimal       // weighted average margin
  anchorCount: number
  upsellCount: number
  bundleSize: number
  engineConfig: EngineConfig        // snapshot of config used at generation time
  aiInsight?: string                // from GPT-4o-mini (optional, null if unavailable)
  pitchNote?: string                // AI-generated pitch note for sales rep
  generatedAt: Date
}

// AI enhancement response
export interface AiEnhancement {
  insight: string         // 2-3 sentences explaining the offer (Romanian)
  pitchNote: string       // 1-2 sentences for sales rep to use (Romanian)
  swapSuggestions?: Array<{
    removeProductId: string
    addProductId: string
    reason: string
  }>
}

// Client profile summary for AI (lightweight, not the full Prisma model)
export interface ClientProfile {
  id: string
  companyName: string
  discountPercent: Prisma.Decimal
  topCategories: string[]           // top 3 categories by order frequency
  orderCount: number
  daysSinceLastOrder: number | null // null if never ordered
  avgOrderValue: Prisma.Decimal
}

// Import result types
export interface ImportResult {
  imported: number
  updated: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}
