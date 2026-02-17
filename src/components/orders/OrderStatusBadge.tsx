import { Badge } from '@/components/ui/badge'
import { RO } from '@/lib/constants/ro'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: RO.orders.pending,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  DELIVERED: {
    label: RO.orders.delivered,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  CANCELLED: {
    label: RO.orders.cancelled,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
