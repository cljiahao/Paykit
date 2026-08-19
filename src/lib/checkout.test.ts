import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  configMaybeSingle,
  insertSingle,
  existingSingle,
  createServiceClientMock,
} = vi.hoisted(() => ({
  configMaybeSingle: vi.fn(),
  insertSingle: vi.fn(),
  existingSingle: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

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
          select: () => ({
            eq: () => ({ eq: () => ({ single: existingSingle }) }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

beforeEach(() => {
  createServiceClientMock.mockReset().mockResolvedValue(fakeSupabase());
  configMaybeSingle.mockReset().mockResolvedValue({
    data: {
      vendor_id: "11111111-1111-1111-1111-111111111111",
      kind: "paynow",
      uen: "53312345A",
      mobile: null,
      payee_name: "Kopitiam Cart",
      label: null,
      url: null,
      qr_image_url: null,
      verification_method: "manual",
      plan: "free",
    },
    error: null,
  });
  insertSingle.mockReset().mockResolvedValue({
    data: { id: "tx1", qr_payload: "0002...6304ABCD" },
    error: null,
  });
  existingSingle.mockReset().mockResolvedValue({ data: null, error: null });
});

describe("createCheckout", () => {
  it("creates a checkout and returns a QR payload", async () => {
    const { createCheckout } = await import("./checkout");
    const result = await createCheckout({
      vendorId: "11111111-1111-1111-1111-111111111111",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 450,
    });
    expect(result).toEqual({
      ok: true,
      type: "qr",
      transaction_id: "tx1",
      payload: "0002...6304ABCD",
    });
  });

  it("returns a 422 when the vendor has no config", async () => {
    configMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { createCheckout } = await import("./checkout");
    const result = await createCheckout({
      vendorId: "11111111-1111-1111-1111-111111111111",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 450,
    });
    expect(result).toEqual({
      ok: false,
      status: 422,
      error: "vendor has no PayNow config",
    });
  });

  it("returns a 503 when the config read fails", async () => {
    configMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { createCheckout } = await import("./checkout");
    const result = await createCheckout({
      vendorId: "11111111-1111-1111-1111-111111111111",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 450,
    });
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: "Upstream unavailable",
    });
  });

  it("re-reads and returns the existing transaction on a (kit_slug, order_ref) retry", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });
    existingSingle.mockResolvedValue({
      data: { id: "tx1", qr_payload: "0002...6304ABCD" },
      error: null,
    });
    const { createCheckout } = await import("./checkout");
    const result = await createCheckout({
      vendorId: "11111111-1111-1111-1111-111111111111",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 450,
    });
    expect(result).toEqual({
      ok: true,
      type: "qr",
      transaction_id: "tx1",
      payload: "0002...6304ABCD",
    });
  });

  it("returns a 503 when the insert fails for a reason other than a unique violation", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { createCheckout } = await import("./checkout");
    const result = await createCheckout({
      vendorId: "11111111-1111-1111-1111-111111111111",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 450,
    });
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: "Could not create checkout",
    });
  });
});
