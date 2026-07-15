// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionTable } from "./transaction-table";
import type { Transaction } from "@/lib/types";

const TX: Transaction = {
  id: "tx1",
  vendor_id: "v1",
  kit_slug: "qkit",
  order_ref: "A-001",
  amount_cents: 450,
  status: "confirmed",
  qr_payload: "0002...",
  claimed_at: "2026-07-15T00:01:00Z",
  confirmed_at: "2026-07-15T00:02:00Z",
  created_at: "2026-07-15T00:00:00Z",
};

describe("TransactionTable", () => {
  it("renders one row per transaction with kit, order ref, amount, status", () => {
    render(<TransactionTable transactions={[TX]} isPro={false} />);
    expect(screen.getByText("qkit")).toBeInTheDocument();
    expect(screen.getByText("A-001")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });

  it("shows an empty state with no transactions", () => {
    render(<TransactionTable transactions={[]} isPro={false} />);
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });
});
