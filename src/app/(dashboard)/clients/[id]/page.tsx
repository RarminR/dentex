import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format'
import { getClient, getClientFinancials } from '@/lib/actions/clients'
import { FinancialSummary } from '@/components/clients/FinancialSummary'
import { DeactivateButton } from '@/components/clients/DeactivateButton'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params
  const [client, financials] = await Promise.all([
    getClient(id),
    getClientFinancials(id),
  ])

  if (!client) notFound()

  return (
    <>
      <Header title={client.companyName} />
      <PageWrapper>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/clients">{RO.common.back}</Link>
            </Button>
            <div className="flex-1" />
            <Badge variant={client.isActive ? 'default' : 'secondary'}>
              {client.isActive ? RO.common.active : RO.common.inactive}
            </Badge>
            <Button asChild>
              <Link href={`/offers/${client.id}`}>
                {RO.clients.generateOffer}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clients/${client.id}/edit`}>{RO.common.edit}</Link>
            </Button>
            {client.isActive && <DeactivateButton clientId={client.id} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{RO.clients.contact}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-gray-500">{RO.clients.contact}:</span> {client.contactPerson}</p>
                {client.email && <p><span className="text-gray-500">{RO.clients.email}:</span> {client.email}</p>}
                {client.phone && <p><span className="text-gray-500">{RO.clients.phone}:</span> {client.phone}</p>}
                {client.city && <p><span className="text-gray-500">{RO.clients.city}:</span> {client.city}</p>}
                {client.address && <p><span className="text-gray-500">{RO.clients.address}:</span> {client.address}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{RO.clients.creditLimit}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-gray-500">{RO.clients.creditLimit}:</span> {formatCurrency(client.creditLimit.toString())}</p>
                <p><span className="text-gray-500">{RO.clients.paymentTerms}:</span> {client.paymentTermsDays} zile</p>
                <p><span className="text-gray-500">{RO.clients.discount}:</span> {formatPercent(client.discountPercent.toString())}</p>
                {client.notes && <p><span className="text-gray-500">{RO.clients.notes}:</span> {client.notes}</p>}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">{RO.clients.financialSummary}</h2>
            <FinancialSummary financials={financials} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{RO.clients.orderHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              {client.orders.length === 0 ? (
                <p className="text-gray-500 text-sm">{RO.common.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4">{RO.orders.date}</th>
                        <th className="py-2 pr-4">{RO.common.status}</th>
                        <th className="py-2 pr-4 text-right">{RO.orders.total}</th>
                        <th className="py-2 pr-4 text-right">{RO.orders.paid}</th>
                        <th className="py-2 text-right">{RO.orders.balance}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.orders.map((order: { id: string; orderDate: Date; status: string; totalAmount: Prisma.Decimal; paidAmount: Prisma.Decimal }) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 pr-4">{formatDate(order.orderDate)}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                              {order.status === 'PENDING' ? RO.orders.pending :
                               order.status === 'DELIVERED' ? RO.orders.delivered :
                               RO.orders.cancelled}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(order.totalAmount.toString())}</td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(order.paidAmount.toString())}</td>
                          <td className="py-2 text-right">
                            {formatCurrency(order.totalAmount.sub(order.paidAmount).toString())}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  )
}
