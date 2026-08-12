import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { shouldNudgePro } from "@/lib/usage";
import { stampTourSeen } from "@/lib/tour-prefs";

export default async function DashboardPage() {
  const { supabase, user } = await getVendorSession();

  const [config, count, { data: prefs }] = await Promise.all([
    getVendorPlan(supabase, user.id),
    txCountThisMonth(user.id),
    supabase
      .from("vendor_prefs")
      .select("tour_seen_at")
      .eq("vendor_id", user.id)
      .maybeSingle(),
  ]);
  // Durable "start" stamp, in addition to dashboard-tour.tsx's client-fired
  // one: this route (not layout.tsx, which wraps every /dashboard/* page)
  // is specifically the tour's home route, so stamping here — synchronously,
  // as part of this request — lands before the response is even sent, no
  // matter what happens client-side afterwards. See tour-actions.ts's
  // stampTourSeen/markTourSeen comments for the hard-navigation race this
  // closes.
  if (!prefs?.tour_seen_at) {
    await stampTourSeen(supabase, user.id);
  }

  const plan = config?.plan ?? "free";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {!config && (
        <p className="rounded-xl border bg-secondary/50 p-4 text-sm">
          You haven&apos;t set up payments yet.{" "}
          <Link
            href="/dashboard/config"
            className="underline underline-offset-4"
          >
            Set it up
          </Link>
          .
        </p>
      )}

      <div className="rounded-xl border p-4" data-tour="tx-count">
        <p className="text-sm font-medium">
          {count} transaction{count === 1 ? "" : "s"} this month
        </p>
        {shouldNudgePro(plan, count) && (
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re doing real volume —{" "}
            <Link
              href="/dashboard/plan"
              className="underline underline-offset-4"
            >
              Pro
            </Link>{" "}
            adds stats and refund tracking, $12/mo.
          </p>
        )}
      </div>
    </div>
  );
}
