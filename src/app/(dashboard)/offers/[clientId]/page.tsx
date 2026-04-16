import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getClient } from '@/lib/actions/clients'
import { getUpsellProducts } from '@/lib/actions/offers'
import { UpsellSelector } from '@/components/offers/UpsellSelector'

interface OfferPageProps {
  params: Promise<{ clientId: string }>
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { clientId } = await params
  const [client, upsellProducts] = await Promise.all([
    getClient(clientId),
    getUpsellProducts(),
  ])

  if (!client) notFound()

  return (
    <>
      <Header title={`Ofert\u0103 pentru: ${client.companyName}`} />
      <PageWrapper>
        <UpsellSelector
          clientId={clientId}
          clientName={client.companyName}
          upsellProducts={upsellProducts as unknown as { id: string; name: string; sku: string; category: string | null; unitPrice: string }[]}
        />
      </PageWrapper>
    </>
  )
}
