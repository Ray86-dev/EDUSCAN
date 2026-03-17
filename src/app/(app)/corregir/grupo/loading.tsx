import { Skeleton } from "@/components/Skeleton";

export default function CorregirGrupoLoading() {
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl border-l-4 border-surface-container-high"
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
