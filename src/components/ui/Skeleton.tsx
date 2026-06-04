import { cn } from '../../lib/cn'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('animate-pulse bg-surface-container rounded-xl', className)} />
)

export const PatientDetailsSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex gap-3">
      <Skeleton className="w-16 h-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <Skeleton className="h-24 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="md:col-span-2 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  </div>
)
