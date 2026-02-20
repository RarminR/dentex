'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { scoreProducts } from '@/lib/engine/scorer'
import { buildBundle } from '@/lib/engine/bundler'
import { getEngineConfig } from '@/lib/actions/settings'
import { serialize } from '@/lib/utils/decimal'
import type { ScoredProduct, GeneratedOffer } from '@/lib/engine/types'

export interface OfferResult {
  success: boolean
  offerId?: string
  offer?: GeneratedOffer
  error?: string
}

export interface OfferView {
  id: string
  clientId: string
  clientName: string
  items: ScoredProduct[]
  totalValue: string
  totalMargin: string
  isEdited: boolean
  aiInsight: string | null
  pitchNote: string | null
  generatedAt: Date
  createdAt: Date
  engineConfig: string
}

export interface OfferListItem {
  id: string
  createdAt: Date
  totalValue: Prisma.Decimal
  isEdited: boolean
}

export async function generateOffer(clientId: string): Promise<OfferResult> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, companyName: true, discountPercent: true },
  })

  if (!client) {
    return { success: false, error: 'Client neg\u0103sit' }
  }

  const config = await getEngineConfig()
  const scoredProducts = await scoreProducts(clientId, config)

  const orderStats = await prisma.order.aggregate({
    where: { clientId },
    _avg: { totalAmount: true },
  })
  const orderCount = await prisma.order.count({ where: { clientId } })
  const clientAvgOrderSize = orderCount > 0 ? orderCount : 0

  const bundle = buildBundle(scoredProducts, config, clientAvgOrderSize)
  bundle.clientId = clientId

  let aiInsight: string | null = null
  let pitchNote: string | null = null
  try {
    const { enhanceOffer } = await import('@/lib/engine/ai-enhancer')
    const enhancement = await enhanceOffer(bundle, {
      id: client.id,
      companyName: client.companyName,
      discountPercent: client.discountPercent,
      topCategories: [],
      orderCount,
      daysSinceLastOrder: null,
      avgOrderValue: orderStats._avg?.totalAmount ?? new Prisma.Decimal(0),
    })
    if (enhancement) {
      aiInsight = enhancement.insight
      pitchNote = enhancement.pitchNote
    }
  } catch {
    // AI enhancer unavailable — offer works without it
  }

  const saved = await prisma.offer.create({
    data: {
      clientId,
      items: JSON.stringify(bundle.items),
      engineConfig: JSON.stringify(config),
      totalValue: bundle.totalValue,
      totalMargin: bundle.totalMargin,
      aiInsight,
      pitchNote,
    },
  })

  const offer: GeneratedOffer = {
    ...bundle,
    aiInsight: aiInsight ?? undefined,
    pitchNote: pitchNote ?? undefined,
  }

  return serialize({ success: true, offerId: saved.id, offer })
}

export async function getOffer(id: string): Promise<OfferView | null> {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { client: { select: { companyName: true } } },
  })

  if (!offer) return null

  return serialize({
    id: offer.id,
    clientId: offer.clientId,
    clientName: offer.client.companyName,
    items: JSON.parse(offer.items) as ScoredProduct[],
    totalValue: offer.totalValue.toString(),
    totalMargin: offer.totalMargin.toString(),
    isEdited: offer.isEdited,
    aiInsight: offer.aiInsight,
    pitchNote: offer.pitchNote,
    generatedAt: offer.generatedAt,
    createdAt: offer.createdAt,
    engineConfig: offer.engineConfig,
  })
}

export async function updateOffer(
  id: string,
  items: ScoredProduct[]
): Promise<{ success: boolean; error?: string }> {
  const totalValue = items.reduce(
    (sum, item) => sum.plus(new Prisma.Decimal(item.effectivePrice.toString()).times(item.suggestedQuantity)),
    new Prisma.Decimal(0)
  )

  const weightedMarginSum = items.reduce(
    (sum, item) =>
      sum.plus(
        new Prisma.Decimal(item.marginPercent.toString()).times(
          new Prisma.Decimal(item.effectivePrice.toString()).times(item.suggestedQuantity)
        )
      ),
    new Prisma.Decimal(0)
  )

  const totalMargin = totalValue.equals(0)
    ? new Prisma.Decimal(0)
    : weightedMarginSum.dividedBy(totalValue)

  await prisma.offer.update({
    where: { id },
    data: {
      items: JSON.stringify(items),
      isEdited: true,
      totalValue,
      totalMargin,
    },
  })

  return { success: true }
}

export async function getClientOffers(clientId: string): Promise<OfferListItem[]> {
  const offers = await prisma.offer.findMany({
    where: { clientId },
    select: {
      id: true,
      createdAt: true,
      totalValue: true,
      isEdited: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return serialize(offers)
}
