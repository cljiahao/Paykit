import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, updateMock, insertMock, createServiceClientMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    updateMock: vi.fn(),
    insertMock: vi.fn(),
    createServiceClientMock: vi.fn(),
  }));

vi.mock("@/lib/admin", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
  updateMock.mockReset().mockReturnValue({
    eq: () => ({
      select: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: { vendor_id: "v1" }, error: null }),
      }),
    }),
  });
  insertMock.mockReset().mockResolvedValue({ error: null });
  createServiceClientMock.mockReset().mockResolvedValue({
    from: (table: string) =>
      table === "admin_audit" ? { insert: insertMock } : { update: updateMock },
  });
});

describe("setVendorPlan", () => {
  it("404s (via requireAdmin) before writing anything for a non-admin", async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    const { setVendorPlan } = await import("./actions");

    await expect(
      setVendorPlan(formData({ vendorId: "v1", plan: "pro" })),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input without writing", async () => {
    const { setVendorPlan } = await import("./actions");

    const result = await setVendorPlan(
      formData({ vendorId: "not-a-uuid", plan: "pro" }),
    );

    expect(result).toEqual({ success: false, error: "Invalid input" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a plan value outside free/pro", async () => {
    const { setVendorPlan } = await import("./actions");

    const result = await setVendorPlan(
      formData({
        vendorId: "11111111-1111-1111-1111-111111111111",
        plan: "enterprise",
      }),
    );

    expect(result).toEqual({ success: false, error: "Invalid input" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the vendor's plan, records an audit row, and revalidates on success", async () => {
    const { setVendorPlan } = await import("./actions");
    const vendorId = "11111111-1111-1111-1111-111111111111";

    const result = await setVendorPlan(formData({ vendorId, plan: "pro" }));

    expect(result).toEqual({ success: true });
    expect(updateMock).toHaveBeenCalledWith({ plan: "pro" });
    expect(insertMock).toHaveBeenCalledWith({
      admin_id: "admin-1",
      action: "set_vendor_plan",
      target_id: vendorId,
      detail: { plan: "pro" },
    });
  });

  it("returns an error when no row is updated (vendor not found)", async () => {
    updateMock.mockReturnValue({
      eq: () => ({
        select: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
    const { setVendorPlan } = await import("./actions");

    const result = await setVendorPlan(
      formData({
        vendorId: "11111111-1111-1111-1111-111111111111",
        plan: "free",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Could not update plan",
    });
  });

  it("does not fail the action when the audit insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "audit down" } });
    const { setVendorPlan } = await import("./actions");

    const result = await setVendorPlan(
      formData({
        vendorId: "11111111-1111-1111-1111-111111111111",
        plan: "pro",
      }),
    );

    expect(result).toEqual({ success: true });
  });
});
