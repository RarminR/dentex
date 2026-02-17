'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { z } from 'zod'

import { CsvUploader } from '@/components/import/CsvUploader'
import { Button } from '@/components/ui/button'
import { parseRomanianDate, parseRomanianNumber, type ParseCsvOptions } from '@/lib/import/parser'
import { ORDER_CSV_COLUMNS } from '@/lib/import/orders'
import type { OrderImportResult } from '@/lib/actions/import'

const orderCsvSchema = z.object({
  Client: z.string().min(1),
  'Dat\u0103 Comand\u0103': z.string().min(1),
  'Produs SKU': z.string().min(1),
  Cantitate: z.string().min(1),
  'Pre\u021b Unitar': z.string().min(1),
  Status: z.string().min(1),
  'Pl\u0103tit': z.string().optional().default('0'),
})

type OrderCsvRow = z.infer<typeof orderCsvSchema>

const parseOptions: ParseCsvOptions<OrderCsvRow> = {
  transformers: {
    'Dat\u0103 Comand\u0103': (value) => parseRomanianDate(value) ?? value,
    'Pre\u021b Unitar': (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(num) : value
    },
    'Pl\u0103tit': (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(num) : value
    },
    Cantitate: (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(Math.round(num)) : value
    },
  },
}

export default function OrdersImportPage() {
  const [result, setResult] = useState<OrderImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(rows: OrderCsvRow[]) {
    setResult(null)
    setError(null)

    const csvHeader = ORDER_CSV_COLUMNS.join(',')
    const csvRows = rows.map((row) =>
      ORDER_CSV_COLUMNS.map((col) => {
        const value = String(row[col as keyof OrderCsvRow] ?? '')
        return value.includes(',') ? `"${value}"` : value
      }).join(','),
    )
    const csvText = [csvHeader, ...csvRows].join('\n')

    const formData = new FormData()
    formData.append('file', new Blob([csvText], { type: 'text/csv' }), 'orders.csv')

    try {
      const { importOrders } = await import('@/lib/actions/import')
      const importResult = await importOrders(formData)
      setResult(importResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la import')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import Comenzi</h1>
          <p className="text-muted-foreground text-sm">
            Coloane a{'\u0219'}teptate: {ORDER_CSV_COLUMNS.join(', ')}
          </p>
        </div>
      </div>

      <CsvUploader<OrderCsvRow>
        onImport={handleImport}
        schema={orderCsvSchema}
        parseOptions={parseOptions}
      />

      {result && result.errors.length === 0 && (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Import reu{'\u0219'}it</p>
            <p className="text-sm text-emerald-700">
              {result.ordersCreated} comenzi create, {result.itemsCreated} articole, 0 erori
            </p>
          </div>
        </div>
      )}

      {result && result.errors.length > 0 && (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                {result.ordersCreated > 0
                  ? `Par\u021bial: ${result.ordersCreated} comenzi create, ${result.errors.length} erori`
                  : `Import e\u0219uat: ${result.errors.length} erori`}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {result.errors.map((err, i) => (
                  <li key={`${err.row}-${err.field}-${i}`}>
                    {err.row > 0 ? `R\u00e2nd ${err.row}: ` : ''}
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
