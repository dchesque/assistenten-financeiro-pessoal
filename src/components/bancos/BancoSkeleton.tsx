import { Skeleton } from '../ui/skeleton';

export function BancoCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function BancoSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <BancoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EstatisticasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}