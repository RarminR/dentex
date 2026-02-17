'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { z } from 'zod'

import { CsvUploader } from '@/components/import/CsvUploader'
import { Button } from '@/components/ui/button'
import { parseRomanianNumber, type ParseCsvOptions } from '@/lib/import/parser'
import { PRODUCT_CSV_COLUMNS } from '@/lib/import/products'
import type { ProductImportResult } from '@/lib/import/products'

const productCsvSchema = z.object({
  Nume: z.string().min(1),
  SKU: z.string().min(1),
  Categorie: z.string().min(1),
  'Pre\u021b V\u00e2nzare': z.string().min(1),
  'Pre\u021b Achizi\u021bie': z.string().min(1),
  Stoc: z.string().min(1),
  Descriere: z.string().optional().default(''),
})

type ProductCsvRow = z.infer<typeof productCsvSchema>

const CSV_COLUMNS = Object.keys(PRODUCT_CSV_COLUMNS)

const parseOptions: ParseCsvOptions<ProductCsvRow> = {
  transformers: {
    'Pre\u021b V\u00e2nzare': (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(num) : value
    },
    'Pre\u021b Achizi\u021bie': (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(num) : value
    },
    Stoc: (value) => {
      const num = parseRomanianNumber(value)
      return num !== null ? String(Math.round(num)) : value
    },
  },
}

export default function ProductsImportPage() {
  const [result, setResult] = useState<ProductImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(rows: ProductCsvRow[]) {
    setResult(null)
    setError(null)

    const csvHeader = CSV_COLUMNS.join(',')
    const csvRows = rows.map((row) =>
      CSV_COLUMNS.map((col) => {
        const value = String(row[col as keyof ProductCsvRow] ?? '')
        return value.includes(',') ? `"${value}"` : value
      }).join(','),
    )
    const csvText = [csvHeader, ...csvRows].join('\n')

    const formData = new FormData()
    formData.append('file', new Blob([csvText], { type: 'text/csv' }), 'products.csv')

    try {
      const { importProducts } = await import('@/lib/actions/import')
      const importResult = await importProducts(formData)
      setResult(importResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la import')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import{'\u0103'} Produse</h1>
          <p className="text-muted-foreground text-sm">
            Coloane a{'\u0219'}teptate: {CSV_COLUMNS.join(', ')}
          </p>
        </div>
      </div>

      <CsvUploader<ProductCsvRow>
        onImport={handleImport}
        schema={productCsvSchema}
        parseOptions={parseOptions}
      />

      {result && result.errors.length === 0 && (
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Import reu{'\u0219'}it</p>
            <p className="text-sm text-emerald-700">
              {result.imported} importate, {result.updated} actualizate, 0 erori
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
                {result.imported + result.updated > 0
                  ? `Par\u021bial: ${result.imported} importate, ${result.updated} actualizate, ${result.errors.length} erori`
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
