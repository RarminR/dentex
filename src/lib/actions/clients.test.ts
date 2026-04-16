import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { clientCreateSchema, clientUpdateSchema } from '@/lib/validations/client'
import { createMockClient, createMockOrder, createMockOrderItem } from '@/test/helpers'

const d = (val: number | string) => new Prisma.Decimal(val)

describe('clientCreateSchema validation', () => {
  it('accepts valid client data', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Clinica Dentară SRL',
      contactPerson: 'Dr. Ionescu',
      email: 'contact@clinica.ro',
      city: 'București',
      creditLimit: 50000,
      discountPercent: 10,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty company name', () => {
    const result = clientCreateSchema.safeParse({
      companyName: '',
      contactPerson: 'Dr. Test',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty contact person (optional)', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('allows empty email', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
      email: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative credit limit', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
      creditLimit: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects discount over 100%', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
      discountPercent: 101,
    })
    expect(result.success).toBe(false)
  })

  it('defaults creditLimit to 0', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.creditLimit).toBe(0)
    }
  })

  it('defaults paymentTermsDays to 30', () => {
    const result = clientCreateSchema.safeParse({
      companyName: 'Test SRL',
      contactPerson: 'Dr. Test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.paymentTermsDays).toBe(30)
    }
  })
})

describe('clientUpdateSchema validation', () => {
  it('requires id', () => {
    const result = clientUpdateSchema.safeParse({
      companyName: 'Updated SRL',
    })
    expect(result.success).toBe(false)
  })

  it('accepts partial updates with id', () => {
    const result = clientUpdateSchema.safeParse({
      id: 'client-1',
      companyName: 'Updated SRL',
    })
    expect(result.success).toBe(true)
  })
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import {
  getClients,
  getClient,
  getClientFinancials,
  createClient,
  updateClient,
  deactivateClient,
} from './clients'

const mockPrisma = vi.mocked(prisma)

describe('getClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated client list', async () => {
    const mockClients = [
      createMockClient({ id: 'c1', companyName: 'Alpha SRL' }),
      createMockClient({ id: 'c2', companyName: 'Beta SRL' }),
    ]
    mockPrisma.client.findMany.mockResolvedValue(mockClients)
    mockPrisma.client.count.mockResolvedValue(2)

    const result = await getClients({ page: 1, pageSize: 10 })

    expect(result.clients).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })

  it('applies search filter on companyName and contactPerson', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])
    mockPrisma.client.count.mockResolvedValue(0)

    await getClients({ search: 'Alpha' })

    const findManyCall = mockPrisma.client.findMany.mock.calls[0][0]
    expect(findManyCall?.where?.OR).toBeDefined()
  })

  it('filters by city', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])
    mockPrisma.client.count.mockResolvedValue(0)

    await getClients({ city: 'București' })

    const findManyCall = mockPrisma.client.findMany.mock.calls[0][0]
    expect(findManyCall?.where?.city).toBe('București')
  })

  it('defaults to page 1, pageSize 10', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])
    mockPrisma.client.count.mockResolvedValue(0)

    const result = await getClients({})

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 })
    )
  })
})

describe('getClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns client with orders', async () => {
    const mockClient = {
      ...createMockClient(),
      orders: [createMockOrder()],
    }
    mockPrisma.client.findUnique.mockResolvedValue(mockClient as never)

    const result = await getClient('client-1')

    expect(result).toBeDefined()
    expect(result?.companyName).toBe('Clinica Test SRL')
  })

  it('returns null for non-existent client', async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null)

    const result = await getClient('non-existent')

    expect(result).toBeNull()
  })
})

describe('getClientFinancials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes financials from orders and order items', async () => {
    mockPrisma.order.aggregate.mockResolvedValue({
      _sum: {
        totalAmount: d('3000.00'),
        paidAmount: d('2000.00'),
      },
      _count: { id: 3 },
    } as never)

    mockPrisma.order.count.mockResolvedValue(3)

    mockPrisma.orderItem.findMany.mockResolvedValue([
      {
        quantity: 10,
        totalPrice: d('900.00'),
        product: { acquisitionPrice: d('50.00') },
      },
      {
        quantity: 5,
        totalPrice: d('900.00'),
        product: { acquisitionPrice: d('120.00') },
      },
    ] as never)

    const result = await getClientFinancials('client-1')

    expect(result.totalSpent.toString()).toBe('3000')
    expect(result.totalPaid.toString()).toBe('2000')
    expect(result.outstandingBalance.toString()).toBe('1000')
    expect(result.totalOrders).toBe(3)
    expect(result.avgOrderValue.toString()).toBe('1000')
    expect(Number(result.profitabilityMargin)).toBeCloseTo(38.89, 1)
  })

  it('returns zeros for client with no orders', async () => {
    mockPrisma.order.aggregate.mockResolvedValue({
      _sum: { totalAmount: null, paidAmount: null },
      _count: { id: 0 },
    } as never)

    mockPrisma.order.count.mockResolvedValue(0)
    mockPrisma.orderItem.findMany.mockResolvedValue([])

    const result = await getClientFinancials('client-1')

    expect(result.totalSpent.toString()).toBe('0')
    expect(result.totalPaid.toString()).toBe('0')
    expect(result.outstandingBalance.toString()).toBe('0')
    expect(result.avgOrderValue.toString()).toBe('0')
    expect(result.totalOrders).toBe(0)
    expect(result.profitabilityMargin.toString()).toBe('0')
  })
})

describe('createClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates client with valid data', async () => {
    mockPrisma.client.create.mockResolvedValue(
      createMockClient({ id: 'new-client' }) as never
    )

    const result = await createClient({
      companyName: 'Clinica Nouă SRL',
      contactPerson: 'Dr. Popescu',
      email: 'contact@clinicanoua.ro',
      city: 'Cluj-Napoca',
      creditLimit: 30000,
      discountPercent: 5,
    })

    expect(result.success).toBe(true)
    expect(result.id).toBe('new-client')
  })

  it('returns error for invalid data', async () => {
    const result = await createClient({
      companyName: '',
      contactPerson: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('updateClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates client with valid data', async () => {
    mockPrisma.client.update.mockResolvedValue(
      createMockClient({ id: 'client-1', companyName: 'Updated SRL' }) as never
    )

    const result = await updateClient({
      id: 'client-1',
      companyName: 'Updated SRL',
    })

    expect(result.success).toBe(true)
  })

  it('returns error without id', async () => {
    const result = await updateClient({
      companyName: 'Updated SRL',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('deactivateClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets isActive to false (soft delete)', async () => {
    mockPrisma.client.update.mockResolvedValue(
      createMockClient({ id: 'client-1', isActive: false }) as never
    )

    const result = await deactivateClient('client-1')

    expect(result.success).toBe(true)
    expect(mockPrisma.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: { isActive: false },
    })
  })
})
