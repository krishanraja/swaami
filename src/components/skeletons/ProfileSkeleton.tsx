export function ProfileSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header skeleton */}
      <div className="p-4 space-y-4 border-b">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
            <div className="h-4 bg-muted rounded animate-pulse w-48" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="p-4 grid grid-cols-3 gap-4 border-b">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-5 bg-muted rounded animate-pulse w-24" />
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
