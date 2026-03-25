'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OfferDisplay } from './OfferDisplay'
import { updateOffer } from '@/lib/actions/offers'
import type { OfferView } from '@/lib/actions/offers'

interface EditableItem {
  productId: string
  name: string
  category: string
  sku: string
  unitPrice: string
  effectivePrice: string
  costPrice: string
  marginPercent: string
  compositeScore: number
  scoreBreakdown: {
    clientFrequency: number
    globalPopularity: number
    margin: number
    recency: number
    slowMoverPush: number
  }
  suggestedQuantity: number
  role: 'anchor' | 'upsell'
}

interface OfferEditorProps {
  initialOffer: OfferView
}

export function OfferEditor({ initialOffer }: OfferEditorProps) {
  const router = useRouter()
  const [offer, setOffer] = useState<OfferView>(initialOffer)
  const [isEditing, setIsEditing] = useState(false)
  const [editedItems, setEditedItems] = useState<EditableItem[]>(() =>
    serializeItems(initialOffer.items)
  )
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function serializeItems(items: OfferView['items']): EditableItem[] {
    return items.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      sku: item.sku,
      unitPrice: item.unitPrice.toString(),
      effectivePrice: item.effectivePrice.toString(),
      costPrice: item.costPrice.toString(),
      marginPercent: item.marginPercent.toString(),
      compositeScore: item.compositeScore,
      scoreBreakdown: item.scoreBreakdown,
      suggestedQuantity: item.suggestedQuantity,
      role: item.role,
    }))
  }

  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    setEditedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, suggestedQuantity: qty } : item
      )
    )
  }, [])

  const handleRoleChange = useCallback((productId: string, role: 'anchor' | 'upsell') => {
    setEditedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, role } : item
      )
    )
  }, [])

  function handleEdit() {
    setIsEditing(true)
    setFeedback(null)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditedItems(serializeItems(offer.items))
    setFeedback(null)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOffer(offer.id, editedItems as unknown as Parameters<typeof updateOffer>[1])
      if (result.success) {
        setIsEditing(false)
        setOffer((prev) => ({ ...prev, isEdited: true }))
        setFeedback({ type: 'success', message: 'Oferta a fost salvat\u0103 cu succes!' })
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Eroare la salvare' })
      }
    })
  }

  function handleRegenerate() {
    router.push(`/offers/${offer.clientId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => router.push(`/clients/${offer.clientId}`)}>
          {'\u2190'} {'\u00CE'}napoi
        </Button>
        <div className="flex-1" />
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isPending}>
              Anuleaz{'\u0103'}
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Se salveaz\u0103...' : 'Salveaz\u0103'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleRegenerate} disabled={isPending}>
              {isPending ? 'Se genereaz\u0103...' : 'Regenereaz\u0103'}
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              Editeaz{'\u0103'}
            </Button>
          </>
        )}
      </div>

      {feedback && (
        <Card className={feedback.type === 'success' ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30'}>
          <CardContent className="py-3">
            <p className={`text-sm ${feedback.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
              {feedback.message}
            </p>
          </CardContent>
        </Card>
      )}

      <OfferDisplay
        offer={offer}
        isEditing={isEditing}
        editedItems={editedItems}
        onQuantityChange={handleQuantityChange}
        onRoleChange={handleRoleChange}
      />
    </div>
  )
}
