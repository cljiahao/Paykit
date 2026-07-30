import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { shouldNudgePro } from "@/lib/usage";
import { BackButton } from "@/components/back-button";
import { UpgradeCta } from "./upgrade-cta";

export const revalidate = 0;

const PRO_PRICE = "$12/mo";

export default async function PlanPage() {
  const { supabase, user } = await getVendorSession();
  const config = await getVendorPlan(supabase, user.id);
  const plan = config?.plan ?? "free";
  const count = await txCountThisMonth(user.id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <BackButton href="/dashboard" label="Dashboard" />
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
            You&apos;re doing real volume — Pro adds stats and refund tracking,{" "}
            {PRO_PRICE}.
          </p>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">{plan === "pro" ? "Pro" : "Free"}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Unlimited transactions</li>
          {plan === "pro" && (
            <>
              <li>Stats</li>
              <li>Refunds</li>
            </>
          )}
        </ul>
        {plan === "free" && (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              Ask us to upgrade your account to Pro for stats and refunds,{" "}
              {PRO_PRICE}.
            </p>
            <UpgradeCta />
          </div>
        )}
      </div>
    </main>
  );
}
