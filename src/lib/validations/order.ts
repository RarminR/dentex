import { z } from 'zod'

const orderItemSchema = z.object({
  productId: z.string().min(1, { error: 'ID-ul produsului este obligatoriu' }),
  quantity: z
    .number({ error: 'Cantitatea trebuie să fie un număr' })
    .int({ error: 'Cantitatea trebuie să fie un număr întreg' })
    .min(1, { error: 'Cantitatea trebuie să fie cel puțin 1' }),
})

export const orderCreateSchema = z.object({
  clientId: z.string().min(1, { error: 'Clientul este obligatoriu' }),
  items: z
    .array(orderItemSchema)
    .min(1, { error: 'Comanda trebuie să conțină cel puțin un produs' }),
  notes: z.string().max(1000).optional(),
})

export type OrderCreateInput = z.infer<typeof orderCreateSchema>
