import { Skeleton } from "@/components/Skeleton";

export default function GroupDetailLoading() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto w-full">
      <Skeleton className="h-4 w-32 mb-8" />

      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <div className="flex items-center gap-3 mt-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-5 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
