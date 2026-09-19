"use client";

import { DataTable, type DataTableColumn } from "@merqo/ui";
import { formatCents } from "@/lib/utils";
import type { EarningsMonth, EarningsLine } from "@/lib/earnings-report";

// `columns` holds `cell` render callbacks and `getRowKey` is a function, so
// `DataTable` (a `@merqo/ui` Client Component) can only be rendered from
// another Client Component — a function prop can't cross the Server → Client
// boundary directly from `page.tsx`. Same pattern as
// `src/app/admin/vendors/vendors-table.tsx`.
const monthColumns: DataTableColumn<EarningsMonth>[] = [
  { header: "Month", cell: (m) => m.month },
  {
    header: "Revenue",
    cell: (m) => formatCents(m.revenue_cents),
    className: "text-right",
  },
];

export function EarningsMonthsTable({ months }: { months: EarningsMonth[] }) {
  return (
    <DataTable rows={months} columns={monthColumns} getRowKey={(m) => m.month} />
  );
}

const lineColumns: DataTableColumn<EarningsLine>[] = [
  { header: "Date", cell: (line) => line.event_date },
  { header: "Customer", cell: (line) => line.label },
  {
    header: "Revenue",
    cell: (line) => formatCents(line.revenue_cents),
    className: "text-right",
  },
];

export function EarningsLinesTable({ lines }: { lines: EarningsLine[] }) {
  return (
    <DataTable rows={lines} columns={lineColumns} getRowKey={(line) => line.key} />
  );
}
