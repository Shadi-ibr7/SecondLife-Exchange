import { Skeleton } from '@/components/ui/skeleton';

export default function UnsplashSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl bg-muted/30 shadow-md"
        >
          <Skeleton className="h-64 w-full" />
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2">
            <Skeleton className="mb-1 h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
