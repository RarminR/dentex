interface EmptyStateProps {
  message?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ message = 'Nu există date', description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 font-medium">{message}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
