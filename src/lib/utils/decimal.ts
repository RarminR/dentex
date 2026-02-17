import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calculates profit margin percentage.
 * Formula: ((unitPrice - costPrice) / unitPrice) × 100
 */
export function calculateMargin(unitPrice: Decimal, costPrice: Decimal): Decimal {
  return unitPrice.minus(costPrice).dividedBy(unitPrice).times(100)
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
