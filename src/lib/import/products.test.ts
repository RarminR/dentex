import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

const mockPrisma = vi.hoisted(() => ({
  product: {
    upsert: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

import { processProductImport } from './products'
import type { ProductImportRow } from './products'

beforeEach(() => {
  vi.clearAllMocks()
})

function makeValidRow(overrides: Partial<ProductImportRow> = {}): ProductImportRow {
  return {
    name: 'Compozit A2',
    sku: 'COMP-001',
    category: 'Materiale Compozite',
    unitPrice: '150.00',
    costPrice: '90.00',
    stockQty: 100,
    description: null,
    ...overrides,
  }
}

describe('processProductImport', () => {
  it('creates new products when SKU does not exist', async () => {
    const now = new Date()
    mockPrisma.product.upsert.mockResolvedValue({
      id: 'new-1',
      name: 'Compozit A2',
      sku: 'COMP-001',
      category: 'Materiale Compozite',
      unitPrice: new Prisma.Decimal('150.00'),
      costPrice: new Prisma.Decimal('90.00'),
      stockQty: 100,
      description: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const result = await processProductImport([makeValidRow()])

    expect(result.imported).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(mockPrisma.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sku: 'COMP-001' },
        create: expect.objectContaining({
          name: 'Compozit A2',
          sku: 'COMP-001',
          category: 'Materiale Compozite',
          unitPrice: expect.any(Prisma.Decimal),
          costPrice: expect.any(Prisma.Decimal),
          stockQty: 100,
        }),
        update: expect.objectContaining({
          name: 'Compozit A2',
          category: 'Materiale Compozite',
          unitPrice: expect.any(Prisma.Decimal),
          costPrice: expect.any(Prisma.Decimal),
          stockQty: 100,
        }),
      }),
    )
  })

  it('counts as updated when createdAt differs from updatedAt', async () => {
    mockPrisma.product.upsert.mockResolvedValue({
      id: 'existing-1',
      name: 'Updated Name',
      sku: 'EXISTING-001',
      category: 'Materiale Compozite',
      unitPrice: new Prisma.Decimal('150.00'),
      costPrice: new Prisma.Decimal('90.00'),
      stockQty: 100,
      description: null,
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2026-02-18'),
    })

    const result = await processProductImport([
      makeValidRow({ sku: 'EXISTING-001', name: 'Updated Name' }),
    ])

    expect(result.imported).toBe(0)
    expect(result.updated).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it('processes multiple rows', async () => {
    const now = new Date()
    mockPrisma.product.upsert.mockResolvedValue({
      id: 'prod',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const rows = [
      makeValidRow({ sku: 'SKU-001', name: 'Product 1' }),
      makeValidRow({ sku: 'SKU-002', name: 'Product 2' }),
      makeValidRow({ sku: 'SKU-003', name: 'Product 3' }),
    ]

    const result = await processProductImport(rows)

    expect(result.imported).toBe(3)
    expect(mockPrisma.product.upsert).toHaveBeenCalledTimes(3)
  })

  it('skips invalid rows and collects errors', async () => {
    const now = new Date()
    mockPrisma.product.upsert.mockResolvedValue({
      id: 'prod',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const rows = [
      makeValidRow({ sku: 'GOOD-001' }),
      makeValidRow({ sku: '', name: '' }),
      makeValidRow({ sku: 'GOOD-002' }),
    ]

    const result = await processProductImport(rows)

    expect(result.imported).toBe(2)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].row).toBe(3)
  })

  it('handles DB errors for individual rows gracefully', async () => {
    const now = new Date()
    mockPrisma.product.upsert
      .mockResolvedValueOnce({ id: 'ok-1', createdAt: now, updatedAt: now })
      .mockRejectedValueOnce(new Error('DB constraint error'))

    const rows = [
      makeValidRow({ sku: 'OK-001' }),
      makeValidRow({ sku: 'FAIL-001' }),
    ]

    const result = await processProductImport(rows)

    expect(result.imported).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('DB constraint error')
  })

  it('returns correct column mapping for Romanian headers', async () => {
    const { PRODUCT_CSV_COLUMNS } = await import('./products')

    expect(PRODUCT_CSV_COLUMNS).toEqual({
      'Nume': 'name',
      'SKU': 'sku',
      'Categorie': 'category',
      'Preț Vânzare': 'unitPrice',
      'Preț Achiziție': 'costPrice',
      'Stoc': 'stockQty',
      'Descriere': 'description',
    })
  })
})
