import { z } from 'zod'

export const clientCreateSchema = z.object({
  companyName: z.string().min(2, 'Numele companiei trebuie să aibă cel puțin 2 caractere'),
  contactPerson: z.string().min(2, 'Persoana de contact trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Email invalid').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  creditLimit: z.coerce.number().min(0, 'Limita de credit nu poate fi negativă').default(0),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).default(30),
  discountPercent: z.coerce.number().min(0).max(100, 'Discountul nu poate depăși 100%').default(0),
  notes: z.string().optional().or(z.literal('')),
})

export const clientUpdateSchema = clientCreateSchema.partial().extend({
  id: z.string().min(1),
})

export type ClientCreateInput = z.infer<typeof clientCreateSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
