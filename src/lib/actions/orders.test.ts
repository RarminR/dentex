import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { createMockOrder, createMockClient, createMockOrderItem, createMockProduct } from '@/test/helpers'

const mockPrisma = {
  order: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Admin' } }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const { getOrders, getOrder, updateOrderPayment, createOrder } = await import('./orders')

const d = (val: number | string) => new Prisma.Decimal(val)

describe('getOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated orders with defaults (page 1, pageSize 10)', async () => {
    const mockOrders = [
      {
        ...createMockOrder({ id: 'order-1', status: 'DELIVERED' }),
        client: createMockClient({ companyName: 'Clinica A' }),
      },
      {
        ...createMockOrder({ id: 'order-2', status: 'PENDING' }),
        client: createMockClient({ companyName: 'Clinica B' }),
      },
    ]
    mockPrisma.order.findMany.mockResolvedValue(mockOrders)
    mockPrisma.order.count.mockResolvedValue(2)

    const result = await getOrders({})

    expect(result.orders).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        include: expect.objectContaining({ client: true }),
        orderBy: { orderDate: 'desc' },
      })
    )
  })

  it('filters by status', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    await getOrders({ status: 'PENDING' })

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0]
    expect(callArgs.where.status).toBe('PENDING')
  })

  it('filters by clientId', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    await getOrders({ clientId: 'client-42' })

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0]
    expect(callArgs.where.clientId).toBe('client-42')
  })

  it('filters by date range', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    const dateFrom = '2025-01-01'
    const dateTo = '2025-06-30'
    await getOrders({ dateFrom, dateTo })

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0]
    expect(callArgs.where.orderDate.gte).toEqual(new Date(dateFrom))
    expect(callArgs.where.orderDate.lte).toEqual(new Date(dateTo + 'T23:59:59.999Z'))
  })

  it('filters by search (client company name)', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(0)

    await getOrders({ search: 'Clinica' })

    const callArgs = mockPrisma.order.findMany.mock.calls[0][0]
    expect(callArgs.where.client.companyName.contains).toBe('Clinica')
  })

  it('paginates correctly on page 2', async () => {
    mockPrisma.order.findMany.mockResolvedValue([])
    mockPrisma.order.count.mockResolvedValue(25)

    const result = await getOrders({ page: 2, pageSize: 10 })

    expect(result.total).toBe(25)
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })
})

describe('getOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns order with items and client', async () => {
    const mockOrder = {
      ...createMockOrder({ id: 'order-1' }),
      client: createMockClient(),
      items: [
        {
          ...createMockOrderItem({ id: 'item-1' }),
          product: createMockProduct({ name: 'Compozit A' }),
        },
      ],
    }
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder)

    const result = await getOrder('order-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('order-1')
    expect(result!.client.companyName).toBe('Clinica Test SRL')
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0].product.name).toBe('Compozit A')
  })

  it('returns null for non-existent order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)

    const result = await getOrder('non-existent')

    expect(result).toBeNull()
  })
})

describe('updateOrderPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks order as paid when paidAmount equals totalAmount', async () => {
    const existingOrder = createMockOrder({
      id: 'order-1',
      totalAmount: d('1000.00'),
      paidAmount: d('0'),
      isPaid: false,
    })
    mockPrisma.order.findUnique.mockResolvedValue(existingOrder)
    mockPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      paidAmount: d('1000.00'),
      isPaid: true,
    })

    const result = await updateOrderPayment('order-1', '1000.00')

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        paidAmount: expect.any(Prisma.Decimal),
        isPaid: true,
      },
    })
    expect(result.isPaid).toBe(true)
  })

  it('keeps isPaid false when paidAmount < totalAmount', async () => {
    const existingOrder = createMockOrder({
      id: 'order-2',
      totalAmount: d('1000.00'),
      paidAmount: d('0'),
      isPaid: false,
    })
    mockPrisma.order.findUnique.mockResolvedValue(existingOrder)
    mockPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      paidAmount: d('500.00'),
      isPaid: false,
    })

    const result = await updateOrderPayment('order-2', '500.00')

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-2' },
      data: {
        paidAmount: expect.any(Prisma.Decimal),
        isPaid: false,
      },
    })
    expect(result.isPaid).toBe(false)
  })

  it('marks isPaid true when paidAmount exceeds totalAmount', async () => {
    const existingOrder = createMockOrder({
      id: 'order-3',
      totalAmount: d('500.00'),
      paidAmount: d('0'),
      isPaid: false,
    })
    mockPrisma.order.findUnique.mockResolvedValue(existingOrder)
    mockPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      paidAmount: d('600.00'),
      isPaid: true,
    })

    const result = await updateOrderPayment('order-3', '600.00')

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-3' },
      data: {
        paidAmount: expect.any(Prisma.Decimal),
        isPaid: true,
      },
    })
    expect(result.isPaid).toBe(true)
  })

  it('throws if order not found', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)

    await expect(updateOrderPayment('bad-id', '100')).rejects.toThrow(
      'Comanda nu a fost găsită'
    )
  })
})

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Order + OrderItems atomically via nested create', async () => {
    const client = createMockClient({ id: 'client-1', discountPercent: d('10.00') })
    const product1 = createMockProduct({ id: 'prod-1', unitPrice: d('100.00') })
    const product2 = createMockProduct({ id: 'prod-2', unitPrice: d('200.00') })

    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockPrisma.product.findMany.mockResolvedValue([product1, product2])
    mockPrisma.order.create.mockResolvedValue({ id: 'new-order-1' })

    const result = await createOrder({
      clientId: 'client-1',
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.id).toBe('new-order-1')
    expect(mockPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: expect.objectContaining({ create: expect.any(Array) }),
        }),
      })
    )
  })

  it('snapshots unitPrice and discount correctly', async () => {
    const client = createMockClient({ id: 'client-1', discountPercent: d('15.00') })
    const product = createMockProduct({ id: 'prod-1', unitPrice: d('200.00') })

    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockPrisma.product.findMany.mockResolvedValue([product])
    mockPrisma.order.create.mockResolvedValue({ id: 'new-order-1' })

    await createOrder({
      clientId: 'client-1',
      items: [{ productId: 'prod-1', quantity: 3 }],
    })

    const createCall = mockPrisma.order.create.mock.calls[0][0]
    const item = createCall.data.items.create[0]

    expect(item.unitPrice.equals(d('200.00'))).toBe(true)
    expect(item.discount.equals(d('15.00'))).toBe(true)
  })

  it('calculates totalAmount correctly with discount', async () => {
    const client = createMockClient({ id: 'client-1', discountPercent: d('10.00') })
    const product = createMockProduct({ id: 'prod-1', unitPrice: d('100.00') })

    mockPrisma.client.findUnique.mockResolvedValue(client)
    mockPrisma.product.findMany.mockResolvedValue([product])
    mockPrisma.order.create.mockResolvedValue({ id: 'new-order-1' })

    await createOrder({
      clientId: 'client-1',
      items: [{ productId: 'prod-1', quantity: 5 }],
    })

    const createCall = mockPrisma.order.create.mock.calls[0][0]
    const item = createCall.data.items.create[0]

    // totalPrice per item: 5 × (100 × (1 - 10/100)) = 5 × 90 = 450
    expect(item.totalPrice.equals(d('450'))).toBe(true)
    // totalAmount = sum of all item totalPrices = 450
    expect(createCall.data.totalAmount.equals(d('450'))).toBe(true)
  })

  it('rejects if no items provided', async () => {
    const result = await createOrder({
      clientId: 'client-1',
      items: [],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('rejects if clientId is invalid (client not found)', async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null)

    const result = await createOrder({
      clientId: 'bad-id',
      items: [{ productId: 'prod-1', quantity: 1 }],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
