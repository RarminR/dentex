'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { compareDecimalStrs, serialize } from '@/lib/utils/decimal'

interface ProfitabilityParams {
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

interface ClientProfitabilityRow {
  clientId: string
  clientName: string
  totalRevenue: string
  totalCost: string
  profit: string
  marginPercent: string
  orderCount: number
}

export async function getClientProfitability(
  params: ProfitabilityParams
): Promise<ClientProfitabilityRow[]> {
  const { dateFrom, dateTo, limit } = params

  const orderWhere: Prisma.OrderWhereInput = {}
  if (dateFrom || dateTo) {
    orderWhere.orderDate = {}
    if (dateFrom) (orderWhere.orderDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (orderWhere.orderDate as Record<string, Date>).lte = dateTo
  }

  // Use groupBy for revenue per client instead of loading all data
  const revenueByClient = await prisma.order.groupBy({
    by: ['clientId'],
    where: orderWhere,
    _sum: { totalAmount: true },
    _count: { id: true },
  })

  if (revenueByClient.length === 0) return []

  const clientIds = revenueByClient.map((r) => r.clientId)

  // Fetch client names and cost data in parallel
  const [clients, costData] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, companyName: true },
    }),
    // Get order items with product cost ratios for these clients
    prisma.orderItem.findMany({
      where: {
        order: {
          clientId: { in: clientIds },
          ...orderWhere,
        },
      },
      select: {
        totalPrice: true,
        order: { select: { clientId: true } },
        product: { select: { unitPrice: true, acquisitionPrice: true } },
      },
    }),
  ])

  const nameMap = new Map(clients.map((c) => [c.id, c.companyName]))

  // Calculate cost per client
  const costByClient = new Map<string, Decimal>()
  const ZERO = new Decimal(0)
  for (const item of costData) {
    const clientId = item.order.clientId
    const costRatio = item.product.unitPrice.equals(0)
      ? ZERO
      : item.product.acquisitionPrice.dividedBy(item.product.unitPrice)
    const cost = item.totalPrice.times(costRatio)
    costByClient.set(clientId, (costByClient.get(clientId) ?? ZERO).plus(cost))
  }

  const HUNDRED = new Decimal(100)
  const rows: ClientProfitabilityRow[] = revenueByClient.map((r) => {
    const totalRevenue = new Decimal(Number(r._sum.totalAmount ?? 0))
    const totalCost = costByClient.get(r.clientId) ?? ZERO
    const profit = totalRevenue.minus(totalCost)
    const marginPercent = totalRevenue.equals(ZERO)
      ? ZERO
      : profit.dividedBy(totalRevenue).times(HUNDRED)

    return {
      clientId: r.clientId,
      clientName: nameMap.get(r.clientId) ?? 'Necunoscut',
      totalRevenue: totalRevenue.toFixed(2),
      totalCost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      marginPercent: marginPercent.toFixed(2),
      orderCount: r._count.id,
    }
  })

  rows.sort((a, b) => compareDecimalStrs(b.profit, a.profit))

  if (limit) {
    return serialize(rows.slice(0, limit))
  }

  return serialize(rows)
}

interface ProductPerformanceRow {
  productId: string
  productName: string
  category: string | null
  totalUnitsSold: number
  uniqueClients: number
  totalRevenue: number
  salesVelocity: number
}

interface SlowMoverRow {
  productId: string
  productName: string
  category: string | null
  stockQty: number
  lastOrderDate: Date | null
  totalUnitsSold: number
  salesVelocity: number
}

function calculateMonthsInRange(dateFrom?: Date, dateTo?: Date): number {
  const now = new Date()
  const from = dateFrom ?? new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
  const to = dateTo ?? now
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)))
  return Math.max(1, days / 30)
}

function buildProductPerformanceRows(
  products: Array<{
    id: string
    name: string
    category: string | null
    stockQty: number
    orderItems: Array<{
      quantity: number
      totalPrice: Prisma.Decimal
      order: { clientId: string; orderDate: Date }
    }>
  }>,
  monthsInRange: number
): (ProductPerformanceRow & { stockQty: number; lastOrderDate: Date | null })[] {
  return products.map((product) => {
    let totalUnitsSold = 0
    let totalRevenue = new Decimal(0)
    const clientSet = new Set<string>()
    let lastOrderDate: Date | null = null

    for (const item of product.orderItems) {
      totalUnitsSold += item.quantity
      totalRevenue = totalRevenue.plus(item.totalPrice)
      clientSet.add(item.order.clientId)
      if (!lastOrderDate || item.order.orderDate > lastOrderDate) {
        lastOrderDate = item.order.orderDate
      }
    }

    const salesVelocity = totalUnitsSold <= 0
      ? 0
      : Math.round((totalUnitsSold / monthsInRange) * 100) / 100

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      stockQty: product.stockQty,
      totalUnitsSold,
      uniqueClients: clientSet.size,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      salesVelocity,
      lastOrderDate,
    }
  })
}

export async function getProductPerformance(params: {
  dateFrom?: Date
  dateTo?: Date
}): Promise<ProductPerformanceRow[]> {
  const { dateFrom, dateTo } = params

  const orderItemWhere: Prisma.OrderItemWhereInput = {}
  if (dateFrom || dateTo) {
    orderItemWhere.order = { orderDate: {} }
    if (dateFrom) (orderItemWhere.order.orderDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (orderItemWhere.order.orderDate as Record<string, Date>).lte = dateTo
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      orderItems: {
        where: orderItemWhere,
        select: {
          quantity: true,
          totalPrice: true,
          order: { select: { clientId: true, orderDate: true } },
        },
      },
    },
  })

  const monthsInRange = calculateMonthsInRange(dateFrom, dateTo)
  const rows = buildProductPerformanceRows(products, monthsInRange)

  rows.sort((a, b) => b.salesVelocity - a.salesVelocity)

  return serialize(rows.map(({ stockQty: _s, lastOrderDate: _l, ...rest }) => rest))
}

export async function getSlowMovers(params: {
  dateFrom?: Date
  dateTo?: Date
  thresholdPercent?: number
}): Promise<SlowMoverRow[]> {
  const { dateFrom, dateTo, thresholdPercent = 20 } = params

  const orderItemWhere: Prisma.OrderItemWhereInput = {}
  if (dateFrom || dateTo) {
    orderItemWhere.order = { orderDate: {} }
    if (dateFrom) (orderItemWhere.order.orderDate as Record<string, Date>).gte = dateFrom
    if (dateTo) (orderItemWhere.order.orderDate as Record<string, Date>).lte = dateTo
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      orderItems: {
        where: orderItemWhere,
        select: {
          quantity: true,
          totalPrice: true,
          order: { select: { clientId: true, orderDate: true } },
        },
      },
    },
  })

  const monthsInRange = calculateMonthsInRange(dateFrom, dateTo)
  const rows = buildProductPerformanceRows(products, monthsInRange)

  rows.sort((a, b) => a.salesVelocity - b.salesVelocity)

  const cutoff = Math.max(1, Math.ceil(rows.length * thresholdPercent / 100))
  const slowMovers = rows.slice(0, cutoff)

  return slowMovers.map(({ uniqueClients: _u, totalRevenue: _r, ...rest }) => rest)
}
