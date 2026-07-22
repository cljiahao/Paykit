import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { shouldNudgePro } from "@/lib/usage";

export default async function DashboardPage() {
  const { supabase, user } = await getVendorSession();

  const config = await getVendorPlan(supabase, user.id);
  const count = await txCountThisMonth(user.id);
  const plan = config?.plan ?? "free";

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {!config && (
        <p className="rounded-xl border bg-secondary/50 p-4 text-sm">
          You haven&apos;t set up PayNow yet.{" "}
          <Link
            href="/dashboard/config"
            className="underline underline-offset-4"
          >
            Set it up
          </Link>
          .
        </p>
      )}

      <div className="rounded-xl border p-4">
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
            adds reports and refund tracking, $12/mo.
          </p>
        )}
      </div>
    </main>
  );
}
