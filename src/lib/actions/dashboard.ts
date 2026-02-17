'use server'

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

interface DashboardKPIs {
  totalRevenue: string
  orderCount: number
  activeClients: number
  outstandingPayments: string
  revenueChange: number | null
  orderCountChange: number | null
}

interface TopClient {
  clientId: string
  companyName: string
  revenue: string
}

interface SlowMover {
  productId: string
  name: string
  category: string
  salesVelocity: number
  stockQty: number
}

interface RecentOrder {
  id: string
  clientName: string
  orderDate: string
  totalAmount: string
  status: string
}

interface DashboardData {
  kpis: DashboardKPIs
  topClients: TopClient[]
  slowMovers: SlowMover[]
  recentOrders: RecentOrder[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const ZERO = new Decimal(0)

  const [
    currentMonthOrders,
    lastMonthOrders,
    activeClients,
    unpaidOrders,
    clientsWithOrders,
    products,
    recentOrdersRaw,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { orderDate: { gte: currentMonthStart } },
    }),
    prisma.order.findMany({
      where: { orderDate: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    prisma.client.count({ where: { isActive: true } }),
    prisma.order.findMany({ where: { isPaid: false } }),
    prisma.client.findMany({
      where: { isActive: true },
      include: {
        orders: { where: { orderDate: { gte: currentMonthStart } } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        orderItems: {
          include: { order: { select: { orderDate: true } } },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 10,
      include: { client: { select: { companyName: true } } },
    }),
  ])

  const totalRevenue = currentMonthOrders.reduce(
    (sum, o) => sum.plus(o.totalAmount),
    ZERO
  )
  const orderCount = currentMonthOrders.length

  const lastMonthRevenue = lastMonthOrders.reduce(
    (sum, o) => sum.plus(o.totalAmount),
    ZERO
  )
  const lastMonthOrderCount = lastMonthOrders.length

  const outstandingPayments = unpaidOrders.reduce(
    (sum, o) => sum.plus(new Decimal(o.totalAmount.toString()).minus(new Decimal(o.paidAmount.toString()))),
    ZERO
  )

  const revenueChange = lastMonthRevenue.equals(ZERO)
    ? null
    : Number(
        totalRevenue
          .minus(lastMonthRevenue)
          .dividedBy(lastMonthRevenue)
          .times(100)
          .toFixed(1)
      )

  const orderCountChange =
    lastMonthOrderCount === 0
      ? null
      : Math.round(
          ((orderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100
        )

  const topClients: TopClient[] = clientsWithOrders
    .map((client) => ({
      clientId: client.id,
      companyName: client.companyName,
      revenue: client.orders
        .reduce((sum, o) => sum.plus(o.totalAmount), ZERO)
        .toFixed(2),
    }))
    .filter((c) => parseFloat(c.revenue) > 0)
    .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
    .slice(0, 5)

  const twelveMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 12,
    now.getDate()
  )
  const daysDiff = Math.max(
    1,
    Math.round(
      (now.getTime() - twelveMonthsAgo.getTime()) / (1000 * 60 * 60 * 24)
    )
  )
  const monthsInRange = Math.max(1, daysDiff / 30)

  const slowMovers: SlowMover[] = products
    .map((product) => {
      const totalUnitsSold = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      const salesVelocity =
        totalUnitsSold === 0
          ? 0
          : Math.round((totalUnitsSold / monthsInRange) * 100) / 100

      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        salesVelocity,
        stockQty: product.stockQty,
      }
    })
    .sort((a, b) => a.salesVelocity - b.salesVelocity)
    .slice(0, 5)

  const recentOrders: RecentOrder[] = recentOrdersRaw.map((o) => ({
    id: o.id,
    clientName: o.client.companyName,
    orderDate: o.orderDate.toISOString(),
    totalAmount: o.totalAmount.toFixed(2),
    status: o.status,
  }))

  return {
    kpis: {
      totalRevenue: totalRevenue.toFixed(2),
      orderCount,
      activeClients,
      outstandingPayments: outstandingPayments.toFixed(2),
      revenueChange,
      orderCountChange,
    },
    topClients,
    slowMovers,
    recentOrders,
  }
}
