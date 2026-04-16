import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getProductsForLookup } from '@/lib/actions/lookup'
import { ProductClientLookup } from '@/components/lookup/ProductClientLookup'
import { RO } from '@/lib/constants/ro'
import { auth } from '@/lib/auth'

export default async function LookupPage() {
  const [products, session] = await Promise.all([
    getProductsForLookup(),
    auth(),
  ])

  const agentName = session?.user?.name ?? 'Echipa DenteX'

  return (
    <>
      <Header title={RO.nav.lookup} />
      <PageWrapper>
        <ProductClientLookup products={products} agentName={agentName} />
      </PageWrapper>
    </>
  )
}
