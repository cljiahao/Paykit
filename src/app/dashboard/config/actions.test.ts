import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getUserMock,
  maybeSingleMock,
  insertMock,
  updateMock,
  createServerClientMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "v1" } } });
  // No existing row by default — saveConfigAction takes the insert path. Not
  // `.upsert()`: PostgREST's ON CONFLICT DO UPDATE path needs table-level
  // UPDATE privilege regardless of column grants (see actions.ts), so this
  // mock exercises the same explicit select-then-insert-or-update shape.
  maybeSingleMock.mockReset().mockResolvedValue({ data: null });
  insertMock.mockReset().mockResolvedValue({ error: null });
  updateMock.mockReset().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  createServerClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      insert: insertMock,
      update: updateMock,
    }),
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
    expect(insertMock).toHaveBeenCalledWith(
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
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates an existing config instead of inserting", async () => {
    maybeSingleMock.mockResolvedValue({ data: { vendor_id: "v1" } });
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
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "paynow",
        uen: "53312345A",
        mobile: null,
        payee_name: "Kopitiam Cart",
        label: null,
        url: null,
        qr_image_url: null,
      }),
    );
    expect(updateMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ vendor_id: expect.anything() }),
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
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
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
    expect(insertMock).toHaveBeenCalledWith(
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
    );
  });

  it("returns an error for an invalid pointer config (neither url nor qr_image_url)", async () => {
    const { saveConfigAction } = await import("./actions");
    const result = await saveConfigAction(
      { status: "idle" },
      formData({ kind: "pointer", label: "Pay", url: "", qr_image_url: "" }),
    );
    expect(result.status).toBe("error");
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
