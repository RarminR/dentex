import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercent, calculateWithTVA, formatDate } from './format'

describe('formatCurrency', () => {
  it('formats 1000 as 1.000,00 RON', () => {
    expect(formatCurrency(1000)).toBe('1.000,00 RON')
  })
  it('formats 1234.56 as 1.234,56 RON', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56 RON')
  })
  it('formats 0 as 0,00 RON', () => {
    expect(formatCurrency(0)).toBe('0,00 RON')
  })
})

describe('formatPercent', () => {
  it('formats 15 as 15,00%', () => {
    expect(formatPercent(15)).toBe('15,00%')
  })
})

describe('calculateWithTVA', () => {
  it('calculates 21% TVA on 100', () => {
    const r = calculateWithTVA(100)
    expect(r.net).toBe(100)
    expect(r.tva).toBe(21)
    expect(r.total).toBe(121)
  })
})

describe('formatDate', () => {
  it('formats date with year visible', () => {
    const result = formatDate(new Date('2026-02-18'))
    expect(result).toMatch(/2026/)
  })
})
