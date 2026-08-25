import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";

const {
  getVendorSessionMock,
  createServiceClientMock,
  createCheckoutMock,
  recordAuditMock,
  insertSingleMock,
  serviceDeleteMock,
  serviceUpdateEqMock,
  vendorBookingMaybeSingleMock,
  vendorUpdateEqMock,
  refundsInsertMock,
} = vi.hoisted(() => ({
  getVendorSessionMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  createCheckoutMock: vi.fn(),
  recordAuditMock: vi.fn(),
  insertSingleMock: vi.fn(),
  serviceDeleteMock: vi.fn(),
  serviceUpdateEqMock: vi.fn(),
  vendorBookingMaybeSingleMock: vi.fn(),
  vendorUpdateEqMock: vi.fn(),
  refundsInsertMock: vi.fn(),
}));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: createServiceClientMock,
}));
vi.mock("@/lib/checkout", () => ({ createCheckout: createCheckoutMock }));
vi.mock("@/app/admin/actions", () => ({ recordAudit: recordAuditMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const VENDOR_SUPABASE = {
  from: (table: string) => {
    if (table === "refunds") return { insert: refundsInsertMock };
    if (table !== "bookings") throw new Error(`unexpected table ${table}`);
    return {
      insert: () => ({ select: () => ({ single: insertSingleMock }) }),
      select: () => ({
        eq: () => ({ maybeSingle: vendorBookingMaybeSingleMock }),
      }),
      update: () => ({ eq: vendorUpdateEqMock }),
    };
  },
};

const SERVICE_SUPABASE = {
  from: (table: string) => {
    if (table !== "bookings") throw new Error(`unexpected table ${table}`);
    return {
      delete: () => ({ eq: serviceDeleteMock }),
      update: () => ({ eq: serviceUpdateEqMock }),
    };
  },
};

beforeEach(() => {
  getVendorSessionMock
    .mockReset()
    .mockResolvedValue({ supabase: VENDOR_SUPABASE, user: { id: "v1" } });
  createServiceClientMock.mockReset().mockResolvedValue(SERVICE_SUPABASE);
  createCheckoutMock.mockReset().mockResolvedValue({
    ok: true,
    type: "qr",
    transaction_id: "tx-deposit",
    payload: "0002...",
  });
  recordAuditMock.mockReset().mockResolvedValue(undefined);
  insertSingleMock.mockReset().mockResolvedValue({
    data: { id: "b1" },
    error: null,
  });
  serviceDeleteMock.mockReset().mockResolvedValue({ error: null });
  serviceUpdateEqMock.mockReset().mockResolvedValue({ error: null });
  vendorBookingMaybeSingleMock.mockReset().mockResolvedValue({
    data: {
      id: "b1",
      status: "deposit_paid",
      event_date: "2026-12-01",
      balance_due_date: "2026-11-24",
      balance_amount_cents: 70000,
      deposit_transaction_id: "tx-deposit",
      balance_transaction_id: null,
    },
    error: null,
  });
  vendorUpdateEqMock.mockReset().mockResolvedValue({ error: null });
  refundsInsertMock.mockReset().mockResolvedValue({ error: null });
  vi.mocked(revalidatePath).mockReset();
});

const VALID_BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const VALID_TX_ID = "22222222-2222-2222-2222-222222222222";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID_BOOKING_FIELDS = {
  customer_name: "Jane Tan",
  customer_phone: "+6591234567",
  event_date: "2026-12-01",
  balance_due_date: "2026-11-24",
  total_amount: "1000.00",
  deposit_amount: "300.00",
  balance_amount: "700.00",
};

describe("createBookingAction", () => {
  it("creates a booking and its deposit checkout, linking the transaction id", async () => {
    const { createBookingAction } = await import("./actions");
    const result = await createBookingAction(
      { status: "idle" },
      formData(VALID_BOOKING_FIELDS),
    );
    expect(result.status).toBe("ok");
    expect(insertSingleMock).toHaveBeenCalled();
    expect(createCheckoutMock).toHaveBeenCalledWith({
      vendorId: "v1",
      kitSlug: "paykit",
      orderRef: "booking:b1:deposit",
      amountCents: 30000,
    });
    expect(recordAuditMock).toHaveBeenCalledWith("v1", "create_booking", "b1", {
      event_date: "2026-12-01",
      total_amount_cents: 100000,
      deposit_amount_cents: 30000,
      balance_amount_cents: 70000,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/bookings");
  });

  it("rejects invalid input without inserting or logging", async () => {
    const { createBookingAction } = await import("./actions");
    const result = await createBookingAction(
      { status: "idle" },
      formData({ ...VALID_BOOKING_FIELDS, customer_name: "" }),
    );
    expect(result.status).toBe("error");
    expect(insertSingleMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("rejects when deposit + balance don't add up to the total", async () => {
    const { createBookingAction } = await import("./actions");
    const result = await createBookingAction(
      { status: "idle" },
      formData({ ...VALID_BOOKING_FIELDS, deposit_amount: "999.00" }),
    );
    expect(result.status).toBe("error");
    expect(insertSingleMock).not.toHaveBeenCalled();
  });

  it("returns an error when the booking insert fails, without logging", async () => {
    insertSingleMock.mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const { createBookingAction } = await import("./actions");
    const result = await createBookingAction(
      { status: "idle" },
      formData(VALID_BOOKING_FIELDS),
    );
    expect(result.status).toBe("error");
    expect(createCheckoutMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("deletes the booking and surfaces an error when the deposit checkout fails, without logging", async () => {
    createCheckoutMock.mockResolvedValue({
      ok: false,
      status: 422,
      error: "vendor has no PayNow config",
    });
    const { createBookingAction } = await import("./actions");
    const result = await createBookingAction(
      { status: "idle" },
      formData(VALID_BOOKING_FIELDS),
    );
    expect(result.status).toBe("error");
    expect(serviceDeleteMock).toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("createBalanceCheckoutAction", () => {
  it("creates the balance checkout and links it", async () => {
    createCheckoutMock.mockResolvedValue({
      ok: true,
      type: "qr",
      transaction_id: "tx-balance",
      payload: "0002...",
    });
    const { createBalanceCheckoutAction } = await import("./actions");
    const result = await createBalanceCheckoutAction(VALID_BOOKING_ID);
    expect(result.status).toBe("ok");
    expect(createCheckoutMock).toHaveBeenCalledWith({
      vendorId: "v1",
      kitSlug: "paykit",
      orderRef: "booking:b1:balance",
      amountCents: 70000,
    });
    expect(serviceUpdateEqMock).toHaveBeenCalled();
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "create_balance_checkout",
      "b1",
      { amount_cents: 70000 },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/bookings/b1");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/bookings");
  });

  it("rejects a malformed booking id without logging", async () => {
    const { createBalanceCheckoutAction } = await import("./actions");
    const result = await createBalanceCheckoutAction("not-a-uuid");
    expect(result.status).toBe("error");
    expect(createCheckoutMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("errors when the booking has no deposit transaction yet", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({
      data: {
        id: "b1",
        balance_amount_cents: 70000,
        deposit_transaction_id: null,
        balance_transaction_id: null,
      },
      error: null,
    });
    const { createBalanceCheckoutAction } = await import("./actions");
    const result = await createBalanceCheckoutAction(VALID_BOOKING_ID);
    expect(result.status).toBe("error");
    expect(createCheckoutMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("errors when the balance checkout already exists", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({
      data: {
        id: "b1",
        balance_amount_cents: 70000,
        deposit_transaction_id: "tx-deposit",
        balance_transaction_id: "tx-balance",
      },
      error: null,
    });
    const { createBalanceCheckoutAction } = await import("./actions");
    const result = await createBalanceCheckoutAction(VALID_BOOKING_ID);
    expect(result.status).toBe("error");
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("errors when the booking isn't found (or isn't this vendor's)", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { createBalanceCheckoutAction } = await import("./actions");
    const result = await createBalanceCheckoutAction(VALID_BOOKING_ID);
    expect(result.status).toBe("error");
  });
});

describe("cancelBookingAction", () => {
  it("cancels a booking and records an audit row with the reason", async () => {
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(
      VALID_BOOKING_ID,
      "Customer rescheduled",
    );
    expect(result.status).toBe("ok");
    expect(vendorUpdateEqMock).toHaveBeenCalledWith("id", VALID_BOOKING_ID);
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "cancel_booking",
      VALID_BOOKING_ID,
      {
        reason: "Customer rescheduled",
        refund_transaction_id: null,
        refund_amount_cents: null,
        refund_recorded: null,
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/bookings/${VALID_BOOKING_ID}`,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/bookings");
  });

  it("records a null reason when none was given", async () => {
    const { cancelBookingAction } = await import("./actions");
    await cancelBookingAction(VALID_BOOKING_ID);
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "cancel_booking",
      VALID_BOOKING_ID,
      {
        reason: null,
        refund_transaction_id: null,
        refund_amount_cents: null,
        refund_recorded: null,
      },
    );
  });

  it("rejects a malformed booking id without reading or updating", async () => {
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction("not-a-uuid");
    expect(result.status).toBe("error");
    expect(vendorBookingMaybeSingleMock).not.toHaveBeenCalled();
    expect(vendorUpdateEqMock).not.toHaveBeenCalled();
  });

  it("is a no-op success when the booking is already cancelled", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({
      data: {
        id: "b1",
        status: "cancelled",
        deposit_transaction_id: "tx-deposit",
        balance_transaction_id: null,
      },
      error: null,
    });
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(VALID_BOOKING_ID);
    expect(result.status).toBe("ok");
    expect(vendorUpdateEqMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("returns not-found and logs nothing when the booking isn't found or isn't owned (regression: RLS silently no-ops UPDATE on a non-owned row)", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(VALID_BOOKING_ID);
    expect(result.status).toBe("error");
    expect(vendorUpdateEqMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("surfaces an error when the update fails", async () => {
    vendorUpdateEqMock.mockResolvedValue({
      error: { message: "row-level security policy" },
    });
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(VALID_BOOKING_ID);
    expect(result.status).toBe("error");
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("records a refund against the given transaction when provided", async () => {
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(VALID_BOOKING_ID, "Full refund", {
      transactionId: VALID_TX_ID,
      amountCents: 30000,
    });
    expect(result.status).toBe("ok");
    expect(refundsInsertMock).toHaveBeenCalledWith({
      transaction_id: VALID_TX_ID,
      refunded_amount_cents: 30000,
      reason: "Full refund",
      created_by: "v1",
    });
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "cancel_booking",
      VALID_BOOKING_ID,
      {
        reason: "Full refund",
        refund_transaction_id: VALID_TX_ID,
        refund_amount_cents: 30000,
        refund_recorded: true,
      },
    );
  });

  it("still cancels but flags the refund as not recorded when the refund insert fails (e.g. not Pro, or transaction not confirmed)", async () => {
    refundsInsertMock.mockResolvedValue({
      error: { message: "row-level security policy" },
    });
    const { cancelBookingAction } = await import("./actions");
    const result = await cancelBookingAction(VALID_BOOKING_ID, undefined, {
      transactionId: VALID_TX_ID,
      amountCents: 30000,
    });
    expect(result.status).toBe("ok");
    expect(result.message).toMatch(/refund/i);
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "cancel_booking",
      VALID_BOOKING_ID,
      {
        reason: null,
        refund_transaction_id: VALID_TX_ID,
        refund_amount_cents: 30000,
        refund_recorded: false,
      },
    );
  });
});

describe("rescheduleBookingAction", () => {
  it("reschedules a booking and records the previous and new dates", async () => {
    const { rescheduleBookingAction } = await import("./actions");
    const result = await rescheduleBookingAction(
      VALID_BOOKING_ID,
      "2027-01-15",
      "2027-01-08",
    );
    expect(result.status).toBe("ok");
    expect(vendorUpdateEqMock).toHaveBeenCalledWith("id", VALID_BOOKING_ID);
    expect(recordAuditMock).toHaveBeenCalledWith(
      "v1",
      "reschedule_booking",
      VALID_BOOKING_ID,
      {
        previous_event_date: "2026-12-01",
        previous_balance_due_date: "2026-11-24",
        new_event_date: "2027-01-15",
        new_balance_due_date: "2027-01-08",
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/bookings/${VALID_BOOKING_ID}`,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/bookings");
  });

  it("rejects a balance-due date after the event date without reading", async () => {
    const { rescheduleBookingAction } = await import("./actions");
    const result = await rescheduleBookingAction(
      VALID_BOOKING_ID,
      "2027-01-01",
      "2027-01-15",
    );
    expect(result.status).toBe("error");
    expect(vendorBookingMaybeSingleMock).not.toHaveBeenCalled();
  });

  it("errors when the booking isn't found or isn't owned", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { rescheduleBookingAction } = await import("./actions");
    const result = await rescheduleBookingAction(
      VALID_BOOKING_ID,
      "2027-01-15",
      "2027-01-08",
    );
    expect(result.status).toBe("error");
    expect(vendorUpdateEqMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("refuses to reschedule an already-cancelled booking", async () => {
    vendorBookingMaybeSingleMock.mockResolvedValue({
      data: {
        id: "b1",
        status: "cancelled",
        event_date: "2026-12-01",
        balance_due_date: "2026-11-24",
      },
      error: null,
    });
    const { rescheduleBookingAction } = await import("./actions");
    const result = await rescheduleBookingAction(
      VALID_BOOKING_ID,
      "2027-01-15",
      "2027-01-08",
    );
    expect(result.status).toBe("error");
    expect(vendorUpdateEqMock).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("surfaces an error when the update fails", async () => {
    vendorUpdateEqMock.mockResolvedValue({
      error: { message: "row-level security policy" },
    });
    const { rescheduleBookingAction } = await import("./actions");
    const result = await rescheduleBookingAction(
      VALID_BOOKING_ID,
      "2027-01-15",
      "2027-01-08",
    );
    expect(result.status).toBe("error");
    expect(recordAuditMock).not.toHaveBeenCalled();
  });
});
