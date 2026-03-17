import { Skeleton } from "@/components/Skeleton";

export default function SessionLoading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full">
      <Skeleton className="h-4 w-32 mb-6" />

      <div className="mb-8">
        <Skeleton className="h-10 w-56 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
