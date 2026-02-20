import { z } from 'zod'

const scoringWeightsSchema = z.object({
  clientFrequency: z.number().min(0).max(1),
  globalPopularity: z.number().min(0).max(1),
  margin: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
  slowMoverPush: z.number().min(0).max(1),
})

export const engineConfigSchema = z.object({
  weights: scoringWeightsSchema,
  anchorRatio: z.number().min(0).max(1),
  minBundleSize: z.number().int().min(1).max(50),
  maxBundleSize: z.number().int().min(1).max(50),
  maxCategoryPercent: z.number().min(0).max(1),
  scoringTimeframeDays: z.number().int().min(1).max(3650),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: 'Parola curentă este obligatorie' }),
  newPassword: z.string().min(6, { error: 'Parola nouă trebuie să aibă cel puțin 6 caractere' }),
})

export type EngineConfigInput = z.infer<typeof engineConfigSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
