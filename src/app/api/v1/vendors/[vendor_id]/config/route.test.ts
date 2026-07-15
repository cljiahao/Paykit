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

const VENDOR_ID = "11111111-1111-1111-1111-111111111111";

function req() {
  return new Request(`http://localhost/api/v1/vendors/${VENDOR_ID}/config`, {
    headers: { authorization: "Bearer qkit:secret" },
  });
}
function ctx(vendor_id: string = VENDOR_ID) {
  return { params: Promise.resolve({ vendor_id }) };
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
  it("400s for a malformed (non-uuid) vendor_id, without querying the DB", async () => {
    const res = await GET(req(), ctx("not-a-uuid"));
    expect(res.status).toBe(400);
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });
  it("503s when the DB read fails", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const res = await GET(req(), ctx());
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).not.toMatch(/connection reset/);
  });
});
