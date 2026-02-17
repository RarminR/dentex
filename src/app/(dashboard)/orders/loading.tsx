import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <Skeleton className="h-6 w-24" />
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="rounded-lg border">
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
