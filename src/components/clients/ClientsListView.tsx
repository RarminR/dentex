'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { RO } from '@/lib/constants/ro'
import { formatPercent } from '@/lib/utils/format'
import { getClients, type ClientRow, type ClientListResult } from '@/lib/actions/clients'

interface ClientsListViewProps {
  initialData: ClientListResult
  cities: string[]
}

export function ClientsListView({ initialData, cities }: ClientsListViewProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)

  const fetchClients = useCallback(async (params: { search: string; city: string; page: number }) => {
    const result = await getClients({
      search: params.search || undefined,
      city: params.city || undefined,
      page: params.page,
      pageSize: 10,
    })
    setData(result)
  }, [])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setPage(1)
    fetchClients({ search: value, city, page: 1 })
  }, 300)

  useEffect(() => {
    fetchClients({ search, city, page })
  }, [city, page, fetchClients, search])

  function handleSearchChange(value: string) {
    setSearch(value)
    debouncedSearch(value)
  }

  function handleCityChange(value: string) {
    setCity(value)
    setPage(1)
  }

  const columns: Column<ClientRow>[] = [
    {
      key: 'companyName',
      header: RO.clients.company,
      cell: (row) => (
        <Link href={`/clients/${row.id}`} className="text-blue-600 hover:underline font-medium">
          {row.companyName}
        </Link>
      ),
    },
    {
      key: 'contactPerson',
      header: RO.clients.contact,
      cell: (row) => row.contactPerson ?? '—',
    },
    {
      key: 'city',
      header: RO.clients.city,
      cell: (row) => row.city ?? '—',
    },
    {
      key: 'discountPercent',
      header: RO.clients.discount,
      cell: (row) => formatPercent(row.discountPercent.toString()),
      className: 'text-right',
    },
    {
      key: 'status',
      header: RO.common.status,
      cell: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? RO.common.active : RO.common.inactive}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={RO.common.search}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={city}
          onChange={e => handleCityChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-white max-w-xs"
        >
          <option value="">{RO.clients.allCities}</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Button asChild>
          <Link href="/clients/new">{RO.clients.add}</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data.clients}
        pagination={{
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
