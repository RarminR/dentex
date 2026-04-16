import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { DEFAULT_ENGINE_CONFIG } from '@/lib/engine/defaults'

const d = (val: number | string) => new Prisma.Decimal(val)

function makeProducts(count: number) {
  const categories = ['Materiale Compozite', 'Instrumente', 'Consumabile', 'Implanturi']
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${i}`,
    name: `Product ${i}`,
    sku: `SKU-${String(i).padStart(4, '0')}`,
    category: categories[i % categories.length],
    description: null,
    unitPrice: d(50 + Math.random() * 450),
    acquisitionPrice: d(20 + Math.random() * 200),
    stockQty: 50 + Math.floor(Math.random() * 200),
    role: i < Math.round(count * 0.6) ? 'ANCHOR' : 'UPSELL',
    isActive: true,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  }))
}

function makeClientOrderItems(products: ReturnType<typeof makeProducts>, orderCount: number) {
  const items: Array<{
    id: string
    orderId: string
    productId: string
    quantity: number
    unitPrice: Prisma.Decimal
    discount: Prisma.Decimal
    totalPrice: Prisma.Decimal
    createdAt: Date
    order: { orderDate: Date }
  }> = []

  for (let o = 0; o < orderCount; o++) {
    const orderDate = new Date(2025, 6, 1 + o * 15)
    const itemsPerOrder = 3 + Math.floor(Math.random() * 6)
    const shuffled = [...products].sort(() => Math.random() - 0.5)

    for (let j = 0; j < itemsPerOrder && j < shuffled.length; j++) {
      const prod = shuffled[j]
      const qty = 1 + Math.floor(Math.random() * 10)
      items.push({
        id: `item-${o}-${j}`,
        orderId: `order-${o}`,
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.unitPrice,
        discount: d('10'),
        totalPrice: prod.unitPrice.times(qty).times(0.9),
        createdAt: orderDate,
        order: { orderDate },
      })
    }
  }

  return items
}

function makeGlobalOrderItems(products: ReturnType<typeof makeProducts>) {
  return products.flatMap((prod, i) => {
    const globalQty = 10 + Math.floor(Math.random() * 100)
    return [{
      id: `global-${i}`,
      productId: prod.id,
      quantity: globalQty,
    }]
  })
}

const mockPrisma = vi.hoisted(() => ({
  product: { findMany: vi.fn() },
  client: { findUnique: vi.fn() },
  orderItem: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

const { scoreProducts } = await import('@/lib/engine/scorer')
const { buildBundle } = await import('@/lib/engine/bundler')

describe('Offer generation performance benchmark', () => {
  const PRODUCT_COUNT = 50
  const ORDER_COUNT = 20

  let products: ReturnType<typeof makeProducts>
  let clientOrderItems: ReturnType<typeof makeClientOrderItems>
  let globalOrderItems: ReturnType<typeof makeGlobalOrderItems>

  beforeEach(() => {
    vi.clearAllMocks()

    products = makeProducts(PRODUCT_COUNT)
    clientOrderItems = makeClientOrderItems(products, ORDER_COUNT)
    globalOrderItems = makeGlobalOrderItems(products)

    mockPrisma.client.findUnique.mockResolvedValue({
      id: 'perf-client',
      companyName: 'Perf Test Clinic SRL',
      contactPerson: 'Dr. Benchmark',
      email: null,
      phone: null,
      address: null,
      city: 'Bucure\u0219ti',
      creditLimit: d('100000'),
      paymentTermsDays: 30,
      discountPercent: d('10'),
      notes: null,
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    })

    mockPrisma.product.findMany.mockResolvedValue(products)
    mockPrisma.orderItem.findMany
      .mockResolvedValueOnce(clientOrderItems)
      .mockResolvedValueOnce(globalOrderItems)
  })

  it(`scores ${PRODUCT_COUNT} products + builds bundle in under 3000ms`, async () => {
    const start = performance.now()

    const scored = await scoreProducts('perf-client', DEFAULT_ENGINE_CONFIG)

    expect(scored).toHaveLength(PRODUCT_COUNT)
    expect(scored[0].compositeScore).toBeGreaterThanOrEqual(scored[scored.length - 1].compositeScore)

    const clientAvgOrderSize = Math.round(clientOrderItems.length / ORDER_COUNT)

    const offer = buildBundle(scored, DEFAULT_ENGINE_CONFIG, clientAvgOrderSize)

    const elapsed = performance.now() - start

    expect(offer.items.length).toBeGreaterThanOrEqual(DEFAULT_ENGINE_CONFIG.minBundleSize)
    expect(offer.items.length).toBeLessThanOrEqual(DEFAULT_ENGINE_CONFIG.maxBundleSize)
    expect(offer.anchorCount).toBeGreaterThan(0)
    expect(offer.upsellCount).toBeGreaterThan(0)
    expect(offer.totalValue).toBeInstanceOf(Prisma.Decimal)
    expect(offer.totalMargin).toBeInstanceOf(Prisma.Decimal)

    expect(elapsed).toBeLessThan(3000)

    console.log(`[PERF] scoreProducts + buildBundle: ${elapsed.toFixed(2)}ms`)
    console.log(`[PERF] Products scored: ${scored.length}`)
    console.log(`[PERF] Bundle size: ${offer.items.length} (${offer.anchorCount} anchors + ${offer.upsellCount} upsells)`)
    console.log(`[PERF] Client order items: ${clientOrderItems.length} across ${ORDER_COUNT} orders`)
  })

  it('handles large product set without degradation', async () => {
    const times: number[] = []

    for (let run = 0; run < 5; run++) {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 'perf-client',
        discountPercent: d('10'),
      })
      mockPrisma.product.findMany.mockResolvedValue(products)
      mockPrisma.orderItem.findMany
        .mockResolvedValueOnce(clientOrderItems)
        .mockResolvedValueOnce(globalOrderItems)

      const start = performance.now()
      const scored = await scoreProducts('perf-client', DEFAULT_ENGINE_CONFIG)
      buildBundle(scored, DEFAULT_ENGINE_CONFIG, 5)
      times.push(performance.now() - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const max = Math.max(...times)

    console.log(`[PERF] 5-run avg: ${avg.toFixed(2)}ms, max: ${max.toFixed(2)}ms`)

    expect(max).toBeLessThan(3000)
    expect(avg).toBeLessThan(1000)
  })
})
