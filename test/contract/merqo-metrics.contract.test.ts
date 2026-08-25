import { describe, it, expect } from "vitest";
import { z } from "zod";
import { computePaykitMetrics } from "@/lib/metrics";

// Copied verbatim from ../merqo/src/lib/metrics-schema.ts. Do NOT import
// across repos at runtime — keep this file's schema hand-synced with merqo's
// so a drift between the two shows up here as a failing test, not a broken
// /admin/products page in production.
const metricsPayloadSchema = z.object({
  product: z.string(),
  generated_at: z.string(),
  revenue_cents_30d: z.number(),
  revenue_cents_all: z.number(),
  gmv_cents_30d: z.number(),
  active_vendors: z.number(),
  orders_7d: z.number(),
  orders_prev_7d: z.number(),
  signups_7d: z.number(),
  pro_vendors: z.number(),
  total_vendors: z.number(),
  pending_upgrade_requests: z.number(),
  funnel: z.object({
    signed_up: z.number(),
    with_booth: z.number(),
    with_order: z.number(),
    pro: z.number(),
  }),
});

describe("paykit metrics payload satisfies merqo's contract", () => {
  it("passes metricsPayloadSchema.safeParse", () => {
    const now = Date.UTC(2026, 6, 7);
    const iso = (daysAgo: number) =>
      new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const sample = computePaykitMetrics({
      nowMs: now,
      vendors: [
        { vendor_id: "v1", plan: "pro", created_at: iso(1) },
        { vendor_id: "v2", plan: "free", created_at: iso(40) },
      ],
      transactions: [
        {
          vendor_id: "v1",
          amount_cents: 1000,
          status: "confirmed",
          created_at: iso(1),
        },
        {
          vendor_id: "v2",
          amount_cents: 500,
          status: "pending",
          created_at: iso(3),
        },
      ],
    });

    const payload = {
      product: "paykit",
      generated_at: new Date().toISOString(),
      ...sample,
    };

    const result = metricsPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
