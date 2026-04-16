import { Decimal } from 'decimal.js'

/**
 * Calculates profit margin percentage.
 * Formula: ((unitPrice - acquisitionPrice) / unitPrice) × 100
 */
export function calculateMargin(unitPrice: Decimal, acquisitionPrice: Decimal): Decimal {
  return unitPrice.minus(acquisitionPrice).dividedBy(unitPrice).times(100)
}

/**
 * Applies a discount percentage to a price.
 * Formula: price × (1 - discountPercent / 100)
 */
export function applyDiscount(price: Decimal, discountPercent: Decimal): Decimal {
  const factor = new Decimal(1).minus(discountPercent.dividedBy(100))
  return price.times(factor)
}

/**
 * Sums an array of Decimal values with exact precision.
 * Returns Decimal(0) for empty arrays.
 */
export function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((acc, val) => acc.plus(val), new Decimal(0))
}

// Recursively converts Prisma Decimal/Date to plain types for Server→Client serialization
export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Decimal) return obj.toString() as unknown as T
  if (obj instanceof Date) return obj.toISOString() as unknown as T
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serialize(value)
    }
    return result as T
  }
  return obj
}

// --- String-based helpers for use in non-server modules (avoid direct Prisma import) ---

/**
 * Multiplies a decimal string by an integer quantity. Returns string with 2 decimal places.
 */
export function multiplyDecimalStr(price: string, quantity: number): string {
  return new Decimal(price).times(quantity).toFixed(2)
}

/**
 * Adds two decimal strings. Returns string with 2 decimal places.
 */
export function addDecimalStrs(a: string, b: string): string {
  return new Decimal(a).plus(new Decimal(b)).toFixed(2)
}

/**
 * Sums an array of decimal strings. Returns string with 2 decimal places.
 */
export function sumDecimalStrs(values: string[]): string {
  return values
    .reduce((acc, val) => acc.plus(new Decimal(val)), new Decimal(0))
    .toFixed(2)
}

/**
 * Returns true if a >= b (both decimal strings).
 */
export function decimalStrGte(a: string, b: string): boolean {
  return new Decimal(a).greaterThanOrEqualTo(new Decimal(b))
}

/**
 * Compares two decimal strings for sorting. Returns negative if a < b, positive if a > b.
 */
export function compareDecimalStrs(a: string, b: string): number {
  return new Decimal(a).minus(new Decimal(b)).toNumber()
}
