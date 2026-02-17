import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getOrders, getClientsForFilter } from '@/lib/actions/orders'
import { OrderFilters } from '@/components/orders/OrderFilters'
import { OrdersTable } from '@/components/orders/OrdersTable'

interface Props {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    clientId?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = 10

  const [{ orders, total }, clients] = await Promise.all([
    getOrders({
      page,
      pageSize,
      search: params.search,
      status: params.status,
      clientId: params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    getClientsForFilter(),
  ])

  return (
    <>
      <Header title={RO.orders.title} />
      <PageWrapper>
        <div className="space-y-4">
          <Suspense>
            <OrderFilters clients={clients} />
          </Suspense>
          <OrdersTable orders={orders} total={total} page={page} pageSize={pageSize} />
        </div>
      </PageWrapper>
    </>
  )
}
