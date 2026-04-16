import { z } from 'zod'
const productRoles = ['ANCHOR', 'UPSELL'] as const

export const productCreateSchema = z.object({
  name: z.string().min(1, { error: 'Numele este obligatoriu' }).max(200),
  sku: z.string().min(1, { error: 'Codul SKU este obligatoriu' }).max(50),
  category: z.string().optional().nullable(),
  role: z.enum(productRoles, {
    error: 'Rolul este obligatoriu',
  }).default('ANCHOR'),
  description: z.string().max(1000).optional().nullable(),
  unitPrice: z
    .string()
    .min(1, { error: 'Prețul de vânzare este obligatoriu' })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      error: 'Prețul trebuie să fie pozitiv',
    }),
  tvaPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      error: 'TVA trebuie să fie pozitiv',
    }),
  brutPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      error: 'Prețul brut trebuie să fie pozitiv',
    }),
  acquisitionPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      error: 'Prețul de achiziție trebuie să fie pozitiv',
    }),
  stockQty: z
    .number({ error: 'Stocul trebuie să fie un număr' })
    .int({ error: 'Stocul trebuie să fie un număr întreg' })
    .min(0, { error: 'Stocul nu poate fi negativ' })
    .default(0),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateInput = z.input<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
