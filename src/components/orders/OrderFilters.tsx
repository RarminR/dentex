'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RO } from '@/lib/constants/ro'

interface ClientOption {
  id: string
  companyName: string
}

const ORDER_STATUSES = [
  { value: 'PENDING', label: RO.orders.pending },
  { value: 'DELIVERED', label: RO.orders.delivered },
  { value: 'CANCELLED', label: RO.orders.cancelled },
] as const

export function OrderFilters({ clients }: { clients: ClientOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/orders?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push('/orders')
  }, [router])

  const hasFilters = searchParams.has('search') || searchParams.has('status') ||
    searchParams.has('clientId') || searchParams.has('dateFrom') || searchParams.has('dateTo')

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder={RO.common.search}
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => {
            const timeout = setTimeout(() => updateParams('search', e.target.value), 300)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <Select
        value={searchParams.get('status') ?? ''}
        onValueChange={(val) => updateParams('status', val === 'ALL' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={RO.common.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toate</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('clientId') ?? ''}
        onValueChange={(val) => updateParams('clientId', val === 'ALL' ? '' : val)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={RO.orders.client} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toți clienții</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2 items-center">
        <Input
          type="date"
          className="w-[150px]"
          defaultValue={searchParams.get('dateFrom') ?? ''}
          onChange={(e) => updateParams('dateFrom', e.target.value)}
        />
        <span className="text-gray-400">–</span>
        <Input
          type="date"
          className="w-[150px]"
          defaultValue={searchParams.get('dateTo') ?? ''}
          onChange={(e) => updateParams('dateTo', e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          ✕
        </Button>
      )}
    </div>
  )
}
