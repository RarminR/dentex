import { Prisma } from '@prisma/client'

// Helper to create a Decimal value
const d = (val: number | string) => new Prisma.Decimal(val)

// Mock product factory
export function createMockProduct(overrides: Partial<{
  id: string
  name: string
  sku: string
  category: string | null
  description: string | null
  unitPrice: Prisma.Decimal
  tvaPrice: Prisma.Decimal
  brutPrice: Prisma.Decimal
  acquisitionPrice: Prisma.Decimal
  costPrice: Prisma.Decimal
  role: string
  stockQty: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: overrides.id ?? 'product-1',
    name: overrides.name ?? 'Compozit Test',
    sku: overrides.sku ?? 'TEST-001',
    category: overrides.category ?? null,
    description: overrides.description ?? null,
    unitPrice: overrides.unitPrice ?? d('150.00'),
    tvaPrice: overrides.tvaPrice ?? d('28.50'),
    brutPrice: overrides.brutPrice ?? d('178.50'),
    acquisitionPrice: overrides.acquisitionPrice ?? overrides.costPrice ?? d('90.00'),
    costPrice: overrides.costPrice ?? null,
    role: overrides.role ?? 'ANCHOR',
    stockQty: overrides.stockQty ?? 0,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  }
}

// Mock client factory
export function createMockClient(overrides: Partial<{
  id: string
  companyName: string
  contactPerson: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  creditLimit: Prisma.Decimal
  paymentTermsDays: number
  discountPercent: Prisma.Decimal
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}> = {}) {
  return {
    id: overrides.id ?? 'client-1',
    companyName: overrides.companyName ?? 'Clinica Test SRL',
    contactPerson: overrides.contactPerson ?? null,
    email: overrides.email ?? 'test@clinica.ro',
    phone: overrides.phone ?? null,
    address: overrides.address ?? null,
    city: overrides.city ?? 'București',
    creditLimit: overrides.creditLimit ?? d('50000.00'),
    paymentTermsDays: overrides.paymentTermsDays ?? 30,
    discountPercent: overrides.discountPercent ?? d('10.00'),
    notes: overrides.notes ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date('2025-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  }
}

// Mock order factory
export function createMockOrder(overrides: Partial<{
  id: string
  clientId: string
  orderDate: Date
  totalAmount: Prisma.Decimal
  status: string
  paidAmount: Prisma.Decimal
  isPaid: boolean
  notes: string | null
  createdAt: Date
}> = {}) {
  return {
    id: overrides.id ?? 'order-1',
    clientId: overrides.clientId ?? 'client-1',
    orderDate: overrides.orderDate ?? new Date('2025-06-15'),
    totalAmount: overrides.totalAmount ?? d('1275.00'),
    status: overrides.status ?? 'DELIVERED',
    paidAmount: overrides.paidAmount ?? d('1275.00'),
    isPaid: overrides.isPaid ?? true,
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt ?? new Date('2025-06-15'),
  }
}

// Mock order item factory
export function createMockOrderItem(overrides: Partial<{
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: Prisma.Decimal
  discount: Prisma.Decimal
  totalPrice: Prisma.Decimal
  createdAt: Date
}> = {}) {
  return {
    id: overrides.id ?? 'item-1',
    orderId: overrides.orderId ?? 'order-1',
    productId: overrides.productId ?? 'product-1',
    quantity: overrides.quantity ?? 10,
    unitPrice: overrides.unitPrice ?? d('150.00'),
    discount: overrides.discount ?? d('15.00'),
    totalPrice: overrides.totalPrice ?? d('1275.00'),
    createdAt: overrides.createdAt ?? new Date('2025-06-15'),
  }
}
