import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { generateOffer, getOffer } from '@/lib/actions/offers'
import { getClient } from '@/lib/actions/clients'
import { OfferEditor } from '@/components/offers/OfferEditor'

interface OfferPageProps {
  params: Promise<{ clientId: string }>
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { clientId } = await params
  const client = await getClient(clientId)

  if (!client) notFound()

  const result = await generateOffer(clientId)

  if (!result.success || !result.offerId) {
    return (
      <>
        <Header title={`Ofert\u0103 pentru: ${client.companyName}`} />
        <PageWrapper>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30">
            <p className="text-red-800 dark:text-red-300">
              Eroare la generarea ofertei: {result.error ?? 'Eroare necunoscut\u0103'}
            </p>
          </div>
        </PageWrapper>
      </>
    )
  }

  const offer = await getOffer(result.offerId)

  if (!offer) notFound()

  return (
    <>
      <Header title={`Ofert\u0103 pentru: ${client.companyName}`} />
      <PageWrapper>
        <OfferEditor initialOffer={offer} />
      </PageWrapper>
    </>
  )
}
