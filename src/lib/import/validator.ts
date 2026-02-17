import { z } from 'zod'

import type { ImportValidationResult } from './types'

type ValidateRowsOptions = {
  rowOffset?: number
}

export function validateRows<RowInput, RowOutput>(
  rows: RowInput[],
  schema: z.ZodType<RowOutput>,
  options: ValidateRowsOptions = {},
): ImportValidationResult<RowOutput> {
  const rowOffset = options.rowOffset ?? 2

  const valid: RowOutput[] = []
  const errors: ImportValidationResult<RowOutput>['errors'] = []

  rows.forEach((row, index) => {
    const result = schema.safeParse(row)

    if (result.success) {
      valid.push(result.data)
      return
    }

    result.error.issues.forEach((issue) => {
      errors.push({
        row: index + rowOffset,
        field: String(issue.path[0] ?? 'general'),
        message: issue.message,
      })
    })
  })

  return {
    valid,
    errors,
  }
}
