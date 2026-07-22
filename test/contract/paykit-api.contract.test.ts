import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  checkoutResponseSchema,
  transactionStatusResponseSchema,
  vendorConfigResponseSchema,
} from "@/lib/api-schemas";

function loadSample(name: string) {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), "utf8"),
  );
}

describe("paykit /api/v1 contract", () => {
  it("POST /api/v1/checkout response satisfies checkoutResponseSchema", () => {
    const parsed = checkoutResponseSchema.safeParse(
      loadSample("checkout-response.sample.json"),
    );
    expect(parsed.success, JSON.stringify(parsed.error?.format())).toBe(true);
  });

  it("claim/confirm/status responses satisfy transactionStatusResponseSchema", () => {
    const parsed = transactionStatusResponseSchema.safeParse(
      loadSample("transaction-status.sample.json"),
    );
    expect(parsed.success, JSON.stringify(parsed.error?.format())).toBe(true);
  });

  it("GET /api/v1/vendors/{vendor_id}/config response satisfies vendorConfigResponseSchema", () => {
    const parsed = vendorConfigResponseSchema.safeParse(
      loadSample("vendor-config.sample.json"),
    );
    expect(parsed.success, JSON.stringify(parsed.error?.format())).toBe(true);
  });

  it("vendor-config sample never carries a secret field", () => {
    const sample = loadSample("vendor-config.sample.json");
    expect(Object.keys(sample).sort()).toEqual(["display_name", "has_config"]);
  });
});
