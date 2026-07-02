interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ count = 4, height = 'h-24' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`shimmer border border-border/60 bg-elevated ${height}`} />
      ))}
    </div>
  );
}
