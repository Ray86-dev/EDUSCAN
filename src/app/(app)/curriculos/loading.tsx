import { Skeleton } from "@/components/Skeleton";

export default function CurriculosLoading() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      <Skeleton className="h-14 w-full rounded-xl mb-8" />

      <div className="space-y-3">
        <Skeleton className="h-6 w-48 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-surface-container-high"
          >
            <Skeleton className="h-5 w-48 mb-2" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
