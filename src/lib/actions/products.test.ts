import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockProduct } from '@/test/helpers'
import { Prisma } from '@prisma/client'

const mockPrisma = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { getProducts, getProduct, createProduct, updateProduct, deactivateProduct } from './products'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProducts', () => {
  it('returns paginated results with defaults', async () => {
    const products = [createMockProduct(), createMockProduct({ id: 'product-2', sku: 'TEST-002' })]
    mockPrisma.product.findMany.mockResolvedValue(products)
    mockPrisma.product.count.mockResolvedValue(2)

    const result = await getProducts({})

    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('applies page and pageSize correctly', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(25)

    const result = await getProducts({ page: 3, pageSize: 5 })

    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(5)
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      })
    )
  })

  it('filters by search term across name and sku', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await getProducts({ search: 'compozit' })

    const call = mockPrisma.product.findMany.mock.calls[0][0]
    expect(call.where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [
            { name: { contains: 'compozit' } },
            { sku: { contains: 'compozit' } },
          ],
        }),
      ])
    )
  })

  it('filters by category', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await getProducts({ category: 'Instrumente' })

    const call = mockPrisma.product.findMany.mock.calls[0][0]
    expect(call.where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Instrumente' }),
      ])
    )
  })

  it('combines search and category filters', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    await getProducts({ search: 'test', category: 'Consumabile' })

    const call = mockPrisma.product.findMany.mock.calls[0][0]
    expect(call.where.AND).toHaveLength(2)
  })
})

describe('getProduct', () => {
  it('returns a product by id', async () => {
    const product = createMockProduct()
    mockPrisma.product.findUnique.mockResolvedValue(product)

    const result = await getProduct('product-1')

    expect(result).toBeTruthy()
    expect(result!.id).toBe(product.id)
    expect(result!.name).toBe(product.name)
    expect(result!.sku).toBe(product.sku)
    expect(String(result!.unitPrice)).toBe(String(product.unitPrice))
    expect(String(result!.acquisitionPrice)).toBe(String(product.acquisitionPrice))
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-1' },
    })
  })

  it('returns null for non-existent product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const result = await getProduct('does-not-exist')

    expect(result).toBeNull()
  })
})

describe('createProduct', () => {
  it('creates a product with valid data', async () => {
    const product = createMockProduct()
    mockPrisma.product.create.mockResolvedValue(product)

    const result = await createProduct({
      name: 'Compozit Test',
      sku: 'TEST-001',
      category: 'Materiale Compozite',
      unitPrice: '150.00',
      acquisitionPrice: '90.00',
      stockQty: 100,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual(product)
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Compozit Test',
        sku: 'TEST-001',
        category: 'Materiale Compozite',
        unitPrice: expect.any(Prisma.Decimal),
        acquisitionPrice: expect.any(Prisma.Decimal),
        stockQty: 100,
      }),
    })
  })

  it('rejects empty name', async () => {
    const result = await createProduct({
      name: '',
      sku: 'TEST-001',
      category: 'Materiale Compozite',
      unitPrice: '150.00',
      acquisitionPrice: '90.00',
      stockQty: 100,
    })

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(mockPrisma.product.create).not.toHaveBeenCalled()
  })

  it('accepts any category string', async () => {
    const product = createMockProduct()
    mockPrisma.product.create.mockResolvedValue(product)

    const result = await createProduct({
      name: 'Test',
      sku: 'TEST-001',
      category: 'CustomCategory',
      unitPrice: '150.00',
      stockQty: 100,
    })

    expect(result.success).toBe(true)
  })

  it('rejects negative price', async () => {
    const result = await createProduct({
      name: 'Test',
      sku: 'TEST-001',
      category: 'Materiale Compozite',
      unitPrice: '-10',
      acquisitionPrice: '90.00',
      stockQty: 100,
    })

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('rejects negative stock', async () => {
    const result = await createProduct({
      name: 'Test',
      sku: 'TEST-001',
      category: 'Materiale Compozite',
      unitPrice: '150.00',
      acquisitionPrice: '90.00',
      stockQty: -5,
    })

    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('returns error on duplicate SKU', async () => {
    mockPrisma.product.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.22.0',
        meta: { target: ['sku'] },
      })
    )

    const result = await createProduct({
      name: 'Test',
      sku: 'DUPLICATE',
      category: 'Materiale Compozite',
      unitPrice: '150.00',
      acquisitionPrice: '90.00',
      stockQty: 100,
    })

    expect(result.success).toBe(false)
    expect(result.errors?.sku).toBeDefined()
  })
})

describe('updateProduct', () => {
  it('updates a product with partial data', async () => {
    const updated = createMockProduct({ name: 'Updated Name' })
    mockPrisma.product.update.mockResolvedValue(updated)

    const result = await updateProduct('product-1', { name: 'Updated Name' })

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Updated Name')
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: expect.objectContaining({ name: 'Updated Name' }),
    })
  })

  it('converts price strings to Decimal on update', async () => {
    const updated = createMockProduct()
    mockPrisma.product.update.mockResolvedValue(updated)

    await updateProduct('product-1', { unitPrice: '200.00' })

    const call = mockPrisma.product.update.mock.calls[0][0]
    expect(call.data.unitPrice).toBeInstanceOf(Prisma.Decimal)
  })
})

describe('deactivateProduct', () => {
  it('sets isActive to false (soft-delete)', async () => {
    const deactivated = createMockProduct({ isActive: false })
    mockPrisma.product.update.mockResolvedValue(deactivated)

    const result = await deactivateProduct('product-1')

    expect(result.success).toBe(true)
    expect(result.data?.isActive).toBe(false)
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { isActive: false },
    })
  })
})
