import { describe, it, expect } from "vitest";
import { computePaykitMetrics } from "@/lib/metrics";

describe("computePaykitMetrics", () => {
  const now = Date.UTC(2026, 6, 7);
  const iso = (daysAgo: number) =>
    new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  it("counts revenue from confirmed transactions only, within the 30d window", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [{ vendor_id: "v1", plan: "free", created_at: iso(1) }],
      transactions: [
        {
          vendor_id: "v1",
          amount_cents: 1000,
          status: "confirmed",
          created_at: iso(1),
        },
        {
          vendor_id: "v1",
          amount_cents: 500,
          status: "pending",
          created_at: iso(1),
        },
        {
          vendor_id: "v1",
          amount_cents: 2000,
          status: "confirmed",
          created_at: iso(40),
        },
      ],
    });

    expect(m.revenue_cents_30d).toBe(1000);
    expect(m.revenue_cents_all).toBe(3000);
  });

  it("counts gmv from every transaction regardless of status, within the 30d window", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [{ vendor_id: "v1", plan: "free", created_at: iso(1) }],
      transactions: [
        {
          vendor_id: "v1",
          amount_cents: 1000,
          status: "confirmed",
          created_at: iso(1),
        },
        {
          vendor_id: "v1",
          amount_cents: 500,
          status: "pending",
          created_at: iso(2),
        },
        {
          vendor_id: "v1",
          amount_cents: 2000,
          status: "claimed",
          created_at: iso(40),
        },
      ],
    });

    expect(m.gmv_cents_30d).toBe(1500);
  });

  it("counts orders_7d/prev_7d as raw transaction counts in each window", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [{ vendor_id: "v1", plan: "free", created_at: iso(1) }],
      transactions: [
        {
          vendor_id: "v1",
          amount_cents: 100,
          status: "confirmed",
          created_at: iso(1),
        },
        {
          vendor_id: "v1",
          amount_cents: 100,
          status: "confirmed",
          created_at: iso(6),
        },
        {
          vendor_id: "v1",
          amount_cents: 100,
          status: "confirmed",
          created_at: iso(10),
        },
        {
          vendor_id: "v1",
          amount_cents: 100,
          status: "confirmed",
          created_at: iso(20),
        },
      ],
    });

    expect(m.orders_7d).toBe(2);
    expect(m.orders_prev_7d).toBe(1);
  });

  it("counts signups_7d from vendor created_at", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [
        { vendor_id: "v1", plan: "free", created_at: iso(1) },
        { vendor_id: "v2", plan: "free", created_at: iso(40) },
      ],
      transactions: [],
    });

    expect(m.signups_7d).toBe(1);
  });

  it("counts total/pro vendors from plan", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [
        { vendor_id: "v1", plan: "pro", created_at: iso(1) },
        { vendor_id: "v2", plan: "free", created_at: iso(1) },
        { vendor_id: "v3", plan: "pro", created_at: iso(1) },
      ],
      transactions: [],
    });

    expect(m.total_vendors).toBe(3);
    expect(m.pro_vendors).toBe(2);
    expect(m.funnel.pro).toBe(2);
  });

  it("counts with_order as vendors that have at least one transaction, any status", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [
        { vendor_id: "v1", plan: "free", created_at: iso(1) },
        { vendor_id: "v2", plan: "free", created_at: iso(1) },
      ],
      transactions: [
        {
          vendor_id: "v1",
          amount_cents: 100,
          status: "pending",
          created_at: iso(1),
        },
      ],
    });

    expect(m.active_vendors).toBe(1);
    expect(m.funnel.with_order).toBe(1);
  });

  it("sets signed_up and with_booth equal to total_vendors — no separate unconfigured state exists", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [
        { vendor_id: "v1", plan: "free", created_at: iso(1) },
        { vendor_id: "v2", plan: "free", created_at: iso(1) },
      ],
      transactions: [],
    });

    expect(m.funnel.signed_up).toBe(2);
    expect(m.funnel.with_booth).toBe(2);
  });

  it("always reports pending_upgrade_requests as 0 — no local table to query", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [],
      transactions: [],
    });
    expect(m.pending_upgrade_requests).toBe(0);
  });

  it("returns all zeros for an empty dataset", () => {
    const m = computePaykitMetrics({
      nowMs: now,
      vendors: [],
      transactions: [],
    });
    expect(m.revenue_cents_30d).toBe(0);
    expect(m.revenue_cents_all).toBe(0);
    expect(m.gmv_cents_30d).toBe(0);
    expect(m.active_vendors).toBe(0);
    expect(m.total_vendors).toBe(0);
  });
});
