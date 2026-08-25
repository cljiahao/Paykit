import { describe, it, expect, beforeEach, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(async () => ({ from: fromMock })),
}));

import { GET } from "@/app/api/merqo/metrics/route";

function req(auth?: string) {
  return new Request("http://localhost/api/merqo/metrics", {
    headers: auth ? { Authorization: auth } : {},
  });
}

function mockTables(
  overrides: Record<string, { data: unknown; error: unknown }>,
) {
  fromMock.mockImplementation((table: string) => ({
    select: () =>
      Promise.resolve(overrides[table] ?? { data: [], error: null }),
  }));
}

describe("GET /api/merqo/metrics (paykit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MERQO_METRICS_SECRET = "test-secret";
    mockTables({});
  });

  it("401 when the bearer is missing", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("401 when the bearer is wrong", async () => {
    const res = await GET(req("Bearer nope"));
    expect(res.status).toBe(401);
  });

  it("returns a payload shaped for merqo's contract on success", async () => {
    mockTables({
      vendor_payment_config: {
        data: [
          {
            vendor_id: "v1",
            plan: "pro",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      },
      transactions: {
        data: [
          {
            vendor_id: "v1",
            amount_cents: 500,
            status: "confirmed",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      },
    });

    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product).toBe("paykit");
    expect(typeof body.generated_at).toBe("string");
    expect(body.total_vendors).toBe(1);
    expect(body.pro_vendors).toBe(1);
    expect(body.revenue_cents_all).toBe(500);
    expect(body.funnel).toEqual({
      signed_up: 1,
      with_booth: 1,
      with_order: 1,
      pro: 1,
    });
  });

  it("503 when the vendor-config read fails", async () => {
    mockTables({
      vendor_payment_config: { data: null, error: { message: "boom" } },
    });
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(503);
  });

  it("503 when the transactions read fails", async () => {
    mockTables({
      transactions: { data: null, error: { message: "boom" } },
    });
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(503);
  });
});
