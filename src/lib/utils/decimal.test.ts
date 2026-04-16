import { describe, it, expect } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'
import { calculateMargin, applyDiscount, sumDecimals } from './decimal'

describe('calculateMargin', () => {
  it('calculates 40% margin when unitPrice=150 and acquisitionPrice=90', () => {
    const result = calculateMargin(new Decimal(150), new Decimal(90))
    expect(result.equals(new Decimal(40))).toBe(true)
  })

  it('calculates 0% margin when unitPrice equals acquisitionPrice', () => {
    const result = calculateMargin(new Decimal(100), new Decimal(100))
    expect(result.equals(new Decimal(0))).toBe(true)
  })

  it('calculates 50% margin when acquisitionPrice is half of unitPrice', () => {
    const result = calculateMargin(new Decimal(200), new Decimal(100))
    expect(result.equals(new Decimal(50))).toBe(true)
  })
})

describe('applyDiscount', () => {
  it('applies 15% discount to 150 giving exactly 127.50', () => {
    const result = applyDiscount(new Decimal(150), new Decimal(15))
    expect(result.equals(new Decimal('127.50'))).toBe(true)
  })

  it('applies 0% discount leaving price unchanged', () => {
    const result = applyDiscount(new Decimal(100), new Decimal(0))
    expect(result.equals(new Decimal(100))).toBe(true)
  })

  it('applies 100% discount giving 0', () => {
    const result = applyDiscount(new Decimal(100), new Decimal(100))
    expect(result.equals(new Decimal(0))).toBe(true)
  })
})

describe('sumDecimals', () => {
  it('sums 0.1 + 0.2 to exactly 0.3 (not 0.30000000000000004)', () => {
    const result = sumDecimals([new Decimal('0.1'), new Decimal('0.2')])
    expect(result.equals(new Decimal('0.3'))).toBe(true)
  })

  it('returns 0 for empty array', () => {
    const result = sumDecimals([])
    expect(result.equals(new Decimal(0))).toBe(true)
  })

  it('sums multiple values correctly', () => {
    const result = sumDecimals([
      new Decimal('10.50'),
      new Decimal('20.25'),
      new Decimal('5.75'),
    ])
    expect(result.equals(new Decimal('36.50'))).toBe(true)
  })
})
