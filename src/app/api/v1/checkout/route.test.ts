import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const {
  verifyKitAuthMock,
  configMaybeSingle,
  insertSingle,
  createServiceClientMock,
} = vi.hoisted(() => ({
  verifyKitAuthMock: vi.fn(),
  configMaybeSingle: vi.fn(),
  insertSingle: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/kit-auth", () => ({ verifyKitAuth: verifyKitAuthMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));

function fakeSupabase() {
  return {
    from: (table: string) => {
      if (table === "vendor_payment_config") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: configMaybeSingle }) }),
        };
      }
      if (table === "transactions") {
        return {
          insert: () => ({ select: () => ({ single: insertSingle }) }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

beforeEach(() => {
  verifyKitAuthMock.mockReset().mockResolvedValue({ kitSlug: "qkit" });
  createServiceClientMock.mockReset().mockResolvedValue(fakeSupabase());
  configMaybeSingle.mockReset().mockResolvedValue({
    data: {
      vendor_id: "11111111-1111-1111-1111-111111111111",
      uen: "53312345A",
      mobile: null,
      payee_name: "Kopitiam Cart",
      verification_method: "manual",
      plan: "free",
    },
    error: null,
  });
  insertSingle.mockReset().mockResolvedValue({
    data: { id: "tx1", qr_payload: "0002...6304ABCD" },
    error: null,
  });
});

function req(body: unknown, authorization = "Bearer qkit:secret") {
  return new Request("http://localhost/api/v1/checkout", {
    method: "POST",
    headers: { authorization },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/checkout", () => {
  it("creates a checkout and returns a QR payload", async () => {
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-001",
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      transaction_id: "tx1",
      qr_payload: "0002...6304ABCD",
    });
  });

  it("creates a checkout for a free-tier vendor well past the old 100/mo cap", async () => {
    configMaybeSingle.mockResolvedValue({
      data: {
        vendor_id: "11111111-1111-1111-1111-111111111111",
        uen: "53312345A",
        mobile: null,
        payee_name: "Kopitiam Cart",
        verification_method: "manual",
        plan: "free",
      },
      error: null,
    });
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-501",
      }),
    );
    expect(res.status).toBe(200);
  });

  it("401s when the bearer token is missing/invalid", async () => {
    verifyKitAuthMock.mockResolvedValue(null);
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-001",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("422s when the vendor has no PayNow config", async () => {
    configMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-001",
      }),
    );
    expect(res.status).toBe(422);
  });

  it("400s on an invalid request body", async () => {
    const res = await POST(
      req({ vendor_id: "not-a-uuid", amount_cents: -1, order_ref: "" }),
    );
    expect(res.status).toBe(400);
  });

  it("503s when the config read fails", async () => {
    configMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-001",
      }),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).not.toMatch(/connection reset/);
  });

  it("503s when the transaction insert fails", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const res = await POST(
      req({
        vendor_id: "11111111-1111-1111-1111-111111111111",
        amount_cents: 450,
        order_ref: "A-001",
      }),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).not.toMatch(/connection reset/);
  });
});
