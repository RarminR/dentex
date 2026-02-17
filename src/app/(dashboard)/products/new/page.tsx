import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { ProductForm } from '@/components/products/ProductForm'

export default function NewProductPage() {
  return (
    <>
      <Header title={RO.products.add} />
      <PageWrapper className="max-w-2xl">
        <ProductForm />
      </PageWrapper>
    </>
  )
}
