import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Cheap guard against silent drift in the hand-written 0011 migration —
// regex presence checks only, not a substitute for running it against real
// Postgres (see supabase/tests/rls.test.sql / CI's pgTAP `db` job for that).
const sql = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/0011_paykit_payment_audit.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("0011_paykit_payment_audit.sql", () => {
  it("creates table paykit.payment_audit", () => {
    expect(sql).toMatch(/create table paykit\.payment_audit\b/);
  });

  it("enables row level security", () => {
    expect(sql).toMatch(
      /alter table paykit\.payment_audit\s+enable row level security/,
    );
  });

  it("constrains action to the known payment-lifecycle transitions", () => {
    expect(sql).toMatch(
      /check \(action in \('checkout_created', 'claimed', 'confirmed', 'unclaimed'\)\)/,
    );
  });

  it("grants the service role full access", () => {
    expect(sql).toMatch(/grant all on paykit\.payment_audit to service_role/);
  });

  it("revokes UPDATE/DELETE from service_role, making it immutable from creation", () => {
    expect(sql).toMatch(
      /revoke update, delete on paykit\.payment_audit from service_role/,
    );
  });
});
