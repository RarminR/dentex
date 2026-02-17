import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({
  id: z.string().min(1, { error: 'ID-ul este obligatoriu' }),
})

export const decimalSchema = z
  .string()
  .min(1)
  .refine((v) => !isNaN(Number(v)), { error: 'Valoarea trebuie să fie un număr valid' })

export type PaginationInput = z.infer<typeof paginationSchema>
export type IdInput = z.infer<typeof idSchema>
