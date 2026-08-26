import { describe, expect, it } from "vitest";
import {
  buildVendorHealth,
  statusRank,
  vendorStatus,
  type RefundLite,
  type TransactionLite,
  type VendorLite,
} from "./vendor-health";
import { MS_PER_DAY } from "./utils";

const NOW = Date.parse("2026-08-26T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * MS_PER_DAY).toISOString();

function signals(over: Partial<Parameters<typeof vendorStatus>[0]> = {}) {
  return {
    plan: "free" as const,
    configCreatedAt: daysAgo(30),
    confirmedCountEver: 10,
    lastConfirmedAt: daysAgo(1),
    confirmedCount30d: 10,
    refundCount30d: 0,
    ...over,
  };
}

describe("vendorStatus", () => {
  it("attention: >=3 refunds in 30d, regardless of volume", () => {
    expect(vendorStatus(signals({ refundCount30d: 3 }), NOW)).toBe("attention");
  });

  it("attention: refund/confirmed ratio > 20% once the sample is big enough", () => {
    expect(
      vendorStatus(signals({ confirmedCount30d: 5, refundCount30d: 2 }), NOW),
    ).toBe("attention");
  });

  it("does not flag a brand-new vendor with 1 refund out of 1 transaction", () => {
    expect(
      vendorStatus(signals({ confirmedCount30d: 1, refundCount30d: 1 }), NOW),
    ).not.toBe("attention");
  });

  it("a 20% ratio exactly is not an anomaly (strictly greater than)", () => {
    expect(
      vendorStatus(signals({ confirmedCount30d: 10, refundCount30d: 2 }), NOW),
    ).not.toBe("attention");
  });

  it("stuck: config created 3d+ ago, zero confirmed transactions ever", () => {
    expect(
      vendorStatus(
        signals({
          configCreatedAt: daysAgo(5),
          confirmedCountEver: 0,
          lastConfirmedAt: null,
        }),
        NOW,
      ),
    ).toBe("stuck");
  });

  it("stuck: Pro but zero confirmed transactions ever, even if config is brand new", () => {
    expect(
      vendorStatus(
        signals({
          plan: "pro",
          configCreatedAt: daysAgo(1),
          confirmedCountEver: 0,
          lastConfirmedAt: null,
        }),
        NOW,
      ),
    ).toBe("stuck");
  });

  it("healthy: a confirmed transaction within 14d", () => {
    expect(vendorStatus(signals({ lastConfirmedAt: daysAgo(10) }), NOW)).toBe(
      "healthy",
    );
  });

  it("new: config created under 3d ago, nothing confirmed yet", () => {
    expect(
      vendorStatus(
        signals({
          configCreatedAt: daysAgo(1),
          confirmedCountEver: 0,
          lastConfirmedAt: null,
          confirmedCount30d: 0,
        }),
        NOW,
      ),
    ).toBe("new");
  });

  it("quiet: confirmed before, but nothing in the last 14 days", () => {
    expect(vendorStatus(signals({ lastConfirmedAt: daysAgo(20) }), NOW)).toBe(
      "quiet",
    );
  });
});

describe("statusRank", () => {
  it("orders most-urgent first", () => {
    expect(statusRank("attention")).toBeLessThan(statusRank("stuck"));
    expect(statusRank("stuck")).toBeLessThan(statusRank("quiet"));
    expect(statusRank("quiet")).toBeLessThan(statusRank("new"));
    expect(statusRank("new")).toBeLessThan(statusRank("healthy"));
  });
});

describe("buildVendorHealth", () => {
  const vendors: VendorLite[] = [
    { id: "v1", plan: "free", configCreatedAt: daysAgo(30) },
    { id: "v2", plan: "free", configCreatedAt: daysAgo(1) },
    { id: "v3", plan: "pro", configCreatedAt: daysAgo(10) },
  ];
  const transactions: TransactionLite[] = [
    {
      id: "t1",
      vendor_id: "v1",
      status: "confirmed",
      created_at: daysAgo(5),
      confirmed_at: daysAgo(5),
    },
    {
      id: "t2",
      vendor_id: "v1",
      status: "confirmed",
      created_at: daysAgo(40),
      confirmed_at: daysAgo(40),
    },
    {
      id: "t3",
      vendor_id: "v1",
      status: "pending",
      created_at: daysAgo(1),
      confirmed_at: null,
    },
  ];
  const refunds: RefundLite[] = [
    { transaction_id: "t1", created_at: daysAgo(2) },
  ];

  it("rolls up confirmed counts + last-confirmed date, keyed to the vendor via the transaction map", () => {
    const h = buildVendorHealth(vendors, transactions, refunds, NOW);
    const v1 = h.get("v1")!;
    expect(v1.confirmedCount30d).toBe(1);
    expect(v1.lastConfirmedAt).toBe(daysAgo(5));
    expect(v1.refundCount30d).toBe(1);
    expect(v1.status).toBe("healthy");
  });

  it("a vendor with a fresh config and nothing confirmed is new", () => {
    const h = buildVendorHealth(vendors, transactions, refunds, NOW);
    expect(h.get("v2")!.status).toBe("new");
  });

  it("a Pro vendor with zero confirmed transactions ever is stuck", () => {
    const h = buildVendorHealth(vendors, transactions, refunds, NOW);
    expect(h.get("v3")!.status).toBe("stuck");
  });

  it("an unresolvable refund transaction_id is dropped, not misattributed", () => {
    const h = buildVendorHealth(
      vendors,
      transactions,
      [{ transaction_id: "ghost", created_at: daysAgo(1) }],
      NOW,
    );
    expect(h.get("v1")!.refundCount30d).toBe(0);
  });
});
