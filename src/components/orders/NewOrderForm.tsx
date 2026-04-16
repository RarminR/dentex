'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RO } from '@/lib/constants/ro'
import { formatPercent } from '@/lib/utils/format'
import { createOrder } from '@/lib/actions/orders'
import { OrderProductSelector, type OrderItemDraft } from './OrderProductSelector'
import { OrderSummary } from './OrderSummary'

type Step = 'client' | 'products' | 'review'

interface Client {
  id: string
  companyName: string
  discountPercent: { toString(): string }
}

interface Product {
  id: string
  name: string
  sku: string
  category: string | null
  unitPrice: { toString(): string }
}

interface NewOrderFormProps {
  clients: Client[]
  products: Product[]
}

export function NewOrderForm({ clients, products }: NewOrderFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('client')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredClients = clientSearch.trim()
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients

  const handleSelectClient = useCallback((client: Client) => {
    setSelectedClient(client)
    setItems([])
    setStep('products')
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!selectedClient || items.length === 0) return
    setIsSubmitting(true)
    setError(null)

    const result = await createOrder({
      clientId: selectedClient.id,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      notes: notes || undefined,
    })

    if (result.success && result.id) {
      router.push(`/orders/${result.id}`)
    } else {
      setError(result.error || 'Eroare la crearea comenzii')
      setIsSubmitting(false)
    }
  }, [selectedClient, items, notes, router])

  const stepLabels: Record<Step, string> = {
    client: 'Selecteaz\u0103 Client',
    products: 'Adaug\u0103 Produse',
    review: 'Revizuie\u015Fte Comanda',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {(['client', 'products', 'review'] as Step[]).map((s, i) => {
          const isCurrent = s === step
          const isCompleted =
            (s === 'client' && (step === 'products' || step === 'review')) ||
            (s === 'products' && step === 'review')
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '\u2713' : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stepLabels[s]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle>Selecteaz\u0103 Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={`${RO.common.search} clien\u021Bi...`}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto rounded-md border divide-y">
              {filteredClients.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {RO.common.noData}
                </p>
              )}
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedClient?.id === client.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{client.companyName}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatPercent(client.discountPercent.toString())} discount
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'products' && selectedClient && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{RO.orders.client}</p>
              <p className="font-semibold">{selectedClient.companyName}</p>
              <p className="text-xs text-emerald-700">
                {formatPercent(selectedClient.discountPercent.toString())} discount
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep('client')}>
              Schimb\u0103 client
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adaug\u0103 Produse</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderProductSelector
                products={products}
                discountPercent={selectedClient.discountPercent.toString()}
                items={items}
                onItemsChange={setItems}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Noti\u021Be (op\u021Bional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Noti\u021Be pentru comand\u0103..."
              rows={2}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('client')}>
              \u2190 {RO.common.back}
            </Button>
            <Button onClick={() => setStep('review')} disabled={items.length === 0}>
              Revizuie\u015Fte Comanda \u2192
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && selectedClient && (
        <OrderSummary
          clientName={selectedClient.companyName}
          discountPercent={selectedClient.discountPercent.toString()}
          items={items}
          notes={notes}
          onConfirm={handleConfirm}
          onBack={() => setStep('products')}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
