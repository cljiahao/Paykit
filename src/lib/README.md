# lib

## Purpose

Framework-agnostic logic: Zod schemas, DB/RPC access, pure transition
functions, and shared types. Two subfolders (`payments/`, `supabase/`) group
larger clusters; everything else sits flat here.

## Contents

- `types.ts` — hand-maintained DB types (`Transaction`, `VendorPaymentConfig`,
  `TxStatus`, `VendorPlan`, `PaymentConfigKind`, `Booking`, `BookingStatus`,
  `SocialLinks`, `AuthFailure`, …), kept in sync with `supabase/migrations/`
  by hand. Also carries a hand-written `rate_limits` table type (the table
  existed since `0012` but had no generated-type entry until now, needed to
  query it from `admin-data.ts`'s `securityStats()`).
- `schemas.ts` — Zod input schemas for every form/action boundary:
  `vendorPaymentConfigInputSchema` (discriminated union over `kind`,
  paynow/pointer), `issueRefundInputSchema`, `createBookingInputSchema`
  (deposit + balance must add up to the total; balance due date must be on
  or before the event date), `cancelBookingInputSchema` (optional refund
  transaction id + amount, both-or-neither), `createBalanceCheckoutInputSchema`,
  `rescheduleBookingInputSchema` (same balance-due-before-event-date rule as
  `createBookingInputSchema`), profile/password/social-links
  schemas, `feedbackSchema`, `supportMessageSchema` +
  `SUPPORT_CATEGORY_LABELS`.
- `api-schemas.ts` — Zod contracts for the `/api/v1/*` HTTP surface
  (request bodies, discriminated response shapes) plus the shared
  `uuidSchema` path-param validator, including
  `bookingStatusResponseSchema` for `GET /api/v1/bookings/{id}`.
- `tx-state.ts` — pure `claimTransition`/`unclaimTransition`/
  `confirmTransition`: the pending→claimed→confirmed state machine, plus
  the claimed→pending undo. All three are idempotent by design (a no-op
  success on states they don't apply to); `unclaimTransition` only ever
  reverts `claimed`, so a `confirmed` payment can never be un-confirmed.
- `transactions.ts` — `listTransactions(vendorId)`/`getTransaction(vendorId,
id)`: read a vendor's transactions (or one, by id) via the session-scoped
  Supabase client (RLS-filtered).
- `checkout.ts` — `createCheckout({vendorId, kitSlug, orderRef,
amountCents})`: the one `transactions`-insert-plus-render-the-checkout-view
  path, extracted out of `POST /api/v1/checkout`'s route handler so the
  dashboard's own booking deposit/balance actions
  (`dashboard/bookings/actions.ts`, `kitSlug: "paykit"`) can call it directly
  instead of going back through HTTP. Same idempotency (unique-constraint
  retry re-read) and error handling either caller gets.
- `payment-audit.ts` — `recordPaymentAudit(supabase, transactionId, kitSlug,
action, detail?)`: appends one immutable `payment_audit` row
  (`checkout_created`/`claimed`/`confirmed`/`unclaimed`) — called from
  `checkout.ts` and the claim/confirm/unclaim route handlers only on a real
  state transition, never on a no-op/idempotent request. Takes the caller's
  own already-created service-role client rather than creating its own
  (unlike `admin/actions.ts`'s `recordAudit`), since every call site here
  already has one in scope.
- `bookings.ts` — `listBookings(vendorId)`/`getBooking(vendorId, id)`: read
  a vendor's bookings via the session-scoped Supabase client, same shape as
  `transactions.ts`.
- `booking-status.ts` — `balanceDueBadge(status, balanceDueDate, now?)`:
  pure — only ever non-null once a booking is `deposit_paid`, returning a
  `{label, urgency: "due-soon"|"overdue"}` once the balance is within 14
  days of due or already past it. This is the whole V1 "reminder" — no
  cron/notification infra exists in this repo (see `AGENTS.md`), so it's a
  dashboard badge computed at render time, not a push.
- `revenue-report.ts` — `aggregateRevenueByDay`: pure aggregation of
  confirmed transactions into per-day totals + counts (`DailyRevenue`:
  `{date, cents, count}`) for the Stats page's chart and its stat-tile row.
- `earnings-report.ts` — `buildEarningsReport(transactions, bookings,
year)`: pure, accrual-aware yearly revenue for the Earnings report page —
  tags each confirmed transaction by its linked booking's `event_date` (not
  its own `created_at`), falls back to `created_at` for a transaction with
  no linked booking rather than dropping it, and collapses a booking's
  deposit + balance transactions into one line.
- `earnings-csv.ts` — `earningsReportToCsv`: CSV serialization for the
  above, escaping a leading `=`/`+`/`-`/`@` (CSV formula injection) on
  `customer_name` — real vendor-entered text, not app-generated, the one
  field in the report that needs it.
- `usage.ts` — `shouldNudgePro`/`PRO_NUDGE_THRESHOLD`: friction-based
  Free→Pro nudge (not a hard cap — Free tier has no transaction-volume
  cap, see root `AGENTS.md`).
- `plan-view.ts` — `resolvePlanView(plan, countThisMonth, monthlyCents)`:
  pure view-model for the dashboard Plan page (feature list — revenue
  stats free for everyone, refund tracking Pro-only — transaction-count
  copy, `shouldNudgePro`-backed nudge visibility, upgrade-CTA visibility,
  and `proPriceLabel` formatted from the live `monthlyCents`) — kept out of
  `plan/page.tsx`'s JSX so the free/pro branching is unit-testable without
  rendering that async server component.
- `pricing.ts` — `PricingConfig`, `DEFAULT_PRICING` (zeroed fallback), and
  `getPricing(supabase)`: the one shared read of the single admin-tunable
  `pricing` row (`id = 1`), reused by the admin console, both dashboard
  pages, and the landing page. Accepts either the cookie client (public-read
  policy) or the service-role client (admin read) — both are structurally
  the same generated client type.
- `kit-auth.ts` — `hashApiKey`/`verifyKitAuth`: bearer-secret verification
  for calling kits, checked on every `/api/v1/*` route before any DB access.
  Every failure mode (missing/malformed header, unknown `kit_slug`, secret
  mismatch) logs a warning with the `kit_slug` when resolvable — never the
  secret itself, real risk was zero visibility into a probing/brute-force
  pattern — and now also appends a best-effort `auth_failures` row (same
  reason string, plus the caller's IP via `rate-limit.ts`'s `clientIp`) so
  that history is durable, not just console output. A successful auth also
  touches `kit_api_keys.last_used_at` (best-effort, never blocking) — see
  `docs/SECRET_ROTATION.md` for how that's used.
- `rate-limit.ts` — `clientIp`/`rateLimit`: DB-backed fixed-window limiter,
  ported from qkit's own `src/lib/rate-limit.ts`. Every `/api/v1/checkout*`
  route calls it right after auth, keyed by `${action}:${kitSlug}:${ip}` —
  fails open on limiter errors (an infra hiccup never blocks a real calling
  kit). `PER_ROUTE_LIMIT`/`PER_ROUTE_WINDOW_SECONDS` (60 req/60s) are the
  one shared constant every route call site passes, and what
  `admin-data.ts`'s `securityStats()` checks `rate_limits.count` against.
- `vendor-health.ts` — `vendorStatus`/`buildVendorHealth`/`statusRank`: pure
  per-vendor triage classification (`attention`/`stuck`/`quiet`/`new`/
  `healthy`, first-match-wins, most-urgent first), adapted from qkit's own
  `admin-vendor-health.ts` status vocabulary/rank convention to paykit's own
  signals — a refund-rate anomaly in the trailing 30 days (≥3 refunds, or a
  refund/confirmed ratio over 20% once there's a ≥5-transaction sample),
  whether a payment config has ever produced a confirmed transaction, and
  confirmed-transaction recency. No DB access, no clock reads — takes
  rolled-up `VendorLite`/`TransactionLite`/`RefundLite` rows plus `nowMs`.
  Backs the admin Vendors table's status column and sort order.
- `tour-prefs.ts` — `stampTourSeen(supabase, vendorId)`: upserts
  `vendor_prefs.tour_seen_at = now()`. A plain (non-`"use server"`) module
  so `src/app/dashboard/page.tsx` can call it directly during its own
  server render — the durable half of the onboarding-tour "stamp on
  start" fix, since the client-fired path
  (`src/app/dashboard/tour-actions.ts`'s `markTourSeen`, which also
  delegates here) is fire-and-forget and can be aborted by a hard
  navigation before it lands.
- `vendor-session.ts` — `getVendorSession()` (dashboard auth guard,
  redirects to `/login` on no session) and `getVendorPlan()`. Deliberately
  **not** used by Sheet-embedded server actions (`feedback.ts`,
  `support.ts` in `src/app/actions/`) — see that folder's README for why.
- `admin.ts` — `isAdmin(userId)` (presence of a row in `admins`, RLS-gated)
  and `requireAdmin()`: the `/admin` route/Server-Action gate, 404ing signed-
  out and non-admin callers alike so the route's existence is never revealed.
- `admin-data.ts` — `platformTotals()`, `recentActivity(limit)`,
  `listVendors()`, `getAdminPricing()`, `auditLog(limit)`, `securityStats()`:
  service-role, cross-vendor reads for the admin console (RLS-exempt by
  design — the console spans every vendor). Vendor/admin identity is
  resolved to email via `listAllUsers()`, since `payee_name` is null for
  `kind='pointer'` config rows (and `admin_audit.admin_id` is any
  `auth.users` id, not necessarily an `admins` member). `getAdminPricing` is
  a thin `getPricing` (`@/lib/pricing`) call against a fresh service-role
  client. `platformTotals` now also reads `refunds` for trailing-30-day
  refund count/volume, and reports windowed confirmed-transaction/-volume
  figures (7d and 30d, each with its prior-period counterpart for a
  `pctChange` delta). `listVendors` now rolls `vendor-health.ts`'s
  `buildVendorHealth` over `vendor_payment_config`/`transactions`/`refunds`
  to attach each row's triage `status`, sorted most-urgent first
  (`statusRank`), ties keeping the newest signup on top.
  `securityStats()` reads `auth_failures` (count in the trailing 24h) and
  `rate_limits` (distinct `kit_slug`s — parsed from the `key` column's
  `${route}:${kitSlug}:${ip}` shape — with a window at or above
  `rate-limit.ts`'s `PER_ROUTE_LIMIT` in the trailing 24h).
- `list-all-users.ts` — `listAllUsers(supabase)`: paginates
  `supabase.auth.admin.listUsers()` (1000/page, capped at 50 pages) so a
  lookup doesn't silently drop vendors past the first 1000 auth users. Ported
  from loopkit's identically-named helper; also used by
  `/api/merqo/vendor-status`, replacing that route's old page-1-only
  `merqo-auth.ts#listAllAuthUsers` (removed).
- `merqo-rpc.ts` — `callMerqoRpc<FnName, Args, Returns>(supabase, fnName,
args)`: the shared generic-over-caller's-`Db`/`SchemaName` cast +
  `.schema("merqo").rpc(fnName, args)` call + thrown-`Error`-on-failure
  body that `merqo-vendor-profile.ts`, `merqo-support.ts`, and
  `merqo-vendor-feedback.ts` all delegate to, so that pattern is written
  once instead of hand-copied per RPC.
- `merqo-vendor-profile.ts` — `getOrCreateVendorProfile`/
  `upsertVendorProfile`, each a thin `callMerqoRpc` call with its own Zod-
  adjacent Args/Returns types, for the shared `merqo.vendor_profile` table
  (stall name, social links) — get/upsert via `merqo`'s `SECURITY DEFINER`
  functions, never a direct cross-schema table query.
- `merqo-auth.ts` — `bearerOk`/`provisionBearerOk` (constant-time bearer-secret
  checks against `MERQO_METRICS_SECRET`/`MERQO_PROVISION_SECRET` respectively),
  for the `/api/merqo/*` routes merqo hub calls directly — a separate auth
  mechanism from `kit-auth.ts`'s `verifyKitAuth` (which is for peer-kit-to-kit
  calls like checkout verification, keyed by `kit_api_keys`).
- `merqo-support.ts` — `submitSupportMessage`, a thin `callMerqoRpc` call
  for `merqo.submit_support_message` (the shared cross-kit Get-help inbox,
  `kit_slug: "paykit"`).
- `merqo-vendor-feedback.ts` — `submitVendorFeedback`, a thin `callMerqoRpc`
  call for `merqo.submit_vendor_feedback` (the shared cross-kit NPS/feedback
  channel, `p_kit_slug: "paykit"`).
- `merqo-vendor-status.ts` — `resolveVendorStatus(email, authUsers,
configs)`: pure two-step lookup (email → auth user → that user's
  `vendor_payment_config`) since `vendor_payment_config` has no email
  column. Ported from qkit's identically-named function. Backs
  `GET /api/merqo/vendor-status`.
- `brand-icon.tsx` — `brandIcon(size)` + `BRAND_MINT`/`BRAND_INK`: the
  paykit "P" mark as a `ReactElement` for `ImageResponse`-generated icons
  (favicon, apple-touch) — hex literals, not theme tokens, since
  `ImageResponse` needs concrete CSS colors. Tracks the "Banknote
  Engrave" theme (as of 2026-08-19) via the dark theme's brighter
  primary, so the dark-ink text on top stays legible.
- `action-result.ts` — `ActionResult<T>`: the discriminated
  `{success:true,...T} | {success:false,error}` shape every Server Action
  returns.
- `env.ts` — `publicEnv`: required-env-var accessors that throw at import
  time if unset, instead of silently reading `undefined`.
- `image-resize.ts` — `resizeToWebp`: client-side (Canvas, browser-only)
  resize + WebP encode before upload; passed as `@merqo/ui`'s
  `ImageUploader`'s `resizeImage` prop.
- `image-upload-adapter.ts` — `uploadPaykitImage`: paykit's `onUpload`
  adapter for `@merqo/ui`'s `ImageUploader` (2026-08-05 `@merqo/ui`
  migration) — takes the `{bucket, path, blob, contentType}` payload
  `ImageUploader` builds internally, writes it via the browser Supabase
  client's Storage API, and returns the public URL. Used at both call
  sites: `dashboard/profile/profile-form.tsx` (avatar) and
  `dashboard/config/payment-config-form.tsx` (BYO QR image).
- `metrics.ts` — `computePaykitMetrics(input)`: pure, maps
  `vendor_payment_config`/`transactions` onto merqo hub's qkit-shaped
  `/api/merqo/metrics` payload. Field mapping: `total`/`pro_vendors` ←
  `vendor_payment_config` row count / `plan = 'pro'`; `revenue_cents_30d/all`
  ← confirmed transactions only; `gmv_cents_30d` ← every transaction
  regardless of status (paykit has no `'cancelled'` status to exclude, unlike
  qkit's orders); `orders_7d`/`orders_prev_7d` ← raw transaction count per
  window; `funnel.with_booth` equals `funnel.signed_up` — a
  `vendor_payment_config` row only ever exists once a vendor has configured
  a payment method, so paykit has no separate "signed up but not configured"
  state to track; `pending_upgrade_requests` is always `0` since paykit has
  no local upgrade-requests table (`src/app/actions/plan.ts` routes an
  upgrade ask into `merqo.support_messages` instead, a cross-schema table
  this kit's own service client can't query directly). Locally re-declares
  merqo's `MetricsPayload` type (verified against the real thing by
  `test/contract/merqo-metrics.contract.test.ts` — cross-repo runtime
  imports aren't available).
- `utils.ts` — `cn()` (clsx + tailwind-merge), shared form label/error
  Tailwind class constants, `formatCents()` (integer cents -> SGD currency
  string), `formatDate()` (a `date`-column "YYYY-MM-DD" string -> display
  date, parsed/formatted with an explicit UTC anchor so it never shifts by
  a day depending on the server's runtime timezone), `MS_PER_HOUR`/
  `MS_PER_DAY` (rolling-window stats cutoffs, ported from qkit's own
  `utils.ts`), and `pctChange(current, prior)` (period-over-period percent
  change, null when there's no prior period — backs the Overview page's new
  `StatTile` deltas).

## Connectivity

Consumed throughout `src/app/` (route handlers, Server Actions, dashboard
pages) and `src/components/`. `payments/` and `supabase/` are the two
subfolders with their own concerns — see their READMEs.

## Parent

[paykit](../../README.md)
