import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashApiKey } from "./kit-auth";

const { maybeSingleMock, updateEqMock, createServiceClientMock } = vi.hoisted(
  () => ({
    maybeSingleMock: vi.fn(),
    updateEqMock: vi.fn(),
    createServiceClientMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));

beforeEach(async () => {
  maybeSingleMock.mockReset();
  updateEqMock.mockReset().mockResolvedValue({ error: null });
  createServiceClientMock.mockReset().mockResolvedValue({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      update: () => ({ eq: updateEqMock }),
    }),
  });
});

function req(authorization?: string) {
  return new Request("http://localhost/api/v1/checkout", {
    headers: authorization ? { authorization } : {},
  });
}

describe("hashApiKey", () => {
  it("is deterministic and hex-encoded", () => {
    const h = hashApiKey("s3cret");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey("s3cret")).toBe(h);
  });
  it("differs for different secrets", () => {
    expect(hashApiKey("a")).not.toBe(hashApiKey("b"));
  });
});

describe("verifyKitAuth", () => {
  it("returns null with no Authorization header", async () => {
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req())).toBeNull();
  });

  it("returns null for a malformed bearer token (no kit_slug:secret split)", async () => {
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer justasecret"))).toBeNull();
  });

  it("returns null when the secret half is empty", async () => {
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer qkit:"))).toBeNull();
  });

  it("returns null when the kit_slug is unknown", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer qkit:s3cret"))).toBeNull();
  });

  it("returns null when the secret hash does not match", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { secret_hash: hashApiKey("different-secret") },
      error: null,
    });
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer qkit:s3cret"))).toBeNull();
  });

  it("returns the kit slug when the secret hash matches", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { secret_hash: hashApiKey("s3cret") },
      error: null,
    });
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer qkit:s3cret"))).toEqual({
      kitSlug: "qkit",
    });
  });

  it("touches last_used_at for the kit_slug on a successful auth", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { secret_hash: hashApiKey("s3cret") },
      error: null,
    });
    const { verifyKitAuth } = await import("./kit-auth");
    await verifyKitAuth(req("Bearer qkit:s3cret"));
    expect(updateEqMock).toHaveBeenCalledWith("kit_slug", "qkit");
  });

  it("does not touch last_used_at when auth fails", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { verifyKitAuth } = await import("./kit-auth");
    await verifyKitAuth(req("Bearer qkit:s3cret"));
    expect(updateEqMock).not.toHaveBeenCalled();
  });

  it("still returns success even when the last_used_at write fails", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { secret_hash: hashApiKey("s3cret") },
      error: null,
    });
    updateEqMock.mockResolvedValue({ error: { message: "connection reset" } });
    const { verifyKitAuth } = await import("./kit-auth");
    expect(await verifyKitAuth(req("Bearer qkit:s3cret"))).toEqual({
      kitSlug: "qkit",
    });
  });

  describe("failed-auth logging", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("logs a warning with no Authorization header, no secret in the log", async () => {
      const { verifyKitAuth } = await import("./kit-auth");
      await verifyKitAuth(req());
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).not.toContain("s3cret");
    });

    it("logs a warning for a malformed bearer token, no secret in the log", async () => {
      const { verifyKitAuth } = await import("./kit-auth");
      await verifyKitAuth(req("Bearer justasecret"));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).not.toContain("justasecret");
    });

    it("logs the kit_slug (never the secret) when the kit_slug is unknown", async () => {
      maybeSingleMock.mockResolvedValue({ data: null, error: null });
      const { verifyKitAuth } = await import("./kit-auth");
      await verifyKitAuth(req("Bearer ghostkit:s3cret"));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("ghostkit");
      expect(warnSpy.mock.calls[0][0]).not.toContain("s3cret");
    });

    it("logs the kit_slug (never the secret) on a secret mismatch", async () => {
      maybeSingleMock.mockResolvedValue({
        data: { secret_hash: hashApiKey("different-secret") },
        error: null,
      });
      const { verifyKitAuth } = await import("./kit-auth");
      await verifyKitAuth(req("Bearer qkit:s3cret"));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("qkit");
      expect(warnSpy.mock.calls[0][0]).not.toContain("s3cret");
    });

    it("does not log anything on a successful auth", async () => {
      maybeSingleMock.mockResolvedValue({
        data: { secret_hash: hashApiKey("s3cret") },
        error: null,
      });
      const { verifyKitAuth } = await import("./kit-auth");
      await verifyKitAuth(req("Bearer qkit:s3cret"));
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
