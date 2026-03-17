import { Skeleton } from "@/components/Skeleton";

export default function GruposLoading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto w-full">
      <section className="mb-12">
        <Skeleton className="h-10 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </section>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-5 rounded-xl border-l-4 border-surface-container-high flex items-center justify-between"
          >
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}
