import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { applyDiscount } from '@/lib/utils/decimal'
import type { EngineConfig, ScoredProduct } from './types'

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function normalizeByMax(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0
  return value / maxValue
}

export async function scoreProducts(clientId: string, config: EngineConfig): Promise<ScoredProduct[]> {
  const cutoffDate = new Date(Date.now() - config.scoringTimeframeDays * 24 * 60 * 60 * 1000)

  const [client, products, clientOrderItems, globalOrderItems] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        discountPercent: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        sku: true,
        role: true,
        unitPrice: true,
        acquisitionPrice: true,
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          clientId,
          orderDate: { gte: cutoffDate },
        },
      },
      select: {
        productId: true,
        quantity: true,
        order: {
          select: {
            orderDate: true,
          },
        },
      },
    }),
    prisma.orderItem.findMany({
      select: {
        productId: true,
        quantity: true,
      },
    }),
  ])

  if (!client) {
    throw new Error(`Client not found: ${clientId}`)
  }

  const clientOrderFrequencyByProduct = new Map<string, number>()
  const clientQuantityByProduct = new Map<string, number[]>()
  const clientLastOrderDateByProduct = new Map<string, Date>()

  for (const item of clientOrderItems) {
    clientOrderFrequencyByProduct.set(item.productId, (clientOrderFrequencyByProduct.get(item.productId) ?? 0) + 1)

    const quantities = clientQuantityByProduct.get(item.productId) ?? []
    quantities.push(item.quantity)
    clientQuantityByProduct.set(item.productId, quantities)

    const currentLast = clientLastOrderDateByProduct.get(item.productId)
    if (!currentLast || item.order.orderDate > currentLast) {
      clientLastOrderDateByProduct.set(item.productId, item.order.orderDate)
    }
  }

  const globalUnitsByProduct = new Map<string, number>()
  for (const item of globalOrderItems) {
    globalUnitsByProduct.set(item.productId, (globalUnitsByProduct.get(item.productId) ?? 0) + item.quantity)
  }

  const maxClientFrequency = Math.max(0, ...clientOrderFrequencyByProduct.values())
  const maxGlobalUnits = Math.max(0, ...globalUnitsByProduct.values())

  const scoredProducts = products.map((product): ScoredProduct => {
    const clientFrequencyRaw = clientOrderFrequencyByProduct.get(product.id) ?? 0
    const globalUnitsRaw = globalUnitsByProduct.get(product.id) ?? 0
    const lastOrderDate = clientLastOrderDateByProduct.get(product.id)

    const clientFrequency = clamp01(normalizeByMax(clientFrequencyRaw, maxClientFrequency))
    const globalPopularity = clamp01(normalizeByMax(globalUnitsRaw, maxGlobalUnits))

    let margin = 0
    if (!product.unitPrice.equals(0)) {
      margin = clamp01(product.unitPrice.minus(product.acquisitionPrice).dividedBy(product.unitPrice).toNumber())
    }

    let recency = 0
    if (lastOrderDate) {
      const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
      recency = clamp01(1 - daysSinceLastOrder / config.scoringTimeframeDays)
    }

    const slowMoverPush = clamp01(1 - globalPopularity)

    const compositeScoreRaw =
      config.weights.clientFrequency * clientFrequency +
      config.weights.globalPopularity * globalPopularity +
      config.weights.margin * margin +
      config.weights.recency * recency +
      config.weights.slowMoverPush * slowMoverPush

    const quantities = clientQuantityByProduct.get(product.id) ?? []
    const suggestedQuantity =
      quantities.length > 0
        ? Math.max(1, Math.round(quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length))
        : 1

    const marginPercent = product.unitPrice.equals(0)
      ? new Prisma.Decimal(0)
      : product.unitPrice.minus(product.acquisitionPrice).dividedBy(product.unitPrice).times(100)

    return {
      productId: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      unitPrice: product.unitPrice,
      effectivePrice: applyDiscount(product.unitPrice, client.discountPercent),
      acquisitionPrice: product.acquisitionPrice,
      marginPercent,
      compositeScore: clamp01(compositeScoreRaw),
      scoreBreakdown: {
        clientFrequency,
        globalPopularity,
        margin,
        recency,
        slowMoverPush,
      },
      suggestedQuantity,
      role: product.role === 'UPSELL' ? 'upsell' : 'anchor',
    }
  })

  scoredProducts.sort((a, b) => b.compositeScore - a.compositeScore)
  return scoredProducts
}
