import { Skeleton } from "@/components/Skeleton";

export default function ActividadesLoading() {
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g}>
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl"
                >
                  <div className="flex-1">
                    <Skeleton className="h-4 w-44 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
