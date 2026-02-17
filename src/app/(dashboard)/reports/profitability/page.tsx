import { Suspense } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getClientProfitability } from '@/lib/actions/reports'
import { ProfitabilityClient } from '@/components/reports/ProfitabilityClient'

interface Props {
  searchParams: Promise<{
    range?: string
  }>
}

export default async function ProfitabilityPage({ searchParams }: Props) {
  const params = await searchParams
  const range = params.range || '30'

  let dateFrom: Date | undefined
  if (range !== 'all') {
    const days = parseInt(range, 10)
    if (!isNaN(days)) {
      dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
    }
  }

  const data = await getClientProfitability({ dateFrom })

  return (
    <>
      <Header title={RO.reports.profitability} />
      <PageWrapper>
        <div className="space-y-4">
          <div>
            <Link href="/reports" className="text-sm text-blue-600 hover:underline">
              &larr; {RO.common.back}
            </Link>
          </div>
          <Suspense>
            <ProfitabilityClient data={data} />
          </Suspense>
        </div>
      </PageWrapper>
    </>
  )
}
