import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Cheap guard against silent drift in the hand-written 0014 migration —
// regex presence checks only, not a substitute for running it against real
// Postgres (see supabase/tests/rls.test.sql / CI's pgTAP `db` job for that).
const sql = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/0014_paykit_auth_failures.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("0014_paykit_auth_failures.sql", () => {
  it("creates table paykit.auth_failures", () => {
    expect(sql).toMatch(/create table paykit\.auth_failures\b/);
  });

  it("kit_slug and ip are nullable — an unknown/malformed attempt has neither", () => {
    expect(sql).not.toMatch(/kit_slug\s+text\s+not null/);
    expect(sql).not.toMatch(/ip\s+text\s+not null/);
  });

  it("reason is required", () => {
    expect(sql).toMatch(/reason\s+text\s+not null/);
  });

  it("enables row level security", () => {
    expect(sql).toMatch(
      /alter table paykit\.auth_failures\s+enable row level security/,
    );
  });

  it("grants only select/insert to service_role — immutable from creation, no update/delete ever granted", () => {
    expect(sql).toMatch(
      /grant select, insert on paykit\.auth_failures to service_role/,
    );
    expect(sql).not.toMatch(/grant all on paykit\.auth_failures/);
    expect(sql).not.toMatch(
      /update.*on paykit\.auth_failures.*to service_role/,
    );
  });
});
