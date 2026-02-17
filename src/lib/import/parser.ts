import Papa from 'papaparse'

import type { CsvParseResult } from './types'

export const MAX_CSV_FILE_SIZE_BYTES = 10 * 1024 * 1024

type CsvRow = Record<string, string>

type CsvTransformer = (value: string, row: CsvRow) => unknown

export type ParseCsvOptions<Row extends Record<string, unknown>> = {
  delimiter?: string
  transformers?: Partial<Record<keyof Row | string, CsvTransformer>>
}

export function parseRomanianDate(value: string): string | null {
  const input = value.trim()
  if (!input) return null

  const match = input.match(/^(\d{2})[./](\d{2})[./](\d{4})$/)
  if (!match) return null

  const day = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10)
  const year = Number.parseInt(match[3], 10)

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  const isoMonth = String(month).padStart(2, '0')
  const isoDay = String(day).padStart(2, '0')
  return `${year}-${isoMonth}-${isoDay}`
}

export function parseRomanianNumber(value: string): number | null {
  const input = value.trim()
  if (!input) return null

  const normalized = input.replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

export function parseCsvText<Row extends Record<string, unknown> = CsvRow>(
  csvText: string,
  options: ParseCsvOptions<Row> = {},
): CsvParseResult<Row> {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: options.delimiter,
    transformHeader: (header) => header.trim(),
  })

  const errors = parsed.errors.map((error) => ({
    message: error.message,
    row: typeof error.row === 'number' ? error.row + 2 : undefined,
  }))

  const rows = parsed.data.map((rawRow) => applyTransformers<Row>(rawRow, options.transformers))

  return {
    rows,
    errors,
    fields: parsed.meta.fields ?? [],
  }
}

export async function parseCsvFile<Row extends Record<string, unknown> = CsvRow>(
  file: File,
  options: ParseCsvOptions<Row> = {},
): Promise<CsvParseResult<Row>> {
  if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
    return {
      rows: [],
      fields: [],
      errors: [{ message: 'Fișierul depășește limita de 10MB.' }],
    }
  }

  const csvText = await file.text()
  if (!isLikelyUtf8(csvText)) {
    return {
      rows: [],
      fields: [],
      errors: [{ message: 'Fișierul trebuie să fie codificat UTF-8.' }],
    }
  }

  return parseCsvText<Row>(csvText, options)
}

function applyTransformers<Row extends Record<string, unknown>>(
  rawRow: CsvRow,
  transformers?: Partial<Record<string, CsvTransformer>>,
): Row {
  if (!transformers) {
    return rawRow as Row
  }

  const transformed: Record<string, unknown> = { ...rawRow }

  for (const [field, transformer] of Object.entries(transformers)) {
    if (!transformer) continue
    transformed[field] = transformer(rawRow[field] ?? '', rawRow)
  }

  return transformed as Row
}

function isLikelyUtf8(text: string): boolean {
  if (text.includes('\uFFFD')) return false

  const mojibakeHints = ['Ã', 'Å', 'Ä']
  return !mojibakeHints.some((hint) => text.includes(hint))
}
