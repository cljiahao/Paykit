import type { EarningsReport } from "@/lib/earnings-report";

const FORMULA_PREFIXES = new Set(["=", "+", "-", "@"]);

// Neutralizes CSV formula injection — a cell like `=1+1` or `@SUM(...)`
// opening as a live formula in Excel/Sheets when the exported file is
// opened. `customer_name` is real vendor-entered text, not app-generated,
// so it's the one field here that needs this; the standard mitigation is
// prefixing a leading quote to keep the cell a plain string.
function csvField(value: string): string {
  const safe = FORMULA_PREFIXES.has(value[0]) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function earningsReportToCsv(report: EarningsReport): string {
  const rows = [
    "Date,Customer,Revenue (SGD)",
    ...report.lines.map(
      (line) =>
        `${csvField(line.event_date)},${csvField(line.label)},${formatDollars(line.revenue_cents)}`,
    ),
    `,Total,${formatDollars(report.total_revenue_cents)}`,
  ];
  return rows.join("\n");
}
