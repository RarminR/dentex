import { getDashboardData } from '@/lib/actions/dashboard'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const STATUS_LABELS: Record<string, string> = {
  PENDING: RO.orders.pending,
  DELIVERED: RO.orders.delivered,
  CANCELLED: RO.orders.cancelled,
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-700 bg-amber-50',
  DELIVERED: 'text-emerald-700 bg-emerald-50',
  CANCELLED: 'text-red-700 bg-red-50',
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <>
      <Header title={RO.dashboard.title} />
      <PageWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={RO.dashboard.revenueThisMonth}
            value={formatCurrency(data.kpis.totalRevenue)}
            trend={data.kpis.revenueChange !== null ? { value: data.kpis.revenueChange } : undefined}
            icon={'\uD83D\uDCB0'}
          />
          <StatCard
            label={RO.dashboard.ordersThisMonth}
            value={String(data.kpis.orderCount)}
            trend={data.kpis.orderCountChange !== null ? { value: data.kpis.orderCountChange } : undefined}
            icon={'\uD83D\uDCE6'}
          />
          <StatCard
            label={RO.dashboard.activeClients}
            value={String(data.kpis.activeClients)}
            icon={'\uD83D\uDC65'}
          />
          <StatCard
            label={RO.dashboard.outstandingPayments}
            value={formatCurrency(data.kpis.outstandingPayments)}
            icon={'\u23F3'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{RO.dashboard.topClients}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{RO.clients.company}</TableHead>
                    <TableHead className="text-right">{RO.reports.revenue}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                        {RO.common.noData}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topClients.map((client) => (
                      <TableRow key={client.clientId}>
                        <TableCell className="font-medium">{client.companyName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(client.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{RO.dashboard.slowMovers}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{RO.products.name}</TableHead>
                    <TableHead>{RO.products.category}</TableHead>
                    <TableHead className="text-right">{RO.products.stock}</TableHead>
                    <TableHead className="text-right">{RO.reports.salesVelocity}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slowMovers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {RO.common.noData}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.slowMovers.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">{product.stockQty}</TableCell>
                        <TableCell className="text-right">{product.salesVelocity.toFixed(2)}/lun\u0103</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{RO.dashboard.recentOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead>{RO.orders.client}</TableHead>
                  <TableHead>{RO.orders.date}</TableHead>
                  <TableHead className="text-right">{RO.orders.total}</TableHead>
                  <TableHead>{RO.common.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      {RO.common.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentOrders.map((order, i) => (
                    <TableRow key={order.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{order.clientName}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? 'text-gray-700 bg-gray-50'}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  )
}
