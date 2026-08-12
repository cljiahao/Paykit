// @vitest-environment jsdom
//
// ResponsiveContainer needs real layout to size itself, which jsdom doesn't
// provide — recharts still renders without crashing on a zero-size container
// (same precedent as qkit's ServiceSpeedChart test), so this asserts on the
// accessible wrapper (role="img" + aria-label) and the sr-only data table
// rather than the SVG bars themselves.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevenueChart } from "./revenue-chart";
import type { DailyRevenue } from "@/lib/revenue-report";

describe("RevenueChart", () => {
  it("summarizes zero days as no confirmed revenue yet", () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Revenue chart: no confirmed revenue yet.",
    );
  });

  it("summarizes a single day without a range", () => {
    const data: DailyRevenue[] = [{ date: "2026-07-15", cents: 500, count: 1 }];
    render(<RevenueChart data={data} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Revenue chart: $5.00 total across 1 day, 2026-07-15.",
    );
  });

  it("summarizes multiple days as a date range with a total", () => {
    const data: DailyRevenue[] = [
      { date: "2026-07-15", cents: 500, count: 1 },
      { date: "2026-07-16", cents: 300, count: 2 },
    ];
    render(<RevenueChart data={data} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Revenue chart: $8.00 total across 2 days, 2026-07-15 to 2026-07-16.",
    );
  });

  it("renders an sr-only table of the underlying per-day data", () => {
    const data: DailyRevenue[] = [
      { date: "2026-07-15", cents: 500, count: 1 },
      { date: "2026-07-16", cents: 300, count: 2 },
    ];
    render(<RevenueChart data={data} />);

    expect(
      screen.getByRole("columnheader", { name: "Date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Revenue" }),
    ).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    // header row + one row per day
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("2026-07-15");
    expect(rows[1]).toHaveTextContent("$5.00");
    expect(rows[2]).toHaveTextContent("2026-07-16");
    expect(rows[2]).toHaveTextContent("$3.00");
  });

  it("renders total revenue, transaction count, and average/day stat tiles", () => {
    const data: DailyRevenue[] = [
      { date: "2026-07-15", cents: 500, count: 1 },
      { date: "2026-07-16", cents: 300, count: 2 },
    ];
    render(<RevenueChart data={data} />);

    expect(screen.getByText("Total revenue")).toBeInTheDocument();
    expect(screen.getByText("$8.00")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Avg / day")).toBeInTheDocument();
    expect(screen.getByText("$4.00")).toBeInTheDocument();
  });

  it("shows zero-value stat tiles with no confirmed revenue yet", () => {
    render(<RevenueChart data={[]} />);

    expect(screen.getByText("Total revenue")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00")).toHaveLength(2);
  });
});
