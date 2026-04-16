'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'

interface OfferItemRowProps {
  name: string
  category: string | null
  quantity: number
  effectivePrice: string
  role: 'anchor' | 'upsell'
  isEditing: boolean
  onQuantityChange?: (qty: number) => void
  onRoleChange?: (role: 'anchor' | 'upsell') => void
}

export function OfferItemRow({
  name,
  category,
  quantity,
  effectivePrice,
  role,
  isEditing,
  onQuantityChange,
  onRoleChange,
}: OfferItemRowProps) {
  const price = Number(effectivePrice)
  const rowTotal = price * quantity

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">{name}</span>
          <span className="text-xs text-muted-foreground">{category}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        {isEditing ? (
          <button
            type="button"
            onClick={() => onRoleChange?.(role === 'anchor' ? 'upsell' : 'anchor')}
            title="Click pentru a schimba tipul"
          >
            <Badge
              variant="outline"
              className={`cursor-pointer transition-colors ${
                role === 'anchor'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900'
                  : 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900'
              }`}
            >
              {role === 'anchor' ? 'Ancor\u0103' : 'Upsell'} {'\u21C5'}
            </Badge>
          </button>
        ) : (
          <Badge
            variant="outline"
            className={
              role === 'anchor'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300'
            }
          >
            {role === 'anchor' ? 'Ancor\u0103' : 'Upsell'}
          </Badge>
        )}
      </td>
      <td className="py-3 pr-4 text-center">
        {isEditing ? (
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => onQuantityChange?.(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center h-8"
          />
        ) : (
          <span className="tabular-nums">{quantity}</span>
        )}
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-sm">
        {formatCurrency(effectivePrice)}
      </td>
      <td className="py-3 text-right tabular-nums font-medium text-sm">
        {formatCurrency(rowTotal)}
      </td>
    </tr>
  )
}
