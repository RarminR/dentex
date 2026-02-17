'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RO } from '@/lib/constants/ro'
import { deactivateClient } from '@/lib/actions/clients'

interface DeactivateButtonProps {
  clientId: string
}

export function DeactivateButton({ clientId }: DeactivateButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDeactivate() {
    setLoading(true)
    await deactivateClient(clientId)
    router.push('/clients')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" disabled={loading} onClick={handleDeactivate}>
          {loading ? RO.common.loading : RO.common.confirm}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)}>
          {RO.common.cancel}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" onClick={() => setConfirming(true)}>
      {RO.common.deactivate}
    </Button>
  )
}
