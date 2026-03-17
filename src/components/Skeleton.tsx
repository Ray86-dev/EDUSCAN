export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-container-high rounded-lg animate-shimmer ${className}`} />;
}
