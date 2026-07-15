import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const {
  verifyKitAuthMock,
  readMaybeSingle,
  updateSingle,
  createServiceClientMock,
} = vi.hoisted(() => ({
  verifyKitAuthMock: vi.fn(),
  readMaybeSingle: vi.fn(),
  updateSingle: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/kit-auth", () => ({ verifyKitAuth: verifyKitAuthMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));

const ROW = {
  id: "tx1",
  status: "pending",
  amount_cents: 450,
  order_ref: "A-001",
  kit_slug: "qkit",
  claimed_at: null,
  confirmed_at: null,
  created_at: "2026-07-15T00:00:00Z",
};

function fakeSupabase() {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: readMaybeSingle }) }),
      update: () => ({
        eq: () => ({
          eq: () => ({ select: () => ({ single: updateSingle }) }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  verifyKitAuthMock.mockReset().mockResolvedValue({ kitSlug: "qkit" });
  createServiceClientMock.mockReset().mockResolvedValue(fakeSupabase());
  readMaybeSingle.mockReset().mockResolvedValue({ data: ROW, error: null });
  updateSingle.mockReset().mockResolvedValue({
    data: { ...ROW, status: "claimed", claimed_at: "2026-07-15T00:01:00Z" },
    error: null,
  });
});

function req() {
  return new Request("http://localhost/api/v1/checkout/tx1/claim", {
    method: "POST",
    headers: { authorization: "Bearer qkit:secret" },
  });
}
function ctx() {
  return { params: Promise.resolve({ id: "tx1" }) };
}

describe("POST /api/v1/checkout/[id]/claim", () => {
  it("claims a pending transaction", async () => {
    const res = await POST(req(), ctx());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("claimed");
    expect(json.claimed_at).toBe("2026-07-15T00:01:00Z");
  });

  it("is idempotent on an already-claimed transaction (no update call)", async () => {
    readMaybeSingle.mockResolvedValue({
      data: { ...ROW, status: "claimed" },
      error: null,
    });
    const res = await POST(req(), ctx());
    expect(res.status).toBe(200);
    expect(updateSingle).not.toHaveBeenCalled();
  });

  it("401s when unauthorized", async () => {
    verifyKitAuthMock.mockResolvedValue(null);
    expect((await POST(req(), ctx())).status).toBe(401);
  });

  it("404s for an unknown transaction", async () => {
    readMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await POST(req(), ctx())).status).toBe(404);
  });
});
