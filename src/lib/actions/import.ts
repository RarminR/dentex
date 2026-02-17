'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { parseCsvText, parseRomanianDate, parseRomanianNumber } from '@/lib/import/parser'
import {
  parseOrderRows,
  matchClients,
  matchProducts,
  groupOrderRows,
  type OrderCsvRow,
} from '@/lib/import/orders'
import {
  PRODUCT_CSV_COLUMNS,
  getProductParseOptions,
  mapCsvRowsToProductRows,
  processProductImport,
  productImportRowSchema,
  type ProductImportResult,
} from '@/lib/import/products'
import { validateRows } from '@/lib/import/validator'
import type { ImportValidationError } from '@/lib/import/types'

export type OrderImportResult = {
  ordersCreated: number
  itemsCreated: number
  errors: ImportValidationError[]
}

export async function importOrders(formData: FormData): Promise<OrderImportResult> {
  const file = formData.get('file') as File | null
  if (!file) {
    return { ordersCreated: 0, itemsCreated: 0, errors: [{ row: 0, field: 'file', message: 'Fișierul este obligatoriu' }] }
  }

  const csvText = await file.text()
  const parsed = parseCsvText<OrderCsvRow>(csvText, {
    transformers: {
      'Dată Comandă': (value) => parseRomanianDate(value) ?? value,
      'Preț Unitar': (value) => {
        const num = parseRomanianNumber(value)
        return num !== null ? String(num) : value
      },
      Plătit: (value) => {
        const num = parseRomanianNumber(value)
        return num !== null ? String(num) : value
      },
      Cantitate: (value) => {
        const num = parseRomanianNumber(value)
        return num !== null ? String(Math.round(num)) : value
      },
    },
  })

  if (parsed.errors.length > 0) {
    return {
      ordersCreated: 0,
      itemsCreated: 0,
      errors: parsed.errors.map((e) => ({
        row: e.row ?? 0,
        field: 'csv',
        message: e.message,
      })),
    }
  }

  const rawRows = parsed.rows as unknown as Record<string, string>[]
  const validation = parseOrderRows(rawRows)
  if (validation.errors.length > 0) {
    return { ordersCreated: 0, itemsCreated: 0, errors: validation.errors }
  }

  const clientNames = [...new Set(validation.valid.map((r) => r.client))]
  const productSkus = [...new Set(validation.valid.map((r) => r.productSku))]

  const [dbClients, dbProducts] = await Promise.all([
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, companyName: true },
    }),
    prisma.product.findMany({
      where: { sku: { in: productSkus }, isActive: true },
      select: { id: true, sku: true },
    }),
  ])

  const clientResult = matchClients(clientNames, dbClients)
  const productResult = matchProducts(productSkus, dbProducts)

  const allMatchErrors = [...clientResult.errors, ...productResult.errors]
  if (allMatchErrors.length > 0) {
    return { ordersCreated: 0, itemsCreated: 0, errors: allMatchErrors }
  }

  const { orders, errors: groupErrors } = groupOrderRows(
    validation.valid,
    clientResult.matched,
    productResult.matched,
  )

  if (groupErrors.length > 0) {
    return { ordersCreated: 0, itemsCreated: 0, errors: groupErrors }
  }

  let ordersCreated = 0
  let itemsCreated = 0
  const errors: ImportValidationError[] = []

  for (const orderGroup of orders) {
    try {
      await prisma.order.create({
        data: {
          clientId: orderGroup.clientId,
          orderDate: new Date(orderGroup.orderDate),
          status: orderGroup.status,
          totalAmount: new Prisma.Decimal(orderGroup.totalAmount),
          paidAmount: new Prisma.Decimal(orderGroup.paidAmount),
          isPaid: orderGroup.isPaid,
          items: {
            create: orderGroup.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              discount: new Prisma.Decimal(0),
              totalPrice: new Prisma.Decimal(item.totalPrice),
            })),
          },
        },
      })
      ordersCreated++
      itemsCreated += orderGroup.items.length
    } catch (e) {
      errors.push({
        row: 0,
        field: 'general',
        message: e instanceof Error ? e.message : 'Eroare la crearea comenzii',
      })
    }
  }

  revalidatePath('/orders')
  return { ordersCreated, itemsCreated, errors }
}

export async function importProducts(formData: FormData): Promise<ProductImportResult> {
  const file = formData.get('file') as File | null
  if (!file) {
    return {
      imported: 0,
      updated: 0,
      errors: [{ row: 0, field: 'file', message: 'Fișierul este obligatoriu' }],
    }
  }

  const csvText = await file.text()
  const parseOptions = getProductParseOptions()
  const parsed = parseCsvText(csvText, parseOptions)

  if (parsed.errors.length > 0) {
    return {
      imported: 0,
      updated: 0,
      errors: parsed.errors.map((e) => ({
        row: e.row ?? 0,
        field: 'csv',
        message: e.message,
      })),
    }
  }

  const mappedRows = mapCsvRowsToProductRows(parsed.rows as Record<string, unknown>[])
  const validation = validateRows(mappedRows, productImportRowSchema)

  if (validation.errors.length > 0 && validation.valid.length === 0) {
    return { imported: 0, updated: 0, errors: validation.errors }
  }

  const result = await processProductImport(validation.valid)

  revalidatePath('/products')
  return {
    imported: result.imported,
    updated: result.updated,
    errors: [...validation.errors, ...result.errors],
  }
}
