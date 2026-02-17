import { Skeleton } from '@/components/ui/skeleton'

export default function OfferLoading() {
  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
        <Skeleton className="h-6 w-48" />
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-6 space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Se genereaz{'\u0103'} oferta...
          </p>
        </div>
      </main>
    </>
  )
}
