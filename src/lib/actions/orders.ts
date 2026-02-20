'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { applyDiscount, sumDecimals, serialize } from '@/lib/utils/decimal'
import { orderCreateSchema } from '@/lib/validations/order'

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

  return serialize({ orders, total })
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  return serialize(order)
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

export async function createOrder(data: {
  clientId: string
  items: Array<{ productId: string; quantity: number }>
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const parsed = orderCreateSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Date invalide'
    return { success: false, error: firstError }
  }

  try {
    const client = await prisma.client.findUnique({ where: { id: data.clientId } })
    if (!client) {
      return { success: false, error: 'Clientul nu a fost găsit' }
    }

    const productIds = data.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const itemsData = data.items.map((item) => {
      const product = products.find((p: { id: string }) => p.id === item.productId)
      if (!product) throw new Error(`Produsul ${item.productId} nu a fost găsit`)

      const unitPrice = product.unitPrice
      const discount = client.discountPercent
      const effectivePrice = applyDiscount(unitPrice, discount)
      const totalPrice = effectivePrice.times(item.quantity)

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount,
        totalPrice,
      }
    })

    const totalAmount = sumDecimals(itemsData.map((i) => i.totalPrice))

    const order = await prisma.order.create({
      data: {
        clientId: data.clientId,
        orderDate: new Date(),
        totalAmount,
        notes: data.notes || null,
        items: { create: itemsData },
      },
    })

    revalidatePath('/orders')
    return { success: true, id: order.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Eroare la crearea comenzii',
    }
  }
}
