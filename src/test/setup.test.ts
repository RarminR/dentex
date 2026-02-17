import { describe, it, expect } from 'vitest'
import { createMockProduct, createMockClient } from './helpers'
import { Prisma } from '@prisma/client'

describe('Test infrastructure', () => {
  it('createMockProduct returns valid product', () => {
    const product = createMockProduct()
    expect(product.id).toBe('product-1')
    expect(product.name).toBe('Compozit Test')
    expect(product.unitPrice).toBeInstanceOf(Prisma.Decimal)
    expect(product.isActive).toBe(true)
  })

  it('createMockProduct accepts overrides', () => {
    const product = createMockProduct({
      name: 'Custom Product',
      unitPrice: new Prisma.Decimal('200.00'),
    })
    expect(product.name).toBe('Custom Product')
    expect(product.unitPrice.toNumber()).toBe(200)
  })

  it('createMockClient returns valid client', () => {
    const client = createMockClient()
    expect(client.companyName).toBe('Clinica Test SRL')
    expect(client.discountPercent).toBeInstanceOf(Prisma.Decimal)
  })

  it('createMockClient accepts discount override', () => {
    const client = createMockClient({
      discountPercent: new Prisma.Decimal('20.00'),
    })
    expect(client.discountPercent.toNumber()).toBe(20)
  })
})
