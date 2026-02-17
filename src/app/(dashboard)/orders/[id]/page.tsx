import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RO } from '@/lib/constants/ro'
import { getOrder } from '@/lib/actions/orders'
import { formatCurrency, formatDate, formatPercent, formatTVADisplay } from '@/lib/utils/format'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { PaymentSection } from '@/components/orders/PaymentSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  return (
    <>
      <Header title={`${RO.orders.number} #${order.id.slice(-6).toUpperCase()}`} />
      <PageWrapper>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/orders">
              <Button variant="ghost" size="sm">← {RO.common.back}</Button>
            </Link>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{RO.orders.client}</p>
                <p className="text-lg font-semibold">{order.client.companyName}</p>
                <p className="text-sm text-gray-500 mt-1">{order.client.contactPerson}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{RO.orders.date}</p>
                <p className="text-lg font-semibold">{formatDate(order.orderDate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{RO.orders.total}</p>
                <p className="text-lg font-semibold">{formatCurrency(order.totalAmount.toString())}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{RO.orders.product}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{RO.orders.product}</TableHead>
                      <TableHead className="text-right">{RO.orders.quantity}</TableHead>
                      <TableHead className="text-right">{RO.orders.unitPrice}</TableHead>
                      <TableHead className="text-right">{RO.orders.clientDiscount} %</TableHead>
                      <TableHead className="text-right">{RO.orders.rowTotal}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: typeof order.items[number]) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice.toString())}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.discount.toString())}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice.toString())}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-sm text-gray-600">
                    {formatTVADisplay(order.totalAmount.toString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500 mb-1">Notițe</p>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <PaymentSection
            orderId={order.id}
            totalAmount={order.totalAmount.toString()}
            paidAmount={order.paidAmount.toString()}
            isPaid={order.isPaid}
          />
        </div>
      </PageWrapper>
    </>
  )
}
