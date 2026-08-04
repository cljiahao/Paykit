import { requireAdmin } from "@/lib/admin";
import { platformTotals, recentActivity } from "@/lib/admin-data";
import { Stat } from "@/app/admin/stat";
import { Badge } from "@/components/ui/badge";
import { ElevatedCard } from "@/components/elevated-card";

export const revalidate = 0;

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [totals, activity] = await Promise.all([
    platformTotals(),
    recentActivity(15),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Internal
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Vendors" value={totals.vendors} />
        <Stat label="Free plan" value={totals.free_vendors} />
        <Stat label="Pro plan" value={totals.pro_vendors} />
        <Stat label="Transactions" value={totals.transactions} />
        <Stat label="Confirmed" value={totals.confirmed_transactions} />
        <Stat
          label="Confirmed volume"
          value={formatCents(totals.confirmed_volume_cents)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent activity across all vendors
        </h2>
        <ElevatedCard className="p-6">
          <ul className="space-y-2.5">
            {activity.length > 0 ? (
              activity.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="min-w-0 truncate font-medium">
                      {tx.email ?? "—"}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {tx.kit_slug}
                    </span>
                    <Badge
                      variant={
                        tx.status === "confirmed" ? "default" : "secondary"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">
                      {formatCents(tx.amount_cents)}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("en-SG")}
                    </span>
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                No activity yet.
              </li>
            )}
          </ul>
        </ElevatedCard>
      </section>
    </main>
  );
}
