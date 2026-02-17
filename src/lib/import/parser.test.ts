import { describe, expect, it } from 'vitest'

import { parseCsvText, parseRomanianDate, parseRomanianNumber } from './parser'

describe('parseCsvText', () => {
  it('parses UTF-8 Romanian diacritics correctly', () => {
    const csv = 'nume;oras\nȘurub dentar;Târgu Mureș\n'

    const result = parseCsvText<Record<string, string>>(csv)

    expect(result.errors).toHaveLength(0)
    expect(result.rows[0]).toEqual({
      nume: 'Șurub dentar',
      oras: 'Târgu Mureș',
    })
  })
})

describe('parseRomanianDate', () => {
  it('converts DD.MM.YYYY to ISO date', () => {
    expect(parseRomanianDate('18.02.2026')).toBe('2026-02-18')
  })

  it('converts DD/MM/YYYY to ISO date', () => {
    expect(parseRomanianDate('18/02/2026')).toBe('2026-02-18')
  })
})

describe('parseRomanianNumber', () => {
  it('converts Romanian number format to number', () => {
    expect(parseRomanianNumber('1.234,56')).toBe(1234.56)
  })
})
