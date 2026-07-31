import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { txCountThisMonth } from "@/lib/transactions";
import { resolvePlanView, PRO_PRICE } from "@/lib/plan-view";
import { BackButton } from "@/components/back-button";
import { UpgradeCta } from "./upgrade-cta";

export const revalidate = 0;

export default async function PlanPage() {
  const { supabase, user } = await getVendorSession();
  const config = await getVendorPlan(supabase, user.id);
  const plan = config?.plan ?? "free";
  const count = await txCountThisMonth(user.id);
  const view = resolvePlanView(plan, count);

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
          Current plan: <span className="capitalize">{view.plan}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{view.countLabel}</p>
        {view.showNudge && (
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re doing real volume — Pro adds stats and refund tracking,{" "}
            {PRO_PRICE}.
          </p>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm font-medium">{view.planLabel}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {view.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        {view.showUpgrade && (
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
