'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDebouncedCallback } from 'use-debounce'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

function computeMargin(unitPrice: string | number, costPrice: string | number): number {
  const up = Number(unitPrice)
  const cp = Number(costPrice)
  if (up === 0) return 0
  return ((up - cp) / up) * 100
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
      cell: (row) => row.category,
    },
    {
      key: 'unitPrice',
      header: RO.products.sellPrice,
      cell: (row) => formatCurrency(row.unitPrice.toString()),
      className: 'text-right',
    },
    {
      key: 'costPrice',
      header: RO.products.costPrice,
      cell: (row) => formatCurrency(row.costPrice.toString()),
      className: 'text-right',
    },
    {
      key: 'margin',
      header: RO.products.margin,
      cell: (row) => {
        const margin = computeMargin(row.unitPrice.toString(), row.costPrice.toString())
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
          <Select value={category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={RO.products.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate categoriile</SelectItem>
              {RO.products.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
