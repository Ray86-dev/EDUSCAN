import { Skeleton } from "@/components/Skeleton";

export default function ResultadosLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-12">
      <section className="mb-16">
        <Skeleton className="h-14 w-56 mb-2" />
        <Skeleton className="h-5 w-48" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 grid grid-cols-1 gap-6">
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-surface-container-high">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-12 w-20" />
          </div>
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-surface-container-high">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-1 w-full mt-6 rounded-full" />
          </div>
        </div>

        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20">
          <Skeleton className="h-6 w-44 mb-12" />
          <div className="flex items-end justify-between h-48 gap-4 px-4">
            {[20, 35, 50, 65, 80].map((h, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-4">
                <div className={`w-full bg-surface-container-high rounded-t-lg animate-shimmer`} style={{ height: `${h}%` }} />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-12 space-y-3">
          <Skeleton className="h-6 w-24 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl"
            >
              <div className="flex items-center gap-4 pl-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
