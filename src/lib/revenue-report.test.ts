import { describe, it, expect } from "vitest";
import { aggregateRevenueByDay } from "./revenue-report";
import type { Transaction } from "@/lib/types";

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "tx",
    vendor_id: "v1",
    kit_slug: "qkit",
    order_ref: "A",
    amount_cents: 100,
    status: "confirmed",
    qr_payload: "x",
    claimed_at: null,
    confirmed_at: null,
    created_at: "2026-07-15T00:00:00Z",
    ...overrides,
  };
}

describe("aggregateRevenueByDay", () => {
  it("sums same-day confirmed transactions and counts them", () => {
    const result = aggregateRevenueByDay([
      tx({ amount_cents: 100, created_at: "2026-07-15T01:00:00Z" }),
      tx({ amount_cents: 200, created_at: "2026-07-15T23:00:00Z" }),
    ]);
    expect(result).toEqual([{ date: "2026-07-15", cents: 300, count: 2 }]);
  });

  it("counts a single confirmed transaction as 1", () => {
    const result = aggregateRevenueByDay([
      tx({ amount_cents: 100, created_at: "2026-07-15T01:00:00Z" }),
    ]);
    expect(result).toEqual([{ date: "2026-07-15", cents: 100, count: 1 }]);
  });

  it("excludes non-confirmed transactions", () => {
    const result = aggregateRevenueByDay([
      tx({ status: "pending", amount_cents: 500 }),
      tx({ status: "claimed", amount_cents: 500 }),
    ]);
    expect(result).toEqual([]);
  });

  it("sorts ascending by date", () => {
    const result = aggregateRevenueByDay([
      tx({ created_at: "2026-07-16T00:00:00Z", amount_cents: 100 }),
      tx({ created_at: "2026-07-14T00:00:00Z", amount_cents: 100 }),
    ]);
    expect(result.map((r) => r.date)).toEqual(["2026-07-14", "2026-07-16"]);
  });
});
