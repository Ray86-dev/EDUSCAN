import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-6 md:py-10">
      <section className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </section>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl"
            >
              <div className="flex items-center gap-4 pl-3">
                <Skeleton className="w-11 h-11 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
