import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { execSync } from 'node:child_process'
import { DEFAULT_ENGINE_CONFIG } from '@/lib/engine/defaults'
import { buildBundle } from '@/lib/engine/bundler'
import { cleanupDatabase, disconnectTestDb, getTestPrisma } from '@/test/db'

const TEST_DATABASE_URL = 'file:./test.db'
process.env.DATABASE_URL = TEST_DATABASE_URL

const d = (value: number | string) => new Prisma.Decimal(value)

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('integration: cross-module flows (real sqlite db)', () => {
  const prisma = getTestPrisma()

  let scoreProducts: typeof import('@/lib/engine/scorer').scoreProducts
  let createOrder: typeof import('@/lib/actions/orders').createOrder
  let getClientFinancials: typeof import('@/lib/actions/clients').getClientFinancials

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL
    delete (global as { prisma?: unknown }).prisma
    vi.resetModules()

    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    })

    ;({ scoreProducts } = await import('@/lib/engine/scorer'))
    ;({ createOrder } = await import('@/lib/actions/orders'))
    ;({ getClientFinancials } = await import('@/lib/actions/clients'))
  })

  beforeEach(async () => {
    await cleanupDatabase(prisma)
  })

  afterAll(async () => {
    await cleanupDatabase(prisma)
    await disconnectTestDb()
  })

  it('full offer pipeline uses order history in scoring and bundle selection', async () => {
    const client = await prisma.client.create({
      data: {
        companyName: 'Clinica Pipeline SRL',
        contactPerson: 'Dr. Pipeline',
        discountPercent: d('0'),
      },
    })

    const [productA, productB, productC] = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Compozit A',
          sku: 'INT-A-001',
          category: 'Materiale Compozite',
          unitPrice: d('120'),
          costPrice: d('70'),
          stockQty: 100,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Compozit B',
          sku: 'INT-B-001',
          category: 'Materiale Compozite',
          unitPrice: d('115'),
          costPrice: d('75'),
          stockQty: 100,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Instrument C',
          sku: 'INT-C-001',
          category: 'Instrumente',
          unitPrice: d('300'),
          costPrice: d('140'),
          stockQty: 100,
        },
      }),
    ])

    await createOrder({ clientId: client.id, items: [{ productId: productA.id, quantity: 3 }] })
    await createOrder({ clientId: client.id, items: [{ productId: productA.id, quantity: 2 }] })
    await createOrder({ clientId: client.id, items: [{ productId: productB.id, quantity: 4 }] })

    const scored = await scoreProducts(client.id, DEFAULT_ENGINE_CONFIG)
    const bundle = buildBundle(scored, DEFAULT_ENGINE_CONFIG, 5)

    const scoredA = scored.find((item) => item.productId === productA.id)
    const scoredB = scored.find((item) => item.productId === productB.id)
    const scoredC = scored.find((item) => item.productId === productC.id)

    expect(scoredA).toBeDefined()
    expect(scoredB).toBeDefined()
    expect(scoredC).toBeDefined()

    expect(scoredA!.scoreBreakdown.clientFrequency).toBeGreaterThan(scoredB!.scoreBreakdown.clientFrequency)
    expect(scoredA!.scoreBreakdown.clientFrequency).toBeGreaterThan(scoredC!.scoreBreakdown.clientFrequency)

    expect(bundle.items.length).toBeGreaterThan(0)
    expect(bundle.items.some((item) => item.productId === productA.id)).toBe(true)
  })

  it('keeps order item price snapshot immutable after product price changes', async () => {
    const client = await prisma.client.create({
      data: {
        companyName: 'Clinica Snapshot SRL',
        contactPerson: 'Dr. Snapshot',
        discountPercent: d('0'),
      },
    })

    const product = await prisma.product.create({
      data: {
        name: 'Produs Snapshot',
        sku: 'SNAP-001',
        category: 'Consumabile',
        unitPrice: d('100'),
        costPrice: d('55'),
        stockQty: 100,
      },
    })

    const createResult = await createOrder({
      clientId: client.id,
      items: [{ productId: product.id, quantity: 2 }],
    })

    expect(createResult.success).toBe(true)

    const order = await prisma.order.findUnique({
      where: { id: createResult.id },
      include: { items: true },
    })

    expect(order).not.toBeNull()
    expect(order!.items).toHaveLength(1)
    expect(order!.items[0].unitPrice.toFixed(2)).toBe('100.00')

    await prisma.product.update({
      where: { id: product.id },
      data: { unitPrice: d('200') },
    })

    const orderAfterPriceChange = await prisma.order.findUnique({
      where: { id: order!.id },
      include: { items: true },
    })

    expect(orderAfterPriceChange).not.toBeNull()
    expect(orderAfterPriceChange!.items[0].unitPrice.toFixed(2)).toBe('100.00')
  })

  it('computes client financial totals and outstanding balance from orders', async () => {
    const client = await prisma.client.create({
      data: {
        companyName: 'Clinica Financial SRL',
        contactPerson: 'Dr. Financial',
        discountPercent: d('0'),
      },
    })

    const product = await prisma.product.create({
      data: {
        name: 'Produs Financial',
        sku: 'FIN-001',
        category: 'Implanturi',
        unitPrice: d('150'),
        costPrice: d('90'),
        stockQty: 100,
      },
    })

    await prisma.order.create({
      data: {
        clientId: client.id,
        orderDate: new Date('2026-01-10T00:00:00.000Z'),
        status: 'DELIVERED',
        totalAmount: d('1000'),
        paidAmount: d('700'),
        isPaid: false,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 5,
              unitPrice: d('150'),
              discount: d('0'),
              totalPrice: d('750'),
            },
          ],
        },
      },
    })

    await prisma.order.create({
      data: {
        clientId: client.id,
        orderDate: new Date('2026-01-15T00:00:00.000Z'),
        status: 'PENDING',
        totalAmount: d('500'),
        paidAmount: d('100'),
        isPaid: false,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 2,
              unitPrice: d('150'),
              discount: d('0'),
              totalPrice: d('300'),
            },
          ],
        },
      },
    })

    const financials = await getClientFinancials(client.id)

    expect(Number(financials.totalSpent).toFixed(2)).toBe('1500.00')
    expect(Number(financials.totalPaid).toFixed(2)).toBe('800.00')
    expect(Number(financials.outstandingBalance).toFixed(2)).toBe('700.00')
  })

  it('settings-driven weight changes alter offer scoring results', async () => {
    const client = await prisma.client.create({
      data: {
        companyName: 'Clinica Config SRL',
        contactPerson: 'Dr. Config',
        discountPercent: d('0'),
      },
    })

    const otherClient = await prisma.client.create({
      data: {
        companyName: 'Clinica Global SRL',
        contactPerson: 'Dr. Global',
        discountPercent: d('0'),
      },
    })

    const [productA, productB] = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Produs Config A',
          sku: 'CFG-A-001',
          category: 'Consumabile',
          unitPrice: d('100'),
          costPrice: d('40'),
          stockQty: 100,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Produs Config B',
          sku: 'CFG-B-001',
          category: 'Consumabile',
          unitPrice: d('100'),
          costPrice: d('90'),
          stockQty: 100,
        },
      }),
    ])

    await createOrder({ clientId: client.id, items: [{ productId: productA.id, quantity: 5 }] })
    await createOrder({ clientId: otherClient.id, items: [{ productId: productB.id, quantity: 50 }] })

    const customConfig = {
      ...DEFAULT_ENGINE_CONFIG,
      weights: {
        ...DEFAULT_ENGINE_CONFIG.weights,
        clientFrequency: 0.5,
        globalPopularity: 0,
      },
    }

    await prisma.setting.upsert({
      where: { key: 'engineConfig' },
      update: { value: JSON.stringify(customConfig) },
      create: { key: 'engineConfig', value: JSON.stringify(customConfig) },
    })

    const savedSetting = await prisma.setting.findUnique({
      where: { key: 'engineConfig' },
    })

    const configFromSettings = savedSetting
      ? (JSON.parse(savedSetting.value) as typeof DEFAULT_ENGINE_CONFIG)
      : DEFAULT_ENGINE_CONFIG

    const scoredWithDefault = await scoreProducts(client.id, DEFAULT_ENGINE_CONFIG)
    const scoredWithCustom = await scoreProducts(client.id, configFromSettings)

    const defaultA = scoredWithDefault.find((item) => item.productId === productA.id)
    const customA = scoredWithCustom.find((item) => item.productId === productA.id)
    const defaultB = scoredWithDefault.find((item) => item.productId === productB.id)
    const customB = scoredWithCustom.find((item) => item.productId === productB.id)

    expect(defaultA).toBeDefined()
    expect(customA).toBeDefined()
    expect(defaultB).toBeDefined()
    expect(customB).toBeDefined()

    expect(customA!.compositeScore).not.toBe(defaultA!.compositeScore)
    expect(customB!.compositeScore).not.toBe(defaultB!.compositeScore)
  })
})
