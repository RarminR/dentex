import { z } from 'zod'

import { validateRows } from './validator'
import type { ImportValidationError, ImportValidationResult } from './types'
import { multiplyDecimalStr, addDecimalStrs, sumDecimalStrs, decimalStrGte } from '@/lib/utils/decimal'

export const ORDER_CSV_COLUMNS = [
  'Client',
  'Dată Comandă',
  'Produs SKU',
  'Cantitate',
  'Preț Unitar',
  'Status',
  'Plătit',
] as const

const STATUS_MAP: Record<string, string> = {
  PENDING: 'PENDING',
  'În așteptare': 'PENDING',
  DELIVERED: 'DELIVERED',
  'Livrată': 'DELIVERED',
  CANCELLED: 'CANCELLED',
  'Anulată': 'CANCELLED',
}

const orderRowSchema = z.object({
  Client: z.string().min(1, { error: 'Client este obligatoriu' }),
  'Dată Comandă': z.string().min(1, { error: 'Data comenzii este obligatorie' }),
  'Produs SKU': z.string().min(1, { error: 'SKU produs este obligatoriu' }),
  Cantitate: z.string().transform((val) => {
    const n = Number(val)
    if (Number.isNaN(n) || n < 1 || !Number.isInteger(n)) return undefined as never
    return n
  }).pipe(z.number({ error: 'Cantitate invalidă (minim 1)' }).int().min(1)),
  'Preț Unitar': z.string().min(1, { error: 'Prețul este obligatoriu' }),
  Status: z.string().transform((val) => STATUS_MAP[val.trim()]).pipe(
    z.string({ error: 'Status invalid' }).refine(
      (val) => ['PENDING', 'DELIVERED', 'CANCELLED'].includes(val),
      { error: 'Status invalid. Valori acceptate: PENDING, DELIVERED, CANCELLED, În așteptare, Livrată, Anulată' },
    ),
  ),
  Plătit: z.string().default('0'),
})

export type OrderCsvRow = {
  Client: string
  'Dată Comandă': string
  'Produs SKU': string
  Cantitate: string
  'Preț Unitar': string
  Status: string
  Plătit: string
}

export type ParsedOrderRow = {
  client: string
  orderDate: string
  productSku: string
  quantity: number
  unitPrice: string
  status: string
  paidAmount: string
}

export type OrderGroup = {
  clientId: string
  orderDate: string
  status: string
  totalAmount: string
  paidAmount: string
  isPaid: boolean
  items: OrderItemData[]
}

export type OrderItemData = {
  productId: string
  quantity: number
  unitPrice: string
  totalPrice: string
}

export type GroupResult = {
  orders: OrderGroup[]
  errors: ImportValidationError[]
}

export function parseOrderRows(
  rows: Record<string, string>[],
): ImportValidationResult<ParsedOrderRow> {
  const validated = validateRows(rows, orderRowSchema)

  const mapped: ParsedOrderRow[] = validated.valid.map((row) => ({
    client: row.Client,
    orderDate: row['Dată Comandă'],
    productSku: row['Produs SKU'],
    quantity: row.Cantitate,
    unitPrice: row['Preț Unitar'],
    status: row.Status,
    paidAmount: row.Plătit,
  }))

  return {
    valid: mapped,
    errors: validated.errors,
  }
}

export function matchClients(
  clientNames: string[],
  dbClients: { id: string; companyName: string }[],
): { matched: Map<string, string>; errors: ImportValidationError[] } {
  const matched = new Map<string, string>()
  const errors: ImportValidationError[] = []

  const uniqueNames = [...new Set(clientNames)]

  for (const name of uniqueNames) {
    const normalized = name.trim().toLowerCase()
    const found = dbClients.find(
      (c) => c.companyName.trim().toLowerCase() === normalized,
    )

    if (found) {
      matched.set(name, found.id)
    } else {
      errors.push({
        row: 0,
        field: 'Client',
        message: `Client negăsit: "${name}"`,
      })
    }
  }

  return { matched, errors }
}

export function matchProducts(
  skus: string[],
  dbProducts: { id: string; sku: string }[],
): { matched: Map<string, string>; errors: ImportValidationError[] } {
  const matched = new Map<string, string>()
  const errors: ImportValidationError[] = []

  const uniqueSkus = [...new Set(skus)]
  const skuMap = new Map(dbProducts.map((p) => [p.sku, p.id]))

  for (const sku of uniqueSkus) {
    const productId = skuMap.get(sku)
    if (productId) {
      matched.set(sku, productId)
    } else {
      errors.push({
        row: 0,
        field: 'Produs SKU',
        message: `Produs negăsit cu SKU: "${sku}"`,
      })
    }
  }

  return { matched, errors }
}

export function groupOrderRows(
  rows: ParsedOrderRow[],
  clientMap: Map<string, string>,
  productMap: Map<string, string>,
): GroupResult {
  const errors: ImportValidationError[] = []
  const orderMap = new Map<string, { group: Omit<OrderGroup, 'totalAmount' | 'paidAmount' | 'isPaid'>; items: OrderItemData[]; paidSum: string }>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const clientId = clientMap.get(row.client)
    if (!clientId) {
      errors.push({
        row: rowNum,
        field: 'Client',
        message: `Client negăsit: "${row.client}"`,
      })
      continue
    }

    const productId = productMap.get(row.productSku)
    if (!productId) {
      errors.push({
        row: rowNum,
        field: 'Produs SKU',
        message: `Produs negăsit cu SKU: "${row.productSku}"`,
      })
      continue
    }

    const key = `${row.client}|${row.orderDate}`
    const totalPrice = multiplyDecimalStr(row.unitPrice, row.quantity)
    const paidAmount = row.paidAmount || '0'

    const item: OrderItemData = {
      productId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice,
    }

    const existing = orderMap.get(key)
    if (existing) {
      existing.items.push(item)
      existing.paidSum = addDecimalStrs(existing.paidSum, paidAmount)
    } else {
      orderMap.set(key, {
        group: {
          clientId,
          orderDate: row.orderDate,
          status: row.status,
          items: [],
        },
        items: [item],
        paidSum: paidAmount,
      })
    }
  }

  const orders: OrderGroup[] = []
  for (const { group, items, paidSum } of orderMap.values()) {
    const totalAmount = sumDecimalStrs(items.map((item) => item.totalPrice))

    orders.push({
      ...group,
      totalAmount,
      paidAmount: paidSum,
      isPaid: decimalStrGte(paidSum, totalAmount),
      items,
    })
  }

  return { orders, errors }
}
