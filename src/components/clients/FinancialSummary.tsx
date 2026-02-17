import { StatCard } from '@/components/ui/StatCard'
import { RO } from '@/lib/constants/ro'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import type { ClientFinancials } from '@/lib/actions/clients'

interface FinancialSummaryProps {
  financials: ClientFinancials
}

export function FinancialSummary({ financials }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label={RO.clients.totalSpent}
        value={formatCurrency(financials.totalSpent.toString())}
        icon="💰"
      />
      <StatCard
        label={RO.clients.outstanding}
        value={formatCurrency(financials.outstandingBalance.toString())}
        icon="📋"
      />
      <StatCard
        label={RO.clients.avgOrder}
        value={formatCurrency(financials.avgOrderValue.toString())}
        icon="📊"
      />
      <StatCard
        label={RO.clients.totalOrders}
        value={String(financials.totalOrders)}
        icon="📦"
      />
      <StatCard
        label={RO.clients.profitMargin}
        value={formatPercent(financials.profitabilityMargin.toString())}
        icon="📈"
      />
      <StatCard
        label={RO.orders.paid}
        value={formatCurrency(financials.totalPaid.toString())}
        icon="✅"
      />
    </div>
  )
}
