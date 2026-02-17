import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'

export default function DashboardPage() {
  return (
    <>
      <Header title={RO.dashboard.title} />
      <PageWrapper>
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-500">Bun venit în DenteX</h2>
          <p className="text-gray-400 mt-2">Platforma de management pentru distribuitori dentari.</p>
        </div>
      </PageWrapper>
    </>
  )
}
