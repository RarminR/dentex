import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RO } from '@/lib/constants/ro'
import { getEngineConfig } from '@/lib/actions/settings'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const config = await getEngineConfig()

  return (
    <>
      <Header title={RO.settings.title} />
      <PageWrapper>
        <SettingsClient initialConfig={config} />
      </PageWrapper>
    </>
  )
}
