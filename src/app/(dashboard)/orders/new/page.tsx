import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getClients } from '@/lib/actions/clients'
import { getProducts } from '@/lib/actions/products'
import { NewOrderForm } from '@/components/orders/NewOrderForm'

export default async function NewOrderPage() {
  const [clientsResult, productsResult] = await Promise.all([
    getClients({ pageSize: 200 }),
    getProducts({ pageSize: 200 }),
  ])

  return (
    <>
      <Header title={RO.orders.add} />
      <PageWrapper>
        <NewOrderForm
          clients={clientsResult.clients.map((c) => ({
            id: c.id,
            companyName: c.companyName,
            discountPercent: c.discountPercent,
          }))}
          products={productsResult.data.map((p: { id: string; name: string; sku: string; category: string | null; unitPrice: { toString(): string } }) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            unitPrice: p.unitPrice,
          }))}
        />
      </PageWrapper>
    </>
  )
}
