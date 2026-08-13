import Link from "next/link";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { listTransactions } from "@/lib/transactions";
import { aggregateRevenueByDay } from "@/lib/revenue-report";
import { RevenueChart } from "./revenue-chart";

export default async function StatsPage() {
  const { supabase, user } = await getVendorSession();

  const config = await getVendorPlan(supabase, user.id);

  if (config?.plan !== "pro") {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revenue stats are a Pro feature —{" "}
          <Link href="/dashboard/plan" className="underline underline-offset-4">
            upgrade
          </Link>{" "}
          to see aggregated revenue across every kit that uses paykit for you.
        </p>
      </div>
    );
  }

  const transactions = await listTransactions(user.id);
  const data = aggregateRevenueByDay(transactions);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirmed revenue by day, aggregated across every kit.
      </p>
      <div className="mt-6">
        <RevenueChart data={data} />
      </div>
    </div>
  );
}
