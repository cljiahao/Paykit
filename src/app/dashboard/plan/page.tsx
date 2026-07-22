import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { shouldNudgePro } from "@/lib/usage";

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
        <p className="mt-2 text-sm text-muted-foreground">
          {count} transaction{count === 1 ? "" : "s"} this month
        </p>
        {shouldNudgePro(plan, count) && (
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re doing real volume — Pro adds reports and refund
            tracking, $12/mo.
          </p>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">{plan === "pro" ? "Pro" : "Free"}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Unlimited PayNow transactions</li>
          {plan === "pro" && (
            <>
              <li>Reports</li>
              <li>Refunds</li>
            </>
          )}
        </ul>
        {plan === "free" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ask us to upgrade your account to Pro for reports and refunds.
          </p>
        )}
      </div>
    </main>
  );
}
