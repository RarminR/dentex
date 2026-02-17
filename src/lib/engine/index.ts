export type {
  ScoringWeights,
  EngineConfig,
  ScoredProduct,
  GeneratedOffer,
  AiEnhancement,
  ClientProfile,
  ImportResult,
} from './types'

export {
  DEFAULT_ENGINE_CONFIG,
  validateWeights,
  PRODUCT_CATEGORIES,
} from './defaults'

export type { ProductCategory } from './defaults'

export { scoreProducts } from './scorer'
export { buildBundle } from './bundler'
