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
  maybeSingleMock.mockReset();
});

function req() {
  return new Request("http://localhost/api/v1/vendors/v1/config", {
    headers: { authorization: "Bearer qkit:secret" },
  });
}
function ctx() {
  return { params: Promise.resolve({ vendor_id: "v1" }) };
}

describe("GET /api/v1/vendors/[vendor_id]/config", () => {
  it("reports has_config true + payee_name when configured", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { payee_name: "Kopitiam Cart" },
      error: null,
    });
    const res = await GET(req(), ctx());
    expect(await res.json()).toEqual({
      has_config: true,
      payee_name: "Kopitiam Cart",
    });
  });
  it("reports has_config false when unconfigured", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const res = await GET(req(), ctx());
    expect(await res.json()).toEqual({ has_config: false, payee_name: null });
  });
  it("401s when unauthorized", async () => {
    verifyKitAuthMock.mockResolvedValue(null);
    expect((await GET(req(), ctx())).status).toBe(401);
  });
});
