import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { usagePercent } from "@/lib/usage";

export const revalidate = 0;

export default async function PlanPage() {
  const { supabase, user } = await getVendorSession();
  const config = await getVendorPlan(supabase, user.id);
  const plan = config?.plan ?? "free";
  const count = await txCountThisMonth(user.id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Dashboard
        </Link>
      </div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
      </header>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">
          Current plan: <span className="capitalize">{plan}</span>
        </p>
        {plan === "free" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {count} / 100 transactions this month
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${usagePercent(count)}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">{plan === "pro" ? "Pro" : "Free"}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Up to 100 transactions/month</li>
          <li>PayNow QR checkout</li>
          {plan === "pro" && (
            <>
              <li>Unlimited transactions</li>
              <li>Reports</li>
              <li>Refunds</li>
            </>
          )}
        </ul>
        {plan === "free" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ask us to upgrade your account to Pro for unlimited transactions,
            reports, and refunds.
          </p>
        )}
      </div>
    </main>
  );
}
