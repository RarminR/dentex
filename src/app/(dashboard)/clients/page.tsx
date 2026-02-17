import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getClients } from '@/lib/actions/clients'
import { prisma } from '@/lib/prisma'
import { ClientsListView } from '@/components/clients/ClientsListView'

export default async function ClientsPage() {
  const [initialData, citiesRaw] = await Promise.all([
    getClients({ page: 1, pageSize: 10 }),
    prisma.client.findMany({
      where: { isActive: true, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    }),
  ])

  const cities = citiesRaw
    .map((c: { city: string | null }) => c.city)
    .filter((c: string | null): c is string => c !== null)

  return (
    <>
      <Header title={RO.clients.title} />
      <PageWrapper>
        <ClientsListView initialData={initialData} cities={cities} />
      </PageWrapper>
    </>
  )
}
