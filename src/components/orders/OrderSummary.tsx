'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatPercent, calculateWithTVA } from '@/lib/utils/format'
import { RO } from '@/lib/constants/ro'
import type { OrderItemDraft } from './OrderProductSelector'

interface OrderSummaryProps {
  clientName: string
  discountPercent: string
  items: OrderItemDraft[]
  notes: string
  onConfirm: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function OrderSummary({
  clientName,
  discountPercent,
  items,
  notes,
  onConfirm,
  onBack,
  isSubmitting,
}: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
  const { tva, total } = calculateWithTVA(subtotal)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{RO.orders.client}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{clientName}</p>
          <p className="text-sm text-muted-foreground">
            {RO.orders.clientDiscount}: {formatPercent(discountPercent)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produse comandate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{RO.orders.product}</TableHead>
                  <TableHead className="text-right">{RO.orders.unitPrice}</TableHead>
                  <TableHead className="text-right">Pre\u021B client</TableHead>
                  <TableHead className="text-right">{RO.orders.quantity}</TableHead>
                  <TableHead className="text-right">{RO.orders.rowTotal}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-700 font-medium">
                      {formatCurrency(item.effectivePrice)}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{RO.orders.tva}</span>
                <span className="font-medium">{formatCurrency(tva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>{RO.orders.totalWithTva}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Noti\u021Be</p>
            <p className="text-gray-700">{notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          \u2190 {RO.common.back}
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? RO.common.loading : RO.orders.confirm}
        </Button>
      </div>
    </div>
  )
}
