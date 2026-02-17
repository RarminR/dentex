'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RO } from '@/lib/constants/ro'
import { formatCurrency } from '@/lib/utils/format'
import { updateOrderPayment } from '@/lib/actions/orders'
import { useRouter } from 'next/navigation'

interface PaymentSectionProps {
  orderId: string
  totalAmount: string
  paidAmount: string
  isPaid: boolean
}

export function PaymentSection({ orderId, totalAmount, paidAmount, isPaid }: PaymentSectionProps) {
  const router = useRouter()
  const [amount, setAmount] = useState(paidAmount)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const balance = Number(totalAmount) - Number(paidAmount)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      try {
        await updateOrderPayment(orderId, amount)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Eroare la actualizarea plății')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{RO.orders.markPayment}</span>
          <Badge
            variant="outline"
            className={isPaid
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-amber-100 text-amber-800 border-amber-200'
            }
          >
            {isPaid ? RO.orders.paid : RO.orders.balance}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">{RO.orders.total}</p>
            <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{RO.orders.paid}</p>
            <p className="text-lg font-semibold text-emerald-700">{formatCurrency(paidAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{RO.orders.balance}</p>
            <p className={`text-lg font-semibold ${balance > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {!isPaid && (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block">{RO.orders.paid} (RON)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? RO.common.loading : RO.orders.markPayment}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </CardContent>
    </Card>
  )
}
