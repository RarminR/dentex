import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getProducts } from '@/lib/actions/products'
import { ProductsListClient } from '@/components/products/ProductsListClient'

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const category = params.category || ''

  const { data, total, pageSize } = await getProducts({
    page,
    pageSize: 10,
    search: search || undefined,
    category: category || undefined,
  })

  return (
    <>
      <Header title={RO.products.title} />
      <PageWrapper>
        <ProductsListClient
          products={data}
          total={total}
          page={page}
          pageSize={pageSize}
          search={search}
          category={category}
        />
      </PageWrapper>
    </>
  )
}
