import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getProductPerformance, getSlowMovers } from '@/lib/actions/reports'
import { ProductReportView } from '@/components/reports/ProductReportView'

interface Props {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>
}

export default async function ProductsReportPage({ searchParams }: Props) {
  const params = await searchParams
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined
  const dateTo = params.dateTo ? new Date(params.dateTo + 'T23:59:59.999Z') : undefined

  const [topSellers, slowMovers] = await Promise.all([
    getProductPerformance({ dateFrom, dateTo }),
    getSlowMovers({ dateFrom, dateTo }),
  ])

  return (
    <>
      <Header title={RO.reports.products} />
      <PageWrapper>
        <Suspense fallback={<p className="text-gray-500">{RO.common.loading}</p>}>
          <ProductReportView topSellers={topSellers} slowMovers={slowMovers} />
        </Suspense>
      </PageWrapper>
    </>
  )
}
