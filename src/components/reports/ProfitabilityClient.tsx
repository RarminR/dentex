'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable, Column } from '@/components/ui/DataTable'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import { RO } from '@/lib/constants/ro'
import Link from 'next/link'

interface ProfitabilityRow {
  clientId: string
  clientName: string
  totalRevenue: string
  totalCost: string
  profit: string
  marginPercent: string
  orderCount: number
}

const DATE_RANGES = [
  { value: '30', label: 'Ultimele 30 zile' },
  { value: '90', label: 'Ultimele 90 zile' },
  { value: '365', label: 'Ultimele 365 zile' },
  { value: 'all', label: 'Toate' },
] as const

const columns: Column<ProfitabilityRow>[] = [
  {
    key: 'clientName',
    header: RO.orders.client,
    cell: (row) => (
      <Link href={`/clients/${row.clientId}`} className="font-medium text-blue-600 hover:underline">
        {row.clientName}
      </Link>
    ),
  },
  {
    key: 'totalRevenue',
    header: 'Total V\u00E2nz\u0103ri',
    cell: (row) => formatCurrency(row.totalRevenue),
    className: 'text-right',
  },
  {
    key: 'totalCost',
    header: 'Cost Total',
    cell: (row) => formatCurrency(row.totalCost),
    className: 'text-right',
  },
  {
    key: 'profit',
    header: RO.reports.profit,
    cell: (row) => (
      <span className={parseFloat(row.profit) >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
        {formatCurrency(row.profit)}
      </span>
    ),
    className: 'text-right',
  },
  {
    key: 'marginPercent',
    header: 'Marj\u0103 %',
    cell: (row) => formatPercent(row.marginPercent),
    className: 'text-right',
  },
  {
    key: 'orderCount',
    header: 'Nr. Comenzi',
    cell: (row) => row.orderCount,
    className: 'text-right',
  },
]

export function ProfitabilityClient({ data }: { data: ProfitabilityRow[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get('range') || '30'

  const onRangeChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all') {
        params.delete('range')
      } else {
        params.set('range', value)
      }
      router.push(`/reports/profitability?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={currentRange} onValueChange={onRangeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-500">
          Valorile sunt f\u0103r\u0103 TVA (+19% TVA)
        </p>
      </div>

      <DataTable columns={columns} data={data} emptyMessage="Nu exist\u0103 date pentru perioada selectat\u0103" />
    </div>
  )
}
