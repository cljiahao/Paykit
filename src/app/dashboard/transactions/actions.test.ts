import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserMock, insertMock, createServerClientMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "v1" } } });
  insertMock.mockReset().mockResolvedValue({ error: null });
  createServerClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    from: () => ({ insert: insertMock }),
  });
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID_TX_ID = "11111111-1111-1111-1111-111111111111";

describe("issueRefundAction", () => {
  it("inserts a refund row for a valid amount", async () => {
    const { issueRefundAction } = await import("./actions");
    const result = await issueRefundAction(
      { status: "idle" },
      formData({
        transaction_id: VALID_TX_ID,
        refunded_amount_cents: "450",
        reason: "damaged",
      }),
    );
    expect(result.status).toBe("ok");
    expect(insertMock).toHaveBeenCalledWith({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: 450,
      reason: "damaged",
      created_by: "v1",
    });
  });

  it("rejects a non-positive amount without inserting", async () => {
    const { issueRefundAction } = await import("./actions");
    const result = await issueRefundAction(
      { status: "idle" },
      formData({
        transaction_id: VALID_TX_ID,
        refunded_amount_cents: "0",
        reason: "",
      }),
    );
    expect(result.status).toBe("error");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("surfaces a friendly error when the DB rejects the insert (e.g. RLS: not Pro / not confirmed)", async () => {
    insertMock.mockResolvedValue({
      error: { message: "new row violates row-level security policy" },
    });
    const { issueRefundAction } = await import("./actions");
    const result = await issueRefundAction(
      { status: "idle" },
      formData({
        transaction_id: VALID_TX_ID,
        refunded_amount_cents: "450",
        reason: "",
      }),
    );
    expect(result.status).toBe("error");
    expect(insertMock).toHaveBeenCalled();
  });

  it("rejects a malformed (non-UUID) transaction id via the Zod schema without touching the DB", async () => {
    const { issueRefundAction } = await import("./actions");
    const result = await issueRefundAction(
      { status: "idle" },
      formData({
        transaction_id: "not-a-uuid",
        refunded_amount_cents: "450",
        reason: "",
      }),
    );
    expect(result.status).toBe("error");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a refund amount above the DB's int4 bound via the Zod schema without touching the DB", async () => {
    const { issueRefundAction } = await import("./actions");
    const result = await issueRefundAction(
      { status: "idle" },
      formData({
        transaction_id: VALID_TX_ID,
        refunded_amount_cents: "99999999999",
        reason: "",
      }),
    );
    expect(result.status).toBe("error");
    expect(insertMock).not.toHaveBeenCalled();
  });
});
