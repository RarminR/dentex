export type ImportValidationError = {
  row: number
  field: string
  message: string
}

export type ImportValidationResult<Row> = {
  valid: Row[]
  errors: ImportValidationError[]
}

export type CsvParseError = {
  message: string
  row?: number
}

export type CsvParseResult<Row> = {
  rows: Row[]
  errors: CsvParseError[]
  fields: string[]
}
