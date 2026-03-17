import { Skeleton } from "@/components/Skeleton";

export default function PerfilLoading() {
  return (
    <div className="max-w-lg mx-auto px-6 py-6 md:py-10 space-y-8">
      <div>
        <Skeleton className="h-9 w-24 mb-2" />
        <Skeleton className="h-5 w-44" />
      </div>

      <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div>
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
