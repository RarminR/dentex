'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RO } from '@/lib/constants/ro'
import { formatCurrency } from '@/lib/utils/format'

type Tab = 'top' | 'slow'

interface ProductPerformanceRow {
  productId: string
  productName: string
  category: string | null
  totalUnitsSold: number
  uniqueClients: number
  totalRevenue: number
  salesVelocity: number
}

interface SlowMoverRow {
  productId: string
  productName: string
  category: string | null
  stockQty: number
  lastOrderDate: Date | null
  totalUnitsSold: number
  salesVelocity: number
}

interface Props {
  topSellers: ProductPerformanceRow[]
  slowMovers: SlowMoverRow[]
}

const topColumns: Column<ProductPerformanceRow>[] = [
  { key: 'name', header: RO.products.name, cell: (r) => r.productName },
  { key: 'category', header: RO.products.category, cell: (r) => r.category },
  { key: 'units', header: RO.reports.unitsSold, cell: (r) => r.totalUnitsSold, className: 'text-right' },
  { key: 'clients', header: RO.reports.uniqueClients, cell: (r) => r.uniqueClients, className: 'text-right' },
  { key: 'revenue', header: RO.reports.revenue, cell: (r) => formatCurrency(r.totalRevenue), className: 'text-right' },
  { key: 'velocity', header: RO.reports.salesVelocity, cell: (r) => r.salesVelocity.toFixed(1), className: 'text-right font-medium' },
]

const slowColumns: Column<SlowMoverRow>[] = [
  { key: 'name', header: RO.products.name, cell: (r) => r.productName },
  { key: 'category', header: RO.products.category, cell: (r) => r.category },
  { key: 'units', header: RO.reports.unitsSold, cell: (r) => r.totalUnitsSold, className: 'text-right' },
  { key: 'stock', header: RO.products.stock, cell: (r) => r.stockQty, className: 'text-right' },
  {
    key: 'lastOrder',
    header: 'Ultima Comand\u0103',
    cell: (r) => r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString('ro-RO') : '\u2014',
  },
  { key: 'velocity', header: RO.reports.salesVelocity, cell: (r) => r.salesVelocity.toFixed(1), className: 'text-right font-medium' },
]

export function ProductReportView({ topSellers, slowMovers }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('top')

  const updateDateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/reports/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = useCallback(() => {
    router.push('/reports/products')
  }, [router])

  const hasFilters = searchParams.has('dateFrom') || searchParams.has('dateTo')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            className="w-[160px]"
            defaultValue={searchParams.get('dateFrom') ?? ''}
            onChange={(e) => updateDateParam('dateFrom', e.target.value)}
          />
          <span className="text-gray-400">{'\u2013'}</span>
          <Input
            type="date"
            className="w-[160px]"
            defaultValue={searchParams.get('dateTo') ?? ''}
            onChange={(e) => updateDateParam('dateTo', e.target.value)}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {'\u2715'}
          </Button>
        )}
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'top'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {RO.reports.topSellers}
        </button>
        <button
          onClick={() => setActiveTab('slow')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'slow'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {RO.reports.slowMovers}
        </button>
      </div>

      {activeTab === 'top' ? (
        <DataTable columns={topColumns} data={topSellers} />
      ) : (
        <DataTable columns={slowColumns} data={slowMovers} />
      )}
    </div>
  )
}
