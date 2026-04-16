'use server'

import { prisma } from '@/lib/prisma'
import { serialize } from '@/lib/utils/decimal'

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
  category: string | null
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

  const [
    currentMonthAgg,
    currentMonthCount,
    lastMonthAgg,
    lastMonthCount,
    activeClients,
    outstandingAgg,
    topClientsRaw,
    slowMoversRaw,
    recentOrdersRaw,
  ] = await Promise.all([
    // Current month revenue (aggregate instead of loading all rows)
    prisma.order.aggregate({
      where: { orderDate: { gte: currentMonthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { orderDate: { gte: currentMonthStart } },
    }),
    // Last month revenue
    prisma.order.aggregate({
      where: { orderDate: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { orderDate: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    // Active clients count
    prisma.client.count({ where: { isActive: true } }),
    // Outstanding payments (aggregate instead of loading all unpaid orders)
    prisma.order.aggregate({
      where: { isPaid: false },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    // Top 5 clients by revenue (use groupBy instead of loading all clients+orders)
    prisma.order.groupBy({
      by: ['clientId'],
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    // Slow movers: products with least order items (use groupBy + count)
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        stockQty: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { orderItems: { _count: 'asc' } },
      take: 5,
    }),
    // Recent orders (already efficient, just limit)
    prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 10,
      include: { client: { select: { companyName: true } } },
    }),
  ])

  const totalRevenue = Number(currentMonthAgg._sum.totalAmount ?? 0)
  const lastMonthRevenue = Number(lastMonthAgg._sum.totalAmount ?? 0)
  const outstandingTotal = Number(outstandingAgg._sum.totalAmount ?? 0)
  const outstandingPaid = Number(outstandingAgg._sum.paidAmount ?? 0)

  const revenueChange = lastMonthRevenue === 0
    ? null
    : Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10

  const orderCountChange = lastMonthCount === 0
    ? null
    : Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100)

  // Fetch client names for top clients
  const topClientIds = topClientsRaw.map((r) => r.clientId)
  const clientNames = topClientIds.length > 0
    ? await prisma.client.findMany({
        where: { id: { in: topClientIds } },
        select: { id: true, companyName: true },
      })
    : []
  const nameMap = new Map(clientNames.map((c) => [c.id, c.companyName]))

  const topClients: TopClient[] = topClientsRaw.map((r) => ({
    clientId: r.clientId,
    companyName: nameMap.get(r.clientId) ?? 'Necunoscut',
    revenue: (Number(r._sum.totalAmount) || 0).toFixed(2),
  }))

  const now12mo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
  const monthsInRange = Math.max(1, Math.round((now.getTime() - now12mo.getTime()) / (1000 * 60 * 60 * 24)) / 30)

  const slowMovers: SlowMover[] = slowMoversRaw.map((p) => ({
    productId: p.id,
    name: p.name,
    category: p.category,
    salesVelocity: Math.round((p._count.orderItems / monthsInRange) * 100) / 100,
    stockQty: p.stockQty,
  }))

  const recentOrders: RecentOrder[] = recentOrdersRaw.map((o) => ({
    id: o.id,
    clientName: o.client.companyName,
    orderDate: o.orderDate.toISOString(),
    totalAmount: o.totalAmount.toFixed(2),
    status: o.status,
  }))

  return serialize({
    kpis: {
      totalRevenue: totalRevenue.toFixed(2),
      orderCount: currentMonthCount,
      activeClients,
      outstandingPayments: (outstandingTotal - outstandingPaid).toFixed(2),
      revenueChange,
      orderCountChange,
    },
    topClients,
    slowMovers,
    recentOrders,
  })
}
