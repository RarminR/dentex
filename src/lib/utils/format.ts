export function formatCurrency(amount: number | string): string {
  const num = Number(amount)
  return new Intl.NumberFormat('ro-RO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' RON'
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatPercent(value: number | string): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value)) + '%'
}

export function calculateWithTVA(amount: number | string): { net: number; tva: number; total: number } {
  const net = Number(amount)
  const tva = Math.round(net * 0.19 * 100) / 100
  const total = Math.round((net + tva) * 100) / 100
  return { net, tva, total }
}

export function formatTVADisplay(amount: number | string): string {
  const { net, tva, total } = calculateWithTVA(amount)
  return `${formatCurrency(net)} + TVA 19%: ${formatCurrency(tva)} = ${formatCurrency(total)}`
}
