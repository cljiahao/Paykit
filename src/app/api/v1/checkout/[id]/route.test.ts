import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const { verifyKitAuthMock, maybeSingleMock, createServiceClientMock } =
  vi.hoisted(() => ({
    verifyKitAuthMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    createServiceClientMock: vi.fn(),
  }));

vi.mock("@/lib/kit-auth", () => ({ verifyKitAuth: verifyKitAuthMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));

beforeEach(() => {
  verifyKitAuthMock.mockReset().mockResolvedValue({ kitSlug: "qkit" });
  createServiceClientMock.mockReset().mockResolvedValue({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
    }),
  });
  maybeSingleMock.mockReset().mockResolvedValue({
    data: {
      id: "tx1",
      status: "confirmed",
      amount_cents: 450,
      order_ref: "A-001",
      kit_slug: "qkit",
      claimed_at: "2026-07-15T00:01:00Z",
      confirmed_at: "2026-07-15T00:02:00Z",
      created_at: "2026-07-15T00:00:00Z",
    },
    error: null,
  });
});

function req() {
  return new Request("http://localhost/api/v1/checkout/tx1", {
    headers: { authorization: "Bearer qkit:secret" },
  });
}
function ctx() {
  return { params: Promise.resolve({ id: "tx1" }) };
}

describe("GET /api/v1/checkout/[id]", () => {
  it("returns the current status", async () => {
    const res = await GET(req(), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("confirmed");
  });
  it("401s when unauthorized", async () => {
    verifyKitAuthMock.mockResolvedValue(null);
    expect((await GET(req(), ctx())).status).toBe(401);
  });
  it("404s for an unknown transaction", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    expect((await GET(req(), ctx())).status).toBe(404);
  });
});
