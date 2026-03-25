'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { generateOffer } from '@/lib/actions/offers'

interface UpsellProduct {
  id: string
  name: string
  sku: string
  category: string
  unitPrice: string
}

interface UpsellSelectorProps {
  clientId: string
  clientName: string
  upsellProducts: UpsellProduct[]
}

export function UpsellSelector({ clientId, clientName, upsellProducts }: UpsellSelectorProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(upsellProducts.map((p) => p.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateOffer(clientId, Array.from(selectedIds))
      if (result.success && result.offerId) {
        window.location.href = `/offers/${clientId}/view/${result.offerId}`
      } else {
        setError(result.error ?? 'Eroare la generare')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => router.push(`/clients/${clientId}`)}>
          {'\u2190'} {'\u00CE'}napoi
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} produse upsell selectate
        </span>
        <Button onClick={handleGenerate} disabled={isPending}>
          {isPending ? 'Se genereaz\u0103...' : 'Genereaz\u0103 Oferta'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Selecteaz{'\u0103'} produse Upsell pentru {clientName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecteaz{'\u0103'} tot
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselecteaz{'\u0103'} tot
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Produsele Ancor{'\u0103'} vor fi incluse automat pe baza istoricului de comenzi. Alege{'\u021B'}i produsele Upsell pe care dori{'\u021B'}i s{'\u0103'} le ad{'\u0103'}uga{'\u021B'}i {'\u00EE'}n ofert{'\u0103'}.
          </p>
        </CardHeader>
        <CardContent>
          {upsellProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nu exist{'\u0103'} produse cu rol Upsell. Marca{'\u021B'}i produse ca Upsell din pagina Produse.
            </p>
          ) : (
            <div className="space-y-2">
              {upsellProducts.map((product) => {
                const isSelected = selectedIds.has(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/30'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && '\u2713'}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{product.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(product.unitPrice)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
