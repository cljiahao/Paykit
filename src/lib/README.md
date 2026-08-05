# lib

## Purpose

Framework-agnostic logic: Zod schemas, DB/RPC access, pure transition
functions, and shared types. Two subfolders (`payments/`, `supabase/`) group
larger clusters; everything else sits flat here.

## Contents

- `types.ts` — hand-maintained DB types (`Transaction`, `VendorPaymentConfig`,
  `TxStatus`, `VendorPlan`, `PaymentConfigKind`, `SocialLinks`, …), kept in
  sync with `supabase/migrations/` by hand.
- `schemas.ts` — Zod input schemas for every form/action boundary:
  `vendorPaymentConfigInputSchema` (discriminated union over `kind`,
  paynow/pointer), `issueRefundInputSchema`, profile/password/social-links
  schemas, `feedbackSchema`, `supportMessageSchema` +
  `SUPPORT_CATEGORY_LABELS`.
- `api-schemas.ts` — Zod contracts for the `/api/v1/*` HTTP surface
  (request bodies, discriminated response shapes) plus the shared
  `uuidSchema` path-param validator.
- `tx-state.ts` — pure `claimTransition`/`confirmTransition`: the
  pending→claimed→confirmed state machine, idempotent by design (already-
  claimed/confirmed is a no-op success, never reverts a confirmed payment).
- `transactions.ts` — `listTransactions(vendorId)`: reads a vendor's
  transactions via the session-scoped Supabase client (RLS-filtered).
- `revenue-report.ts` — `aggregateRevenueByDay`: pure aggregation of
  confirmed transactions into per-day totals for the Stats page's chart.
- `usage.ts` — `shouldNudgePro`/`PRO_NUDGE_THRESHOLD`: friction-based
  Free→Pro nudge (not a hard cap — Free tier has no transaction-volume
  cap, see root `AGENTS.md`).
- `plan-view.ts` — `resolvePlanView(plan, countThisMonth)`/`PRO_PRICE`: pure
  view-model for the dashboard Plan page (feature list, transaction-count
  copy, `shouldNudgePro`-backed nudge visibility, upgrade-CTA visibility) —
  kept out of `plan/page.tsx`'s JSX so the free/pro branching is
  unit-testable without rendering that async server component.
- `kit-auth.ts` — `hashApiKey`/`verifyKitAuth`: bearer-secret verification
  for calling kits, checked on every `/api/v1/*` route before any DB access.
- `vendor-session.ts` — `getVendorSession()` (dashboard auth guard,
  redirects to `/login` on no session) and `getVendorPlan()`. Deliberately
  **not** used by Sheet-embedded server actions (`feedback.ts`,
  `support.ts` in `src/app/actions/`) — see that folder's README for why.
- `admin.ts` — `isAdmin(userId)` (presence of a row in `admins`, RLS-gated)
  and `requireAdmin()`: the `/admin` route/Server-Action gate, 404ing signed-
  out and non-admin callers alike so the route's existence is never revealed.
- `admin-data.ts` — `platformTotals()`, `recentActivity(limit)`,
  `listVendors()`: service-role, cross-vendor reads for the admin console
  (RLS-exempt by design — the console spans every vendor). Vendor identity
  is resolved to email via `listAllUsers()`, since `payee_name` is null for
  `kind='pointer'` config rows.
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
  `ImageResponse` needs concrete CSS colors.
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
- `utils.ts` — `cn()` (clsx + tailwind-merge) and shared form label/error
  Tailwind class constants.

## Connectivity

Consumed throughout `src/app/` (route handlers, Server Actions, dashboard
pages) and `src/components/`. `payments/` and `supabase/` are the two
subfolders with their own concerns — see their READMEs.

## Parent

[paykit](../../README.md)
