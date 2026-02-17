import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { createMockClient, createMockOrder, createMockOrderItem, createMockProduct } from '@/test/helpers'

const mockPrisma = {
  client: {
    findMany: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Admin' } }),
}))

const { getClientProfitability, getProductPerformance, getSlowMovers } = await import('./reports')

const d = (val: number | string) => new Prisma.Decimal(val)

describe('getClientProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates totalRevenue as sum of orderItem.totalPrice', async () => {
    // Client with 1 order, 2 items: totalPrice 500 + 300 = 800
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1', companyName: 'Clinica Alpha' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1', clientId: 'c1' }),
            items: [
              {
                ...createMockOrderItem({ totalPrice: d('500.00') }),
                product: createMockProduct({ costPrice: d('300.00') }),
              },
              {
                ...createMockOrderItem({ id: 'item-2', totalPrice: d('300.00'), quantity: 3 }),
                product: createMockProduct({ id: 'prod-2', costPrice: d('50.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    expect(result).toHaveLength(1)
    // totalRevenue = 500 + 300 = 800
    expect(result[0].totalRevenue).toBe('800.00')
  })

  it('calculates totalCost as sum(quantity × product.costPrice)', async () => {
    // Item 1: qty 10 × costPrice 300 = 3000
    // Item 2: qty 3 × costPrice 50 = 150
    // totalCost = 3150
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1', clientId: 'c1' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 10, totalPrice: d('1275.00') }),
                product: createMockProduct({ costPrice: d('300.00') }),
              },
              {
                ...createMockOrderItem({ id: 'item-2', quantity: 3, totalPrice: d('300.00') }),
                product: createMockProduct({ id: 'prod-2', costPrice: d('50.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    // totalCost = (10 × 300) + (3 × 50) = 3000 + 150 = 3150
    expect(result[0].totalCost).toBe('3150.00')
  })

  it('calculates profit as totalRevenue - totalCost', async () => {
    // revenue = 1000, cost = 10 × 60 = 600, profit = 400
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 10, totalPrice: d('1000.00') }),
                product: createMockProduct({ costPrice: d('60.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    // profit = 1000 - (10 × 60) = 1000 - 600 = 400
    expect(result[0].profit).toBe('400.00')
  })

  it('calculates marginPercent as (profit / totalRevenue) × 100', async () => {
    // revenue = 1000, cost = 600, profit = 400
    // margin = (400 / 1000) × 100 = 40%
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 10, totalPrice: d('1000.00') }),
                product: createMockProduct({ costPrice: d('60.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    // marginPercent = (400 / 1000) × 100 = 40
    expect(result[0].marginPercent).toBe('40.00')
  })

  it('handles zero revenue (marginPercent = 0)', async () => {
    // Client with no orders
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [],
      },
    ])

    const result = await getClientProfitability({})

    expect(result[0].totalRevenue).toBe('0.00')
    expect(result[0].totalCost).toBe('0.00')
    expect(result[0].profit).toBe('0.00')
    expect(result[0].marginPercent).toBe('0.00')
    expect(result[0].orderCount).toBe(0)
  })

  it('sorts by profit descending', async () => {
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1', companyName: 'Low Profit' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 1, totalPrice: d('100.00') }),
                product: createMockProduct({ costPrice: d('90.00') }),
              },
            ],
          },
        ],
      },
      {
        ...createMockClient({ id: 'c2', companyName: 'High Profit' }),
        orders: [
          {
            ...createMockOrder({ id: 'o2', clientId: 'c2' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 10, totalPrice: d('5000.00') }),
                product: createMockProduct({ costPrice: d('100.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    expect(result).toHaveLength(2)
    // High Profit: profit = 5000 - (10×100) = 4000
    // Low Profit: profit = 100 - (1×90) = 10
    expect(result[0].clientName).toBe('High Profit')
    expect(result[1].clientName).toBe('Low Profit')
  })

  it('counts orders correctly', async () => {
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1' }),
            items: [
              {
                ...createMockOrderItem({ totalPrice: d('100.00'), quantity: 1 }),
                product: createMockProduct({ costPrice: d('50.00') }),
              },
            ],
          },
          {
            ...createMockOrder({ id: 'o2' }),
            items: [
              {
                ...createMockOrderItem({ totalPrice: d('200.00'), quantity: 2 }),
                product: createMockProduct({ costPrice: d('50.00') }),
              },
            ],
          },
          {
            ...createMockOrder({ id: 'o3' }),
            items: [
              {
                ...createMockOrderItem({ totalPrice: d('300.00'), quantity: 3 }),
                product: createMockProduct({ costPrice: d('50.00') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    expect(result[0].orderCount).toBe(3)
  })

  it('passes date range filter to Prisma query', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])

    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-06-30')
    await getClientProfitability({ dateFrom, dateTo })

    const callArgs = mockPrisma.client.findMany.mock.calls[0][0]
    const ordersWhere = callArgs.include.orders.where

    expect(ordersWhere.orderDate.gte).toEqual(dateFrom)
    expect(ordersWhere.orderDate.lte).toEqual(dateTo)
  })

  it('respects limit parameter', async () => {
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1', companyName: 'A' }),
        orders: [{ ...createMockOrder({ id: 'o1' }), items: [{ ...createMockOrderItem({ quantity: 10, totalPrice: d('5000.00') }), product: createMockProduct({ costPrice: d('100.00') }) }] }],
      },
      {
        ...createMockClient({ id: 'c2', companyName: 'B' }),
        orders: [{ ...createMockOrder({ id: 'o2' }), items: [{ ...createMockOrderItem({ quantity: 5, totalPrice: d('2000.00') }), product: createMockProduct({ costPrice: d('100.00') }) }] }],
      },
      {
        ...createMockClient({ id: 'c3', companyName: 'C' }),
        orders: [{ ...createMockOrder({ id: 'o3' }), items: [{ ...createMockOrderItem({ quantity: 1, totalPrice: d('100.00') }), product: createMockProduct({ costPrice: d('50.00') }) }] }],
      },
    ])

    const result = await getClientProfitability({ limit: 2 })

    expect(result).toHaveLength(2)
  })

  it('uses Decimal arithmetic — no floating point errors', async () => {
    // Classic float problem: 0.1 + 0.2 !== 0.3
    // revenue = 0.30, cost = 1 × 0.10 = 0.10, profit = 0.20
    // margin = (0.20 / 0.30) × 100 = 66.666...
    mockPrisma.client.findMany.mockResolvedValue([
      {
        ...createMockClient({ id: 'c1' }),
        orders: [
          {
            ...createMockOrder({ id: 'o1' }),
            items: [
              {
                ...createMockOrderItem({ quantity: 1, totalPrice: d('0.30') }),
                product: createMockProduct({ costPrice: d('0.10') }),
              },
            ],
          },
        ],
      },
    ])

    const result = await getClientProfitability({})

    expect(result[0].totalRevenue).toBe('0.30')
    expect(result[0].totalCost).toBe('0.10')
    expect(result[0].profit).toBe('0.20')
    // 66.6666... rounded to 2 decimal places
    expect(result[0].marginPercent).toBe('66.67')
  })
})

describe('getProductPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates salesVelocity as totalUnitsSold / monthsInRange', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01') // 90 days = 3 months

    mockPrisma.product.findMany.mockResolvedValue([
      {
        ...createMockProduct({ id: 'prod-1', name: 'Compozit A', category: 'Materiale Compozite' }),
        orderItems: [
          {
            quantity: 60,
            totalPrice: d('9000.00'),
            order: { clientId: 'client-1', orderDate: new Date('2025-02-01') },
          },
          {
            quantity: 60,
            totalPrice: d('9000.00'),
            order: { clientId: 'client-2', orderDate: new Date('2025-03-01') },
          },
        ],
      },
    ])

    const result = await getProductPerformance({ dateFrom, dateTo })

    expect(result).toHaveLength(1)
    expect(result[0].totalUnitsSold).toBe(120)
    expect(result[0].uniqueClients).toBe(2)
    expect(result[0].totalRevenue).toBe(18000)
    // salesVelocity = 120 / (90/30) = 120 / 3 = 40
    expect(result[0].salesVelocity).toBe(40)
  })

  it('uses minimum 1 month for salesVelocity when range < 30 days', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-01-15') // 15 days < 30 → minimum 1 month

    mockPrisma.product.findMany.mockResolvedValue([
      {
        ...createMockProduct({ id: 'prod-1', name: 'Compozit A' }),
        orderItems: [
          {
            quantity: 10,
            totalPrice: d('1500.00'),
            order: { clientId: 'client-1', orderDate: new Date('2025-01-10') },
          },
        ],
      },
    ])

    const result = await getProductPerformance({ dateFrom, dateTo })

    // salesVelocity = 10 / 1 (minimum) = 10
    expect(result[0].salesVelocity).toBe(10)
  })

  it('returns salesVelocity 0 for products with no orders', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      {
        ...createMockProduct({ id: 'prod-1', name: 'Compozit A' }),
        orderItems: [],
      },
    ])

    const result = await getProductPerformance({
      dateFrom: new Date('2025-01-01'),
      dateTo: new Date('2025-04-01'),
    })

    expect(result).toHaveLength(1)
    expect(result[0].totalUnitsSold).toBe(0)
    expect(result[0].uniqueClients).toBe(0)
    expect(result[0].totalRevenue).toBe(0)
    expect(result[0].salesVelocity).toBe(0)
  })

  it('sorts by salesVelocity descending', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01')

    mockPrisma.product.findMany.mockResolvedValue([
      {
        ...createMockProduct({ id: 'prod-slow', name: 'Slow' }),
        orderItems: [
          { quantity: 3, totalPrice: d('300.00'), order: { clientId: 'c-1', orderDate: new Date('2025-02-01') } },
        ],
      },
      {
        ...createMockProduct({ id: 'prod-fast', name: 'Fast' }),
        orderItems: [
          { quantity: 90, totalPrice: d('9000.00'), order: { clientId: 'c-1', orderDate: new Date('2025-02-01') } },
        ],
      },
    ])

    const result = await getProductPerformance({ dateFrom, dateTo })

    expect(result[0].productName).toBe('Fast')
    expect(result[1].productName).toBe('Slow')
  })
})

describe('getSlowMovers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns bottom 20% of products by salesVelocity', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01') // 90 days = 3 months

    const products = Array.from({ length: 5 }, (_, i) => ({
      ...createMockProduct({
        id: `prod-${i}`,
        name: `Product ${i}`,
        category: 'Consumabile',
        stockQty: 50,
      }),
      orderItems: [
        {
          quantity: (i + 1) * 30, // velocities: 10, 20, 30, 40, 50
          totalPrice: d(String((i + 1) * 3000)),
          order: { clientId: 'c-1', orderDate: new Date('2025-02-01') },
        },
      ],
    }))

    mockPrisma.product.findMany.mockResolvedValue(products)

    const result = await getSlowMovers({ dateFrom, dateTo })

    // Bottom 20% of 5 products = 1 product (Product 0, velocity=10)
    expect(result).toHaveLength(1)
    expect(result[0].productName).toBe('Product 0')
    expect(result[0].salesVelocity).toBe(10)
  })

  it('sorts slow movers by salesVelocity ascending (slowest first)', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01')

    const products = Array.from({ length: 10 }, (_, i) => ({
      ...createMockProduct({
        id: `prod-${i}`,
        name: `Product ${i}`,
        stockQty: 100,
      }),
      orderItems: [
        {
          quantity: (i + 1) * 30, // velocities: 10,20,...,100
          totalPrice: d(String((i + 1) * 3000)),
          order: { clientId: 'c-1', orderDate: new Date('2025-02-01') },
        },
      ],
    }))

    mockPrisma.product.findMany.mockResolvedValue(products)

    const result = await getSlowMovers({ dateFrom, dateTo })

    // Bottom 20% of 10 = 2 products, sorted ascending
    expect(result).toHaveLength(2)
    expect(result[0].salesVelocity).toBeLessThanOrEqual(result[1].salesVelocity)
    expect(result[0].productName).toBe('Product 0')
    expect(result[1].productName).toBe('Product 1')
  })

  it('includes stock, category, and lastOrderDate in output', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01')
    const lastDate = new Date('2025-02-15')

    mockPrisma.product.findMany.mockResolvedValue([
      {
        ...createMockProduct({
          id: 'prod-0',
          name: 'Slow Item',
          category: 'Instrumente',
          stockQty: 25,
        }),
        orderItems: [
          {
            quantity: 3,
            totalPrice: d('450.00'),
            order: { clientId: 'c-1', orderDate: lastDate },
          },
        ],
      },
    ])

    // thresholdPercent 100 = include all products
    const result = await getSlowMovers({ dateFrom, dateTo, thresholdPercent: 100 })

    expect(result[0].category).toBe('Instrumente')
    expect(result[0].stockQty).toBe(25)
    expect(result[0].lastOrderDate).toEqual(lastDate)
    expect(result[0].totalUnitsSold).toBe(3)
  })

  it('uses custom threshold percentage', async () => {
    const dateFrom = new Date('2025-01-01')
    const dateTo = new Date('2025-04-01')

    const products = Array.from({ length: 10 }, (_, i) => ({
      ...createMockProduct({ id: `prod-${i}`, name: `Product ${i}` }),
      orderItems: [
        {
          quantity: (i + 1) * 30,
          totalPrice: d(String((i + 1) * 3000)),
          order: { clientId: 'c-1', orderDate: new Date('2025-02-01') },
        },
      ],
    }))

    mockPrisma.product.findMany.mockResolvedValue(products)

    // 50% threshold = bottom 5 of 10
    const result = await getSlowMovers({ dateFrom, dateTo, thresholdPercent: 50 })

    expect(result).toHaveLength(5)
  })
})
