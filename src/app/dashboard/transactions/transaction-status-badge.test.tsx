import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TransactionStatusBadge } from "./transaction-status-badge";

describe("TransactionStatusBadge", () => {
  it("gives claimed the mint accent, not confirmed/pending's plain badge", () => {
    const claimed = renderToStaticMarkup(
      createElement(TransactionStatusBadge, { status: "claimed" }),
    );
    expect(claimed).toContain("bg-mint/15");
    expect(claimed).toContain("claimed");

    const confirmed = renderToStaticMarkup(
      createElement(TransactionStatusBadge, { status: "confirmed" }),
    );
    expect(confirmed).not.toContain("bg-mint/15");
  });
});
