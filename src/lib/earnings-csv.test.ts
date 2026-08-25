import { describe, it, expect } from "vitest";
import { earningsReportToCsv } from "./earnings-csv";
import type { EarningsReport } from "./earnings-report";

function report(overrides: Partial<EarningsReport> = {}): EarningsReport {
  return {
    year: 2026,
    months: [],
    lines: [
      {
        key: "booking:b1",
        label: "Jane Tan",
        event_date: "2026-12-25",
        revenue_cents: 100000,
      },
    ],
    total_revenue_cents: 100000,
    ...overrides,
  };
}

describe("earningsReportToCsv", () => {
  it("renders a header, one row per line, and a total row", () => {
    const csv = earningsReportToCsv(report());
    const rows = csv.split("\n");
    expect(rows[0]).toBe("Date,Customer,Revenue (SGD)");
    expect(rows[1]).toBe("2026-12-25,Jane Tan,1000.00");
    expect(rows[2]).toBe(",Total,1000.00");
  });

  it("neutralizes a customer name that starts with a formula-triggering character", () => {
    const csv = earningsReportToCsv(
      report({
        lines: [
          {
            key: "booking:b2",
            label: "=1+1",
            event_date: "2026-12-25",
            revenue_cents: 5000,
          },
        ],
      }),
    );
    expect(csv).not.toContain(",=1+1,");
    expect(csv).toContain("'=1+1");
  });

  it("neutralizes +, -, and @ prefixes too", () => {
    for (const dangerous of ["+cmd", "-2+3", "@SUM(A1)"]) {
      const csv = earningsReportToCsv(
        report({
          lines: [
            {
              key: "booking:b3",
              label: dangerous,
              event_date: "2026-12-25",
              revenue_cents: 5000,
            },
          ],
        }),
      );
      expect(csv).toContain(`'${dangerous}`);
    }
  });

  it("quotes a customer name containing a comma", () => {
    const csv = earningsReportToCsv(
      report({
        lines: [
          {
            key: "booking:b4",
            label: "Tan, Jane",
            event_date: "2026-12-25",
            revenue_cents: 5000,
          },
        ],
      }),
    );
    expect(csv).toContain('"Tan, Jane"');
  });

  it("leaves an ordinary customer name untouched", () => {
    const csv = earningsReportToCsv(report());
    expect(csv).toContain("Jane Tan");
  });
});
