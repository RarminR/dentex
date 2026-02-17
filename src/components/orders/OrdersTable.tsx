'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { OrderStatusBadge } from './OrderStatusBadge'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface OrderRow {
  id: string
  orderDate: Date | string
  totalAmount: { toString(): string }
  paidAmount: { toString(): string }
  status: string
  isPaid: boolean
  client: { companyName: string }
}

interface OrdersTableProps {
  orders: OrderRow[]
  total: number
  page: number
  pageSize: number
}

export function OrdersTable({ orders, total, page, pageSize }: OrdersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const columns: Column<OrderRow>[] = [
    {
      key: 'number',
      header: RO.orders.number,
      cell: (row) => (
        <Link href={`/orders/${row.id}`} className="text-blue-600 hover:underline font-medium">
          #{row.id.slice(-6).toUpperCase()}
        </Link>
      ),
    },
    {
      key: 'client',
      header: RO.orders.client,
      cell: (row) => row.client.companyName,
    },
    {
      key: 'date',
      header: RO.orders.date,
      cell: (row) => formatDate(row.orderDate),
    },
    {
      key: 'total',
      header: RO.orders.total,
      className: 'text-right',
      cell: (row) => formatCurrency(row.totalAmount.toString()),
    },
    {
      key: 'paid',
      header: RO.orders.paid,
      className: 'text-right',
      cell: (row) => formatCurrency(row.paidAmount.toString()),
    },
    {
      key: 'balance',
      header: RO.orders.balance,
      className: 'text-right',
      cell: (row) => {
        const balance = Number(row.totalAmount.toString()) - Number(row.paidAmount.toString())
        return (
          <span className={balance > 0 ? 'text-amber-700 font-medium' : 'text-gray-500'}>
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: RO.common.status,
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
  ]

  function onPageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <DataTable
      columns={columns}
      data={orders}
      pagination={{ page, pageSize, total, onPageChange }}
    />
  )
}
