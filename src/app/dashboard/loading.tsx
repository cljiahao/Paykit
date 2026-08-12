import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-segment loading fallback for every /dashboard/* page. `layout.tsx`
 * itself (the header/nav) resolves outside this Suspense boundary, so this
 * only needs to stand in for the page content inside `<main>` — shaped
 * after the title + card-block pattern every dashboard page (page.tsx,
 * transactions/page.tsx, stats/page.tsx) shares, not a generic spinner.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
