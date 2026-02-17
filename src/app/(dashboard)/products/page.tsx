import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'

export default function ProductsPage() {
  return (
    <>
      <Header title={RO.products.title} />
      <PageWrapper>
        <p className="text-gray-500">În construcție...</p>
      </PageWrapper>
    </>
  )
}
