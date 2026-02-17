'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface GetOrdersParams {
  page?: number
  pageSize?: number
  search?: string
  clientId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export async function getOrders({
  page = 1,
  pageSize = 10,
  search,
  clientId,
  status,
  dateFrom,
  dateTo,
}: GetOrdersParams) {
  const where: Prisma.OrderWhereInput = {}

  if (status) {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (dateFrom || dateTo) {
    where.orderDate = {}
    if (dateFrom) {
      where.orderDate.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.orderDate.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  if (search) {
    where.client = {
      companyName: { contains: search },
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { client: true },
      orderBy: { orderDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total }
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function updateOrderPayment(id: string, paidAmount: string) {
  const order = await prisma.order.findUnique({ where: { id } })

  if (!order) {
    throw new Error('Comanda nu a fost găsită')
  }

  const newPaidAmount = new Prisma.Decimal(paidAmount)
  const isPaid = newPaidAmount.gte(order.totalAmount)

  return prisma.order.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      isPaid,
    },
  })
}

export async function getClientsForFilter() {
  return prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  })
}
