import { z } from 'zod'
import { RO } from '@/lib/constants/ro'

const productRoles = ['ANCHOR', 'UPSELL'] as const

export const productCreateSchema = z.object({
  name: z.string().min(1, { error: 'Numele este obligatoriu' }).max(200),
  sku: z.string().min(1, { error: 'Codul SKU este obligatoriu' }).max(50),
  category: z.enum(RO.products.categories, {
    error: 'Categoria este obligatorie',
  }),
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
  costPrice: z
    .string()
    .min(1, { error: 'Prețul de achiziție este obligatoriu' })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      error: 'Prețul trebuie să fie pozitiv',
    }),
  stockQty: z
    .number({ error: 'Stocul trebuie să fie un număr' })
    .int({ error: 'Stocul trebuie să fie un număr întreg' })
    .min(0, { error: 'Stocul nu poate fi negativ' }),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
