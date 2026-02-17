import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validateRows } from './validator'

const rowSchema = z.object({
  nume: z.string().min(1, 'Numele este obligatoriu'),
  cantitate: z.number().positive('Cantitatea trebuie sa fie pozitiva'),
})

describe('validateRows', () => {
  it('collects all validation errors with correct row numbers', () => {
    const rows = [
      { nume: 'Produs valid', cantitate: 1 },
      { nume: '', cantitate: 0 },
      { nume: '', cantitate: -2 },
    ]

    const result = validateRows(rows, rowSchema)

    expect(result.valid).toEqual([{ nume: 'Produs valid', cantitate: 1 }])
    expect(result.errors).toEqual([
      { row: 3, field: 'nume', message: 'Numele este obligatoriu' },
      {
        row: 3,
        field: 'cantitate',
        message: 'Cantitatea trebuie sa fie pozitiva',
      },
      { row: 4, field: 'nume', message: 'Numele este obligatoriu' },
      {
        row: 4,
        field: 'cantitate',
        message: 'Cantitatea trebuie sa fie pozitiva',
      },
    ])
  })
})
