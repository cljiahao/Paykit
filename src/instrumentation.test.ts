import { describe, it, expect, vi, beforeEach } from "vitest";

const { initMock, captureRequestErrorMock } = vi.hoisted(() => ({
  initMock: vi.fn(),
  captureRequestErrorMock: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  init: initMock,
  captureRequestError: captureRequestErrorMock,
}));

beforeEach(() => {
  initMock.mockReset();
  vi.unstubAllEnvs();
});

describe("register", () => {
  it("initializes Sentry in the nodejs runtime, forwarding SENTRY_DSN", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("SENTRY_DSN", "https://example@o0.ingest.sentry.io/0");
    const { register } = await import("./instrumentation");
    await register();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://example@o0.ingest.sentry.io/0" }),
    );
  });

  it("still calls init with an undefined dsn when SENTRY_DSN is unset (SDK no-ops)", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("SENTRY_DSN", "");
    const { register } = await import("./instrumentation");
    await register();
    expect(initMock).toHaveBeenCalledWith(expect.objectContaining({ dsn: "" }));
  });

  it("does not initialize outside the nodejs runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    const { register } = await import("./instrumentation");
    await register();
    expect(initMock).not.toHaveBeenCalled();
  });
});

describe("onRequestError", () => {
  it("is Sentry's own captureRequestError", async () => {
    const { onRequestError } = await import("./instrumentation");
    expect(onRequestError).toBe(captureRequestErrorMock);
  });
});
