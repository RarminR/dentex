import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getOffer } from '@/lib/actions/offers'
import { OfferEditor } from '@/components/offers/OfferEditor'

interface OfferViewPageProps {
  params: Promise<{ clientId: string; offerId: string }>
}

export default async function OfferViewPage({ params }: OfferViewPageProps) {
  const { offerId } = await params
  const offer = await getOffer(offerId)

  if (!offer) notFound()

  return (
    <>
      <Header title={`Ofert\u0103 pentru: ${offer.clientName}`} />
      <PageWrapper>
        <OfferEditor initialOffer={offer} />
      </PageWrapper>
    </>
  )
}
