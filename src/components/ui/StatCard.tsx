import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string
  trend?: { value: number; label?: string }
  icon?: string
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className={`text-sm mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label ?? 'față de luna trecută'}
              </p>
            )}
          </div>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
