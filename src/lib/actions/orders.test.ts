import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { createMockOrder, createMockClient, createMockOrderItem, createMockProduct } from '@/test/helpers'

const mockPrisma = {
  order: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  client: {
    findMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Admin' } }),
}))

const { getOrders, getOrder, updateOrderPayment } = await import('./orders')

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
