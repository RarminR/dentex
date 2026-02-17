'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from '@/lib/validations/product'

interface GetProductsParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
}

export async function getProducts({
  page = 1,
  pageSize = 10,
  search,
  category,
}: GetProductsParams) {
  const filters: Prisma.ProductWhereInput[] = []

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
      ],
    })
  }

  if (category) {
    filters.push({ category })
  }

  const where: Prisma.ProductWhereInput = filters.length > 0 ? { AND: filters } : {}

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ])

  return { data, total, page, pageSize }
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } })
}

type ActionResult = {
  success: boolean
  data?: Awaited<ReturnType<typeof prisma.product.create>> | null
  errors?: Record<string, string>
}

export async function createProduct(input: ProductCreateInput): Promise<ActionResult> {
  const parsed = productCreateSchema.safeParse(input)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString()
      if (key) errors[key] = issue.message
    }
    return { success: false, errors }
  }

  try {
    const data = await prisma.product.create({
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        category: parsed.data.category,
        description: parsed.data.description ?? null,
        unitPrice: new Prisma.Decimal(parsed.data.unitPrice),
        costPrice: new Prisma.Decimal(parsed.data.costPrice),
        stockQty: parsed.data.stockQty,
      },
    })

    revalidatePath('/products')
    return { success: true, data }
  } catch (e) {
    const prismaError = e as { code?: string }
    if (e instanceof Prisma.PrismaClientKnownRequestError && prismaError.code === 'P2002') {
      return { success: false, errors: { sku: 'Codul SKU există deja' } }
    }
    throw e
  }
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<ActionResult> {
  const parsed = productUpdateSchema.safeParse(input)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString()
      if (key) errors[key] = issue.message
    }
    return { success: false, errors }
  }

  const updateData: Record<string, unknown> = {}

  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.sku !== undefined) updateData.sku = parsed.data.sku
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description ?? null
  if (parsed.data.unitPrice !== undefined) updateData.unitPrice = new Prisma.Decimal(parsed.data.unitPrice)
  if (parsed.data.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(parsed.data.costPrice)
  if (parsed.data.stockQty !== undefined) updateData.stockQty = parsed.data.stockQty

  try {
    const data = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, data }
  } catch (e) {
    const prismaError = e as { code?: string }
    if (e instanceof Prisma.PrismaClientKnownRequestError && prismaError.code === 'P2002') {
      return { success: false, errors: { sku: 'Codul SKU există deja' } }
    }
    throw e
  }
}

export async function deactivateProduct(id: string): Promise<ActionResult> {
  const data = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  return { success: true, data }
}
