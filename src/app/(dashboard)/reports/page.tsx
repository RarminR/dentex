import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'

const reportLinks = [
  {
    href: '/reports/profitability',
    title: RO.reports.profitability,
    description: 'Analiz\u0103 profitabilitatea pe fiecare client: venituri, costuri, marj\u0103 de profit.',
  },
  {
    href: '/reports/products',
    title: RO.reports.products,
    description: 'Performan\u021Ba produselor: unit\u0103\u021Bi v\u00E2ndute, venituri, vitez\u0103 de v\u00E2nzare.',
  },
]

export default function ReportsPage() {
  return (
    <>
      <Header title={RO.reports.title} />
      <PageWrapper>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">{link.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </PageWrapper>
    </>
  )
}
