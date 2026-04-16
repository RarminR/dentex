import { z } from 'zod'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { parseRomanianNumber, type ParseCsvOptions } from './parser'
import { validateRows } from './validator'
import type { ImportValidationError } from './types'

export const PRODUCT_CSV_COLUMNS: Record<string, string> = {
  'Nume': 'name',
  'SKU': 'sku',
  'Categorie': 'category',
  'Preț Vânzare': 'unitPrice',
  'Preț Achiziție': 'acquisitionPrice',
  'Stoc': 'stockQty',
  'Descriere': 'description',
}

export type ProductImportRow = {
  name: string
  sku: string
  category?: string | null
  unitPrice: string
  acquisitionPrice?: string
  stockQty: number
  description?: string | null
}

export type ProductImportResult = {
  imported: number
  updated: number
  errors: ImportValidationError[]
}

const productImportRowSchema = z.object({
  name: z.string().min(1, { error: 'Numele este obligatoriu' }).max(200),
  sku: z.string().min(1, { error: 'Codul SKU este obligatoriu' }).max(50),
  category: z.string().optional().nullable(),
  unitPrice: z
    .string()
    .min(1, { error: 'Prețul de vânzare este obligatoriu' })
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      error: 'Prețul trebuie să fie pozitiv',
    }),
  acquisitionPrice: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      error: 'Prețul trebuie să fie pozitiv',
    }),
  stockQty: z
    .number({ error: 'Stocul trebuie să fie un număr' })
    .int({ error: 'Stocul trebuie să fie un număr întreg' })
    .min(0, { error: 'Stocul nu poate fi negativ' })
    .default(0),
  description: z.string().max(1000).nullable().default(null),
})

export { productImportRowSchema }

export function getProductParseOptions(): ParseCsvOptions<Record<string, unknown>> {
  const reverseMap: Record<string, string> = {}
  for (const [roHeader, field] of Object.entries(PRODUCT_CSV_COLUMNS)) {
    reverseMap[roHeader] = field
  }

  return {
    transformers: {
      'Preț Vânzare': (value) => {
        const num = parseRomanianNumber(value)
        return num !== null ? String(num) : value
      },
      'Preț Achiziție': (value: string) => {
        const num = parseRomanianNumber(value)
        return num !== null ? String(num) : value
      },
      'Stoc': (value) => {
        const num = parseRomanianNumber(value)
        return num !== null ? Math.round(num) : 0
      },
    },
  }
}

export function mapCsvRowsToProductRows(
  rawRows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rawRows.map((raw) => {
    const mapped: Record<string, unknown> = {}
    for (const [roHeader, field] of Object.entries(PRODUCT_CSV_COLUMNS)) {
      if (raw[roHeader] !== undefined) {
        mapped[field] = raw[roHeader]
      }
    }
    return mapped
  })
}

const BATCH_SIZE = 100

export async function processProductImport(
  rows: ProductImportRow[],
): Promise<ProductImportResult> {
  const validation = validateRows(rows, productImportRowSchema)

  let imported = 0
  let updated = 0
  const errors: ImportValidationError[] = [...validation.errors]

  for (let i = 0; i < validation.valid.length; i += BATCH_SIZE) {
    const batch = validation.valid.slice(i, i + BATCH_SIZE)

    for (const row of batch) {
      try {
        const result = await prisma.product.upsert({
          where: { sku: row.sku },
          create: {
            name: row.name,
            sku: row.sku,
            category: row.category ?? null,
            description: row.description ?? null,
            unitPrice: new Prisma.Decimal(row.unitPrice),
            acquisitionPrice: row.acquisitionPrice ? new Prisma.Decimal(row.acquisitionPrice) : new Prisma.Decimal(0),
            stockQty: row.stockQty,
          },
          update: {
            name: row.name,
            category: row.category ?? null,
            description: row.description ?? null,
            unitPrice: new Prisma.Decimal(row.unitPrice),
            acquisitionPrice: row.acquisitionPrice ? new Prisma.Decimal(row.acquisitionPrice) : undefined,
            stockQty: row.stockQty,
          },
        })

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          imported++
        } else {
          updated++
        }
      } catch (e) {
        const rowIndex = rows.indexOf(row)
        errors.push({
          row: rowIndex + 2,
          field: 'general',
          message: e instanceof Error ? e.message : 'Eroare necunoscută',
        })
      }
    }
  }

  return { imported, updated, errors }
}
