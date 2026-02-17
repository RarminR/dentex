import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'

export default function ReportsPage() {
  return (
    <>
      <Header title={RO.reports.title} />
      <PageWrapper>
        <p className="text-gray-500">În construcție...</p>
      </PageWrapper>
    </>
  )
}
