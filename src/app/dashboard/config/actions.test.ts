import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserMock, upsertMock, createServerClientMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  upsertMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "v1" } } });
  upsertMock.mockReset().mockResolvedValue({ error: null });
  createServerClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    from: () => ({ upsert: upsertMock }),
  });
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("saveConfigAction", () => {
  it("saves a valid UEN paynow config, nulling pointer fields", async () => {
    const { saveConfigAction } = await import("./actions");
    const result = await saveConfigAction(
      { status: "idle" },
      formData({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "53312345A",
        mobile: "",
      }),
    );
    expect(result.status).toBe("ok");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor_id: "v1",
        kind: "paynow",
        uen: "53312345A",
        mobile: null,
        payee_name: "Kopitiam Cart",
        label: null,
        url: null,
        qr_image_url: null,
      }),
      { onConflict: "vendor_id" },
    );
  });

  it("returns an error for an invalid paynow config (both uen and mobile)", async () => {
    const { saveConfigAction } = await import("./actions");
    const result = await saveConfigAction(
      { status: "idle" },
      formData({
        kind: "paynow",
        payee_name: "Kopitiam Cart",
        uen: "53312345A",
        mobile: "+6591234567",
      }),
    );
    expect(result.status).toBe("error");
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("saves a valid pointer config with a link, nulling paynow fields", async () => {
    const { saveConfigAction } = await import("./actions");
    const result = await saveConfigAction(
      { status: "idle" },
      formData({
        kind: "pointer",
        label: "Pay with PayLah",
        url: "https://pay.example/kopitiam",
        qr_image_url: "",
      }),
    );
    expect(result.status).toBe("ok");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor_id: "v1",
        kind: "pointer",
        label: "Pay with PayLah",
        url: "https://pay.example/kopitiam",
        qr_image_url: null,
        payee_name: null,
        uen: null,
        mobile: null,
      }),
      { onConflict: "vendor_id" },
    );
  });

  it("returns an error for an invalid pointer config (neither url nor qr_image_url)", async () => {
    const { saveConfigAction } = await import("./actions");
    const result = await saveConfigAction(
      { status: "idle" },
      formData({ kind: "pointer", label: "Pay", url: "", qr_image_url: "" }),
    );
    expect(result.status).toBe("error");
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
