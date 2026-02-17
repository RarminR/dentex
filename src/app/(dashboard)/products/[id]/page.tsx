import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getProduct } from '@/lib/actions/products'
import { ProductDetailClient } from '@/components/products/ProductDetailClient'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header title={product.name} />
      <PageWrapper>
        <ProductDetailClient product={product} />
      </PageWrapper>
    </>
  )
}
