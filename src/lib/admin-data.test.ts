import { describe, it, expect, vi, beforeEach } from "vitest";

// Generic chainable/awaitable query-builder stub, keyed per table so a test
// can configure what each `.from(table)` call resolves to independently.
const { fromMock, listUsersMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  listUsersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(async () => ({
    from: fromMock,
    auth: { admin: { listUsers: listUsersMock } },
  })),
}));

import {
  platformTotals,
  recentActivity,
  listVendors,
  getAdminPricing,
} from "@/lib/admin-data";

function builder(data: unknown, error: unknown = null) {
  const b: Record<string, unknown> = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    in: vi.fn(() => b),
    maybeSingle: () => Promise.resolve({ data, error }),
    then: (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
      resolve({ data, error }),
  };
  return b;
}

function mockTables(tables: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) => builder(tables[table] ?? []));
}

const users = [
  { id: "v1", email: "vendor1@x.com" },
  { id: "v2", email: "vendor2@x.com" },
];

describe("admin-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsersMock.mockResolvedValue({ data: { users }, error: null });
  });

  describe("platformTotals", () => {
    it("sums totals across vendor_payment_config and transactions", async () => {
      mockTables({
        vendor_payment_config: [
          { vendor_id: "v1", plan: "free" },
          { vendor_id: "v2", plan: "pro" },
          { vendor_id: "v3", plan: "pro" },
        ],
        transactions: [
          { id: "t1", status: "confirmed", amount_cents: 500 },
          { id: "t2", status: "confirmed", amount_cents: 700 },
          { id: "t3", status: "pending", amount_cents: 300 },
        ],
      });

      const totals = await platformTotals();

      expect(totals).toEqual({
        vendors: 3,
        free_vendors: 1,
        pro_vendors: 2,
        transactions: 3,
        confirmed_transactions: 2,
        confirmed_volume_cents: 1200,
      });
    });

    it("throws when a read errors", async () => {
      fromMock.mockReturnValueOnce(builder(null, { message: "boom" }));
      await expect(platformTotals()).rejects.toThrow("platformTotals");
    });
  });

  describe("recentActivity", () => {
    it("resolves vendor email onto each transaction, most recent first", async () => {
      mockTables({
        transactions: [
          {
            id: "t1",
            vendor_id: "v1",
            kit_slug: "qkit",
            amount_cents: 500,
            status: "confirmed",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const rows = await recentActivity();

      expect(rows).toEqual([
        {
          id: "t1",
          vendor_id: "v1",
          email: "vendor1@x.com",
          kit_slug: "qkit",
          amount_cents: 500,
          status: "confirmed",
          created_at: "2026-07-01T00:00:00Z",
        },
      ]);
    });

    it("resolves a missing auth user to a null email", async () => {
      mockTables({
        transactions: [
          {
            id: "t1",
            vendor_id: "unknown",
            kit_slug: "qkit",
            amount_cents: 500,
            status: "pending",
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
      });

      const rows = await recentActivity();

      expect(rows[0].email).toBeNull();
    });

    it("returns an empty list when there are no transactions", async () => {
      mockTables({ transactions: [] });
      const rows = await recentActivity();
      expect(rows).toEqual([]);
    });

    it("throws when the read errors", async () => {
      fromMock.mockReturnValueOnce(builder(null, { message: "boom" }));
      await expect(recentActivity()).rejects.toThrow("recentActivity");
    });
  });

  describe("listVendors", () => {
    it("counts transactions per vendor and resolves email, sorted by email", async () => {
      mockTables({
        vendor_payment_config: [
          {
            vendor_id: "v2",
            plan: "free",
            kind: "pointer",
            payee_name: null,
            label: "Pay with PayLah",
            created_at: "2026-07-02T00:00:00Z",
          },
          {
            vendor_id: "v1",
            plan: "pro",
            kind: "paynow",
            payee_name: "Kopitiam Cart",
            label: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
        transactions: [
          { vendor_id: "v1" },
          { vendor_id: "v1" },
          { vendor_id: "v2" },
        ],
      });

      const rows = await listVendors();

      expect(rows).toEqual([
        {
          vendor_id: "v1",
          email: "vendor1@x.com",
          plan: "pro",
          kind: "paynow",
          payee_name: "Kopitiam Cart",
          label: null,
          transaction_count: 2,
          created_at: "2026-07-01T00:00:00Z",
        },
        {
          vendor_id: "v2",
          email: "vendor2@x.com",
          plan: "free",
          kind: "pointer",
          payee_name: null,
          label: "Pay with PayLah",
          transaction_count: 1,
          created_at: "2026-07-02T00:00:00Z",
        },
      ]);
    });

    it("gives a vendor with no transactions a zero count", async () => {
      mockTables({
        vendor_payment_config: [
          {
            vendor_id: "v1",
            plan: "free",
            kind: "paynow",
            payee_name: "Kopitiam Cart",
            label: null,
            created_at: "2026-07-01T00:00:00Z",
          },
        ],
        transactions: [],
      });

      const rows = await listVendors();

      expect(rows[0].transaction_count).toBe(0);
    });

    it("throws when a read errors", async () => {
      fromMock.mockReturnValueOnce(builder(null, { message: "boom" }));
      await expect(listVendors()).rejects.toThrow("listVendors");
    });
  });

  describe("getAdminPricing", () => {
    it("reads the single pricing row via the service-role client", async () => {
      mockTables({ pricing: { monthly_cents: 499, currency: "SGD" } });
      await expect(getAdminPricing()).resolves.toEqual({
        monthly_cents: 499,
        currency: "SGD",
      });
    });

    it("falls back to DEFAULT_PRICING when the row can't be read", async () => {
      fromMock.mockReturnValueOnce(builder(null, null));
      const { DEFAULT_PRICING } = await import("@/lib/pricing");
      await expect(getAdminPricing()).resolves.toEqual(DEFAULT_PRICING);
    });
  });
});
