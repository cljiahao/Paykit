import { DataTable, type DataTableColumn } from "@merqo/ui";
import { requireAdmin } from "@/lib/admin";
import { listVendors, type VendorRow } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import { ElevatedCard } from "@/components/elevated-card";
import { VendorPlanToggle } from "@/app/admin/vendors/vendor-plan-toggle";

export const revalidate = 0;

const columns: DataTableColumn<VendorRow>[] = [
  {
    header: "Vendor",
    cell: (v) => (
      <>
        <p className="font-medium">{v.email ?? "—"}</p>
        {(v.payee_name || v.label) && (
          <p className="text-xs text-muted-foreground">
            {v.payee_name ?? v.label}
          </p>
        )}
      </>
    ),
  },
  {
    header: "Plan",
    cell: (v) =>
      v.plan === "pro" ? (
        <Badge variant="default">Pro</Badge>
      ) : (
        <Badge variant="outline">Free</Badge>
      ),
  },
  {
    header: "Transactions",
    cell: (v) => v.transaction_count,
    className: "text-right tabular-nums",
  },
  {
    header: "Joined",
    cell: (v) => new Date(v.created_at).toLocaleDateString("en-SG"),
  },
  {
    header: "Action",
    cell: (v) => (
      <VendorPlanToggle vendorId={v.vendor_id} email={v.email} plan={v.plan} />
    ),
    className: "text-right",
  },
];

export default async function AdminVendorsPage() {
  await requireAdmin();

  const vendors = await listVendors();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Internal
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every vendor with a payment config, across every kit.
        </p>
      </div>

      {vendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No vendors yet.
        </p>
      ) : (
        <ElevatedCard className="overflow-x-auto">
          <DataTable
            rows={vendors}
            columns={columns}
            getRowKey={(v) => v.vendor_id}
          />
        </ElevatedCard>
      )}
    </main>
  );
}
