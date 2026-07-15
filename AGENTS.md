<!-- templateCentral: nextjs (Supabase variant — shared project, schema per kit) -->

# AGENTS.md — paykit

> STOP — This project diverges from the stock templateCentral Next.js stack on
> the data layer only. Auth/DB/realtime are **Supabase** (`@supabase/ssr`), not
> better-auth + Drizzle. Authorization is enforced in Postgres via **RLS**, not
> an app repository layer. Runtime matches tc: Next 16, route protection in
> `src/proxy.ts`, and `cookies()`/`headers()`/`params`/`searchParams` are async.

## What paykit is

The Merqo family's shared PayNow payment engine. A standalone kit; owns the
`paykit` schema in the shared Supabase project; any other kit requests a
PayNow QR + tracks payment status over paykit's bearer-secret HTTP API
(`/api/v1/*`). paykit never touches funds — it renders a QR the customer
scans in their own bank app and tracks a status a human confirms. No other
kit calls paykit yet in this scope; qkit's own local payment code
(`booths.payment`, `claimPayment`/`confirmPayment`) is untouched and stays
that way until a later, separate cutover spec.

## Stack

Next.js 16 · App Router · Turbopack · TypeScript strict · Tailwind v4 · shadcn/ui
(new-york) · Zod · Supabase (`@supabase/ssr`) · Vitest · pnpm 11 · Node ≥24 ·
deploy target: Vercel

## Commands

```bash
pnpm dev          # dev server — http://localhost:3000
pnpm build        # production build
pnpm test         # run test suite (vitest)
pnpm test:mutation # stryker mutation testing (scoped to src/lib; advisory)
pnpm check        # prettier --check + eslint + tsc --noEmit
pnpm format       # prettier --write
```

No `test:e2e` — this kit's testing surface (per its design spec) is Unit
(mutation-tested `src/lib`), a Contract test on the HTTP API surface, RLS
(pgTAP), and DOM. No Playwright suite exists.

## File Layout

```
src/app/                          — app router (dashboard, login, API routes)
src/app/api/v1/checkout/          — POST /api/v1/checkout, GET/POST /api/v1/checkout/{id}[/claim|/confirm]
src/app/api/v1/vendors/           — GET /api/v1/vendors/{vendor_id}/config
src/app/dashboard/                — vendor dashboard (config, transactions, reports)
src/proxy.ts                      — Supabase session refresh + /dashboard guard (Next 16)
src/lib/supabase/                 — browser / server / service clients + mw helper (schema=paykit)
src/lib/payments/paynow.ts        — EMVCo PayNow QR builder (ported verbatim from qkit)
src/lib/payments/adapter.ts       — PaymentAdapter (paynow) + reserved-but-dark auto-verify stub
src/lib/tx-state.ts               — pure pending→claimed→confirmed transition logic
src/lib/kit-auth.ts               — bearer-secret verification for calling kits
src/lib/schemas.ts                — Zod: vendor PayNow config write schema
src/lib/api-schemas.ts            — Zod: HTTP API request/response contracts + shared uuidSchema path-param validator
src/lib/vendor-session.ts         — shared dashboard auth guard (getVendorSession) + plan lookup (getVendorPlan)
src/lib/types.ts                  — DB types (mirror of supabase/migrations)
scripts/create-kit-key.mjs        — mint + store a hashed bearer secret for a calling kit
supabase/migrations/              — SQL schema + RLS + grants
supabase/tests/rls.test.sql       — pgTAP RLS suite
test/contract/                    — HTTP API contract test (mirrors merqo's qkit-metrics precedent)
```

## Data model

- `vendor_payment_config` (PK `vendor_id`): one PayNow config per vendor,
  reused across every kit/booth/store that vendor runs. Exactly one of
  `uen`/`mobile`. `plan` (`free`|`pro`) gates the 100 tx/mo cap and Pro
  features (reports, refunds) — this column is a minimal addition beyond the
  design spec's literal table listing, necessary to implement the very
  Pro-gate the same spec describes (see the plan's Self-Review).
  `verification_method` is schema-reserved (`'manual'` only is ever written).
- `transactions`: one row per checkout, `status` `pending`→`claimed`→`confirmed`,
  `kit_slug` records which kit created it, `qr_payload` stored at creation for
  replay/audit.
- `refunds` (Pro only): bookkeeping ledger row against a `confirmed`
  transaction — no real money movement.
- `kit_api_keys`: one hashed bearer secret per calling kit, service-role only
  (no RLS policy grants any access to `authenticated`/`anon`).
- RLS: a vendor reads/writes only their own `vendor_payment_config`; reads
  (not writes) only their own `transactions`; reads/inserts `refunds` only for
  their own confirmed transactions while on Pro. The cross-kit API
  (`/checkout`, `/claim`, `/confirm`) is service-role + bearer-secret,
  server-only.

## Rules (always)

- TypeScript strict — no `any`, no `@ts-ignore`.
- Validate all user input with Zod at every boundary (forms + server actions + API routes).
- Authorization lives in **RLS policies**, not in app code. Never widen a policy
  to "fix" a query — fix the query or the session instead.
- Use the **service-role client only** in Server Actions / Route Handlers, never
  in client components. It bypasses RLS.
- No secrets in `NEXT_PUBLIC_*`. `NEXT_PUBLIC_SUPABASE_*` are inlined at build —
  rebuild after changing them.
- `@supabase/ssr` and `@supabase/supabase-js` versions must stay compatible
  (currently ssr 0.10.x ↔ supabase-js 2.48.x — check package.json, not this
  number) or every query degrades to `never`.
- Every `/api/v1/*` route verifies the caller's bearer secret via
  `verifyKitAuth` before touching the database — never trust an unauthenticated
  `vendor_id` in a request body.
- paykit never touches funds. Do not add a payment-provider SDK, a webhook
  that moves money, or a real auto-verify integration.
- After editing the schema, update both `supabase/migrations/` and
  `src/lib/types.ts`.

## Skills

### Project skills — check here first (`.claude/skills/`)

| Skill               | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `/next-verify`      | typecheck + lint + test in one pass                          |
| `/supabase-migrate` | apply `supabase/migrations` + regenerate types (safety gate) |

### templateCentral plugin skills

templateCentral has **no Supabase support** (auth=better-auth, db=Drizzle/Kysely/Mongoose,
no realtime). Use only the stack-agnostic ones here:

| Skill                       | When to use                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `templatecentral:standards` | naming/validation/drift-check (expect Supabase-vs-tc drift findings) |

Do **not** run `templatecentral:add (auth)` or `(database)` — they install
better-auth / Drizzle and will break RLS.

## AI Harness

PreToolUse: blocks secret files (exit 2): `.env*` (except `.env.example`),
cert files (`.pem`/`.key`/`.p12`/`.pfx`/`.secret`), `credentials.json`/`.netrc`/`.secrets`;
and blocks `--no-verify`. App code, skills, specs, and `.github/workflows/`
unrestricted.
UserPromptSubmit: pattern-checks prompts for injection phrases; exit 2 blocks.
PostToolUse: `tsc --noEmit --incremental` after every Edit/Write. Feedback-only.
Stop: exits 0 when `stop_hook_active` (no re-entry loop); else runs the test
suite, exit 2 feeds failures back, exit 0 on pass.
SessionStart (startup|resume|compact): re-injects first 30 lines of this file.
`permissions`: max-privilege — bare-tool `allow` (Bash/Read/Edit/Write/web/Skill/
Task) so common work doesn't prompt; `deny` covers secret reads/edits (`.env.local`
and other `.env.<env>` variants, `./secrets/**` — `.env.example` is the one
whitelisted env file) and irreversible ops (`rm -rf`, `git push --force`/`-f`,
`git reset --hard`, `git clean -fd/-fx`, `git filter-branch`, ref-delete). Deny
always wins (enforced even under bypass); it's a guardrail, not a sandbox.
RLS isolation: `supabase/tests/rls.test.sql` via `supabase test db`.
Project skills (directory form, `<name>/SKILL.md`): `.claude/skills/` |
Manifest: `.claude/harness.json`

## Skills Security

- Review `SKILL.md` before installing any third-party skill — treat skills like packages.
- Scope `allowed-tools:` to the minimum (e.g. `Bash(git *)` not `Bash`).
- Never install skills that hardcode secrets or make unlisted outbound calls.

## Project-Specific Notes

- This repo is a fresh harness seeded from the sibling project `qkit` (same
  templateCentral Supabase variant, same shared Supabase project, different
  schema) — same seeding precedent loopkit used. The EMVCo PayNow QR builder
  (`src/lib/payments/paynow.ts`) is ported **verbatim** from qkit; it originated
  in qkit's own
  `docs/superpowers/specs/2026-06-28-qkit-payments-seam-design.md`.
- Design: `docs/superpowers/specs/2026-07-15-paykit-mvp-design.md`. Plan of
  record: `docs/superpowers/plans/2026-07-15-paykit-mvp.md`.
- Cutting qkit (or any other kit) over to actually call paykit is a separate,
  later spec — not started here.

<!-- [[post-harness]] — reserved for trace capture and meta-harness integration -->
