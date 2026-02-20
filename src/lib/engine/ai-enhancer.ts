import OpenAI from 'openai'
import { z } from 'zod'
import type { AiEnhancement, ClientProfile, GeneratedOffer } from './types'

const SYSTEM_PROMPT = 'E\u0219ti un asistent de v\u00e2nz\u0103ri pentru un distribuitor de produse dentare din Rom\u00e2nia. R\u0103spunde \u00eentotdeauna \u00een limba rom\u00e2n\u0103.'
const REQUEST_TIMEOUT_MS = 10_000

const aiEnhancementSchema = z.object({
  insight: z.string().min(1),
  pitchNote: z.string().min(1),
  swapSuggestions: z
    .array(
      z.object({
        removeProductId: z.string().min(1),
        addProductId: z.string().min(1),
        reason: z.string().min(1),
      })
    )
    .optional(),
})

function getDiscountTier(discountPercent: number): string {
  if (discountPercent >= 15) return 'premium'
  if (discountPercent >= 10) return 'standard-plus'
  return 'standard'
}

function getOrderFrequency(orderCount: number): string {
  if (orderCount >= 20) return 'ridicata'
  if (orderCount >= 8) return 'medie'
  return 'scazuta'
}

function buildPrompt(offer: GeneratedOffer, clientProfile: ClientProfile): string {
  const discountPercent = Number(clientProfile.discountPercent)
  const topCategories = clientProfile.topCategories.slice(0, 3).join(', ') || 'fara categorii dominante'

  const anchors = offer.items
    .filter((item) => item.role === 'anchor')
    .map((item) => `${item.productId}: ${item.name} (${item.category})`)
    .join('; ') || 'fara produse anchor'

  const upsells = offer.items
    .filter((item) => item.role === 'upsell')
    .map((item) => `${item.productId}: ${item.name} (${item.category})`)
    .join('; ') || 'fara produse upsell'

  return [
    'Genereaza o recomandare comerciala in format JSON strict.',
    '',
    'Rezumat client:',
    `- Nume: ${clientProfile.companyName}`,
    `- Top 3 categorii (ordonate): ${topCategories}`,
    `- Frecventa comenzi: ${getOrderFrequency(clientProfile.orderCount)} (${clientProfile.orderCount} comenzi)`,
    `- Tier discount: ${getDiscountTier(discountPercent)} (${discountPercent.toFixed(2)}%)`,
    '',
    'Rezumat pachet:',
    `- Produse anchor: ${anchors}`,
    `- Produse upsell: ${upsells}`,
    '',
    'Intoarce DOAR JSON valid cu campurile:',
    '- insight: 2-3 propozitii despre de ce pachetul este bun pentru client',
    '- pitchNote: 1-2 propozitii utilizabile de agent in prezentare',
    '- swapSuggestions: array optional cu obiecte { removeProductId, addProductId, reason }',
  ].join('\n')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })

  const result = await Promise.race<T | null>([
    promise.then((value) => value as T | null),
    timeoutPromise,
  ])

  if (timer) {
    clearTimeout(timer)
  }

  return result
}

export async function enhanceOffer(
  offer: GeneratedOffer,
  clientProfile: ClientProfile
): Promise<AiEnhancement | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const client = new OpenAI({ apiKey })
    const prompt = buildPrompt(offer, clientProfile)

    const response = await withTimeout(
      client.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        ],
      }),
      REQUEST_TIMEOUT_MS
    )

    if (!response) {
      console.error('[AI] enhancement failed: timeout after 10s')
      return null
    }

    const rawText = response.output_text
    if (!rawText) {
      console.error('[AI] enhancement failed: empty response')
      return null
    }

    // Strip markdown code fences if the model wraps its response
    const rawJson = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const parsedJson = JSON.parse(rawJson)
    const parsed = aiEnhancementSchema.safeParse(parsedJson)

    if (!parsed.success) {
      console.error('[AI] enhancement failed: invalid schema', parsed.error.issues)
      return null
    }

    if (response.usage?.total_tokens !== undefined) {
      console.log('[AI] tokens used:', response.usage.total_tokens)
    }

    return parsed.data
  } catch (error) {
    console.error('[AI] enhancement failed:', error)
    return null
  }
}
