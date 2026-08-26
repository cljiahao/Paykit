import { requireAdmin } from "@/lib/admin";
import { listVendors } from "@/lib/admin-data";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ElevatedCard } from "@/components/elevated-card";
import { VendorPlanToggle } from "@/app/admin/vendors/vendor-plan-toggle";
import { VendorStatusBadge } from "@/app/admin/vendors/vendor-status";

export const revalidate = 0;

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
          Every vendor with a payment config, across every kit — most urgent
          first.
        </p>
      </div>

      {vendors.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No vendors yet.
        </p>
      ) : (
        <ElevatedCard className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.vendor_id}>
                  <TableCell>
                    <p className="font-medium">{v.email ?? "—"}</p>
                    {(v.payee_name || v.label) && (
                      <p className="text-xs text-muted-foreground">
                        {v.payee_name ?? v.label}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <VendorStatusBadge status={v.status} />
                  </TableCell>
                  <TableCell>
                    {v.plan === "pro" ? (
                      <Badge variant="default">Pro</Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.transaction_count}
                  </TableCell>
                  <TableCell>
                    {new Date(v.created_at).toLocaleDateString("en-SG")}
                  </TableCell>
                  <TableCell className="text-right">
                    <VendorPlanToggle
                      vendorId={v.vendor_id}
                      email={v.email}
                      plan={v.plan}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ElevatedCard>
      )}
    </main>
  );
}
