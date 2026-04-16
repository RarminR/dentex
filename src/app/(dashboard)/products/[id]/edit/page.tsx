import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getProduct } from '@/lib/actions/products'
import { ProductForm } from '@/components/products/ProductForm'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header title={`${RO.common.edit} - ${product.name}`} />
      <PageWrapper className="max-w-2xl">
        <ProductForm
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            role: product.role,
            description: product.description,
            unitPrice: product.unitPrice.toString(),
            tvaPrice: product.tvaPrice.toString(),
            brutPrice: product.brutPrice.toString(),
            acquisitionPrice: product.acquisitionPrice.toString(),
            stockQty: product.stockQty,
          }}
        />
      </PageWrapper>
    </>
  )
}
