import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { ClientForm } from '@/components/clients/ClientForm'

export default function NewClientPage() {
  return (
    <>
      <Header title={RO.clients.add} />
      <PageWrapper>
        <ClientForm />
      </PageWrapper>
    </>
  )
}
