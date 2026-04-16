'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDebouncedCallback } from 'use-debounce'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import type { Product } from '@prisma/client'

interface ProductsListClientProps {
  products: Product[]
  total: number
  page: number
  pageSize: number
  search?: string
  category?: string
}

function computeMargin(unitPrice: string | number, acquisitionPrice: string | number): number {
  const up = Number(unitPrice)
  const ap = Number(acquisitionPrice)
  if (up === 0) return 0
  return ((up - ap) / up) * 100
}

export function ProductsListClient({
  products,
  total,
  page,
  pageSize,
  search = '',
  category = '',
}: ProductsListClientProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(search)

  const updateURL = useCallback((params: Record<string, string>) => {
    const url = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) url.set(key, value)
    }
    router.push(`/products?${url.toString()}`)
  }, [router])

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateURL({ search: value, category, page: '1' })
  }, 300)

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value)
    debouncedSearch(e.target.value)
  }

  function handleCategoryChange(value: string) {
    const cat = value === 'all' ? '' : value
    updateURL({ search: searchValue, category: cat, page: '1' })
  }

  function handlePageChange(newPage: number) {
    updateURL({ search: searchValue, category, page: String(newPage) })
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: RO.products.name,
      cell: (row) => (
        <Link href={`/products/${row.id}`} className="text-blue-600 hover:underline font-medium">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'sku',
      header: RO.products.sku,
      cell: (row) => <span className="font-mono text-sm text-gray-600">{row.sku}</span>,
    },
    {
      key: 'category',
      header: RO.products.category,
      cell: (row) => row.category ?? '—',
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (row) => (
        <Badge
          variant="outline"
          className={
            row.role === 'ANCHOR'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-orange-300 bg-orange-50 text-orange-700'
          }
        >
          {row.role === 'ANCHOR' ? 'Ancoră' : 'Upsell'}
        </Badge>
      ),
    },
    {
      key: 'unitPrice',
      header: RO.products.sellPrice,
      cell: (row) => formatCurrency(row.unitPrice.toString()),
      className: 'text-right',
    },
    {
      key: 'acquisitionPrice',
      header: RO.products.costPrice,
      cell: (row) => formatCurrency(row.acquisitionPrice.toString()),
      className: 'text-right',
    },
    {
      key: 'margin',
      header: RO.products.margin,
      cell: (row) => {
        const margin = computeMargin(row.unitPrice.toString(), row.acquisitionPrice.toString())
        return (
          <span className={margin < 20 ? 'text-red-600' : margin < 35 ? 'text-amber-600' : 'text-green-600'}>
            {formatPercent(margin)}
          </span>
        )
      },
      className: 'text-right',
    },
    {
      key: 'stockQty',
      header: RO.products.stock,
      cell: (row) => (
        <span className={row.stockQty <= 10 ? 'text-red-600 font-semibold' : ''}>
          {row.stockQty}
        </span>
      ),
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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input
            placeholder={RO.common.search}
            value={searchValue}
            onChange={handleSearchChange}
            className="max-w-xs"
          />
          <Input
            placeholder="Filtru categorie..."
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value || 'all')}
            className="max-w-[200px]"
          />
        </div>
        <Link href="/products/new">
          <Button>{RO.products.add}</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  )
}
