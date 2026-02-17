'use client'

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RO } from '@/lib/constants/ro'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pagination?: PaginationProps
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, pagination, emptyMessage }: DataTableProps<T>) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                {emptyMessage ?? RO.common.noData}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>{col.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-gray-600">
            {RO.pagination.showing} {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} {RO.pagination.of} {pagination.total} {RO.pagination.results}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              {RO.pagination.previous}
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              {RO.pagination.next}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
