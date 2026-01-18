import { Skeleton } from "@/components/ui/skeleton"

interface ListSkeletonProps {
  items?: number
  showAvatar?: boolean
  showDescription?: boolean
}

export function ListSkeleton({ 
  items = 5, 
  showAvatar = false,
  showDescription = true 
}: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`item-${index}`} className="flex items-start gap-3">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            {showDescription && (
              <Skeleton className="h-4 w-1/2" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

