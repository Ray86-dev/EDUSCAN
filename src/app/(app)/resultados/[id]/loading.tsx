import { Skeleton } from "@/components/Skeleton";

export default function CorrectionDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <Skeleton className="h-4 w-36" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-64 w-full rounded-xl" />

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest p-5 rounded-xl space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
