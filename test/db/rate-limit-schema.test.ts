import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Cheap guard against silent drift in the hand-written 0012 migration —
// regex presence checks only, not a substitute for running it against real
// Postgres (see supabase/tests/rls.test.sql / CI's pgTAP `db` job for that).
const sql = readFileSync(
  fileURLToPath(
    new URL(
      "../../supabase/migrations/0012_paykit_rate_limit.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("0012_paykit_rate_limit.sql", () => {
  it("creates table paykit.rate_limits", () => {
    expect(sql).toMatch(/create table paykit\.rate_limits\b/);
  });

  it("enables row level security", () => {
    expect(sql).toMatch(
      /alter table paykit\.rate_limits\s+enable row level security/,
    );
  });

  it("indexes window_start for the cleanup sweep", () => {
    expect(sql).toMatch(
      /create index rate_limits_window_start_idx on paykit\.rate_limits/,
    );
  });

  it("defines check_rate_limit as SECURITY DEFINER with a pinned search_path", () => {
    expect(sql).toMatch(
      /create or replace function paykit\.check_rate_limit\(/,
    );
    expect(sql).toMatch(/security definer\s+set search_path = paykit/);
  });

  it("grants execute to service_role only (server-to-server surface, not client-callable)", () => {
    expect(sql).toMatch(
      /grant execute on function paykit\.check_rate_limit\(text, int, int\) to service_role;/,
    );
  });
});
