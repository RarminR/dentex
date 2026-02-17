"use client"

import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { z } from 'zod'

import { parseCsvFile, type ParseCsvOptions } from '@/lib/import/parser'
import type { CsvParseError, ImportValidationError } from '@/lib/import/types'
import { validateRows } from '@/lib/import/validator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type CsvUploaderProps<Row extends Record<string, unknown>> = {
  onImport: (rows: Row[]) => Promise<void> | void
  schema?: z.ZodType<Row>
  parseOptions?: ParseCsvOptions<Row>
  maxPreviewRows?: number
}

export function CsvUploader<Row extends Record<string, unknown>>({
  onImport,
  schema,
  parseOptions,
  maxPreviewRows = 5,
}: CsvUploaderProps<Row>) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<Row[]>([])
  const [parseErrors, setParseErrors] = useState<CsvParseError[]>([])
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const previewRows = useMemo(() => rows.slice(0, maxPreviewRows), [rows, maxPreviewRows])
  const previewColumns = useMemo(
    () =>
      previewRows.length > 0
        ? Object.keys(previewRows[0]).filter((column) => column !== '__parsed_extra')
        : [],
    [previewRows],
  )

  async function handleFile(file: File) {
    setIsProcessing(true)
    setProgress(20)

    const parsed = await parseCsvFile<Row>(file, parseOptions)
    setProgress(60)

    setParseErrors(parsed.errors)
    if (parsed.errors.length > 0) {
      setRows([])
      setValidationErrors([])
      setProgress(100)
      setIsProcessing(false)
      return
    }

    if (!schema) {
      setRows(parsed.rows)
      setValidationErrors([])
      setProgress(100)
      setIsProcessing(false)
      return
    }

    const validated = validateRows(parsed.rows, schema)
    setRows(validated.valid)
    setValidationErrors(validated.errors)
    setProgress(100)
    setIsProcessing(false)
  }

  async function handleImport() {
    if (rows.length === 0 || validationErrors.length > 0) return

    setIsImporting(true)
    await onImport(rows)
    setIsImporting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Încarcă fișier CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)

            const file = event.dataTransfer.files?.[0]
            if (!file) return
            void handleFile(file)
          }}
        >
          <Upload className="text-muted-foreground mx-auto mb-3 size-8" />
          <p className="font-medium">Trage fișierul aici</p>
          <p className="text-muted-foreground mt-1 text-sm">sau selectează din calculator</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              void handleFile(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            Încarcă fișier CSV
          </Button>
        </div>

        {(isProcessing || progress > 0) && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded bg-muted">
              <div
                className="bg-primary h-2 rounded transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">{progress}%</p>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Previzualizare</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  {previewColumns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {previewColumns.map((column) => (
                      <TableCell key={column}>{String(row[column] ?? '')}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {parseErrors.length > 0 && (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <h3 className="text-sm font-semibold text-destructive">Erori de validare</h3>
            <ul className="space-y-1 text-sm">
              {parseErrors.map((error, index) => (
                <li key={`${error.message}-${index}`}>
                  {error.row ? `Rând ${error.row}: ` : ''}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <h3 className="text-sm font-semibold text-destructive">Erori de validare</h3>
            <ul className="space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={`${error.row}-${error.field}-${index}`}>
                  Rând {error.row}, {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          type="button"
          disabled={rows.length === 0 || validationErrors.length > 0 || isImporting || isProcessing}
          onClick={() => {
            void handleImport()
          }}
        >
          {isImporting ? 'Se importă...' : 'Importă'}
        </Button>
      </CardContent>
    </Card>
  )
}
