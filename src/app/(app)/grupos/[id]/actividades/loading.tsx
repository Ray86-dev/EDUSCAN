import { Skeleton } from "@/components/Skeleton";

export default function GroupActivitiesLoading() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      <Skeleton className="h-4 w-32 mb-8" />

      <div className="mb-8">
        <Skeleton className="h-10 w-44 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
