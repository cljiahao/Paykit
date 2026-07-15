import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { usagePercent } from "@/lib/usage";

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

      {plan === "free" && (
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">
            {count} / 100 transactions this month
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${usagePercent(count)}%` }}
            />
          </div>
        </div>
      )}

      <nav className="flex gap-4 text-sm font-medium">
        <Link href="/dashboard/config" className="underline underline-offset-4">
          PayNow setup
        </Link>
        <Link
          href="/dashboard/transactions"
          className="underline underline-offset-4"
        >
          Transactions
        </Link>
        <Link
          href="/dashboard/reports"
          className="underline underline-offset-4"
        >
          Reports
        </Link>
      </nav>
    </main>
  );
}
