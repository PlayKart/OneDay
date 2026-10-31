// src/components/SkeletonLoaders.tsx
import { Skeleton } from "./ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-28 rounded-2xl w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl w-full" />
    </div>
  );
}

export function HabitListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl w-full" />
      ))}
    </div>
  );
}

export function CoachSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 rounded-2xl w-3/4" />
      <Skeleton className="h-16 rounded-2xl w-1/2 ml-auto" />
      <Skeleton className="h-20 rounded-2xl w-2/3" />
    </div>
  );
}
