'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { clientCreateSchema, clientUpdateSchema } from '@/lib/validations/client'
import { revalidatePath } from 'next/cache'
import { serialize } from '@/lib/utils/decimal'

export interface ClientListParams {
  page?: number
  pageSize?: number
  search?: string
  city?: string
}

export interface ClientListResult {
  clients: ClientRow[]
  total: number
  page: number
  pageSize: number
}

export interface ClientRow {
  id: string
  companyName: string
  contactPerson: string
  city: string | null
  discountPercent: Prisma.Decimal
  isActive: boolean
}

export interface ClientFinancials {
  totalSpent: Prisma.Decimal
  totalPaid: Prisma.Decimal
  outstandingBalance: Prisma.Decimal
  avgOrderValue: Prisma.Decimal
  totalOrders: number
  profitabilityMargin: Prisma.Decimal
}

export interface ActionResult {
  success: boolean
  error?: string
  id?: string
}

export async function getClients(params: ClientListParams): Promise<ClientListResult> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10

  const where: Prisma.ClientWhereInput = {
    isActive: true,
    ...(params.search && {
      OR: [
        { companyName: { contains: params.search } },
        { contactPerson: { contains: params.search } },
      ],
    }),
    ...(params.city && { city: params.city }),
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        city: true,
        discountPercent: true,
        isActive: true,
      },
      orderBy: { companyName: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ])

  return serialize({ clients, total, page, pageSize })
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { orderDate: 'desc' },
        take: 20,
      },
    },
  })
  return serialize(client)
}

export async function getClientFinancials(id: string): Promise<ClientFinancials> {
  const zero = new Prisma.Decimal(0)

  const [aggregation, totalOrders, items] = await Promise.all([
    prisma.order.aggregate({
      where: { clientId: id },
      _sum: { totalAmount: true, paidAmount: true },
      _count: { id: true },
    }),
    prisma.order.count({ where: { clientId: id } }),
    prisma.orderItem.findMany({
      where: { order: { clientId: id } },
      select: {
        quantity: true,
        totalPrice: true,
        product: { select: { costPrice: true } },
      },
    }),
  ])

  const totalSpent = aggregation._sum.totalAmount ?? zero
  const totalPaid = aggregation._sum.paidAmount ?? zero
  const outstandingBalance = totalSpent.sub(totalPaid)
  const avgOrderValue = totalOrders > 0
    ? totalSpent.div(totalOrders)
    : zero

  let totalRevenue = zero
  let totalCost = zero
  for (const item of items) {
    totalRevenue = totalRevenue.add(item.totalPrice)
    totalCost = totalCost.add(item.product.costPrice.mul(item.quantity))
  }

  const profitabilityMargin = totalRevenue.gt(zero)
    ? totalRevenue.sub(totalCost).div(totalRevenue).mul(100)
    : zero

  return serialize({
    totalSpent,
    totalPaid,
    outstandingBalance,
    avgOrderValue,
    totalOrders,
    profitabilityMargin,
  })
}

export async function createClient(data: unknown): Promise<ActionResult> {
  const parsed = clientCreateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Date invalide' }
  }

  const { email, phone, address, city, notes, ...rest } = parsed.data

  const client = await prisma.client.create({
    data: {
      ...rest,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      notes: notes || null,
      creditLimit: new Prisma.Decimal(rest.creditLimit),
      discountPercent: new Prisma.Decimal(rest.discountPercent),
    },
  })

  revalidatePath('/clients')
  return { success: true, id: client.id }
}

export async function updateClient(data: unknown): Promise<ActionResult> {
  const parsed = clientUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Date invalide' }
  }

  const { id, email, phone, address, city, notes, creditLimit, discountPercent, ...rest } = parsed.data

  const updateData: Record<string, unknown> = { ...rest }
  if (email !== undefined) updateData.email = email || null
  if (phone !== undefined) updateData.phone = phone || null
  if (address !== undefined) updateData.address = address || null
  if (city !== undefined) updateData.city = city || null
  if (notes !== undefined) updateData.notes = notes || null
  if (creditLimit !== undefined) updateData.creditLimit = new Prisma.Decimal(creditLimit)
  if (discountPercent !== undefined) updateData.discountPercent = new Prisma.Decimal(discountPercent)

  await prisma.client.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true }
}

export async function deactivateClient(id: string): Promise<ActionResult> {
  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath('/clients')
  return { success: true }
}
