'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OfferItemRow } from './OfferItemRow'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import type { OfferView } from '@/lib/actions/offers'

interface OfferDisplayProps {
  offer: OfferView
  isEditing: boolean
  editedItems: Array<{
    productId: string
    name: string
    category: string | null
    effectivePrice: string
    role: 'anchor' | 'upsell'
    suggestedQuantity: number
    marginPercent: string
  }>
  onQuantityChange?: (productId: string, qty: number) => void
  onRoleChange?: (productId: string, role: 'anchor' | 'upsell') => void
}

export function OfferDisplay({
  offer,
  isEditing,
  editedItems,
  onQuantityChange,
  onRoleChange,
}: OfferDisplayProps) {
  const items = editedItems
  const anchors = items.filter((i) => i.role === 'anchor')
  const upsells = items.filter((i) => i.role === 'upsell')

  const totalValue = items.reduce(
    (sum, item) => sum + Number(item.effectivePrice) * item.suggestedQuantity,
    0
  )
  const weightedMarginSum = items.reduce(
    (sum, item) => sum + Number(item.marginPercent) * Number(item.effectivePrice) * item.suggestedQuantity,
    0
  )
  const avgMargin = totalValue > 0 ? weightedMarginSum / totalValue : 0

  return (
    <div className="space-y-6">
      {offer.aiInsight && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <span className="text-lg">{'\uD83D\uDCA1'}</span>
              Recomandare AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-blue-900 dark:text-blue-200">{offer.aiInsight}</p>
            {offer.pitchNote && (
              <p className="text-sm italic text-blue-700 dark:text-blue-400">
                {offer.pitchNote}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {anchors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              Ancor{'\u0103'} ({anchors.length} produse)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Produs</th>
                    <th className="py-2 pr-4">Tip</th>
                    <th className="py-2 pr-4 text-center">Cantitate</th>
                    <th className="py-2 pr-4 text-right">Pre{'\u021B'} Client</th>
                    <th className="py-2 text-right">Total R{'\u00E2'}nd</th>
                  </tr>
                </thead>
                <tbody>
                  {anchors.map((item) => (
                    <OfferItemRow
                      key={item.productId}
                      name={item.name}
                      category={item.category}
                      quantity={item.suggestedQuantity}
                      effectivePrice={item.effectivePrice}
                      role="anchor"
                      isEditing={isEditing}
                      onQuantityChange={(qty) => onQuantityChange?.(item.productId, qty)}
                      onRoleChange={(role) => onRoleChange?.(item.productId, role)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {upsells.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              Upsell ({upsells.length} produse)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Produs</th>
                    <th className="py-2 pr-4">Tip</th>
                    <th className="py-2 pr-4 text-center">Cantitate</th>
                    <th className="py-2 pr-4 text-right">Pre{'\u021B'} Client</th>
                    <th className="py-2 text-right">Total R{'\u00E2'}nd</th>
                  </tr>
                </thead>
                <tbody>
                  {upsells.map((item) => (
                    <OfferItemRow
                      key={item.productId}
                      name={item.name}
                      category={item.category}
                      quantity={item.suggestedQuantity}
                      effectivePrice={item.effectivePrice}
                      role="upsell"
                      isEditing={isEditing}
                      onQuantityChange={(qty) => onQuantityChange?.(item.productId, qty)}
                      onRoleChange={(role) => onRoleChange?.(item.productId, role)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-bold">
                Total Ofert{'\u0103'}: {formatCurrency(totalValue)}
              </p>
              <p className="text-sm text-muted-foreground">
                Marj{'\u0103'} Medie: {formatPercent(avgMargin)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                +21% TVA
              </Badge>
              {offer.isEdited && (
                <Badge variant="secondary" className="text-xs">
                  Editat{'\u0103'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
