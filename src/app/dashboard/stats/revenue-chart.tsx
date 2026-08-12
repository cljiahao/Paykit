"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRevenue } from "@/lib/revenue-report";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

/** Screen-reader summary for the chart container — recharts renders to an
 * inline SVG with no text alternative of its own. */
function summarize(data: DailyRevenue[]): string {
  if (data.length === 0) return "Revenue chart: no confirmed revenue yet.";
  const total = formatCents(data.reduce((sum, d) => sum + d.cents, 0));
  const range =
    data.length === 1
      ? data[0].date
      : `${data[0].date} to ${data[data.length - 1].date}`;
  return `Revenue chart: ${total} total across ${data.length} day${data.length === 1 ? "" : "s"}, ${range}.`;
}

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  return (
    <div role="img" aria-label={summarize(data)}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.map((d) => ({ ...d, dollars: d.cents / 100 }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Bar dataKey="dollars" fill="var(--color-primary)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
      {/* Text alternative for screen readers, since the aria-label above is
          only a summary, not the underlying data. */}
      <table className="sr-only">
        <caption>Confirmed revenue by day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{formatCents(d.cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
