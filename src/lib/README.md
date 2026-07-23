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
- `kit-auth.ts` — `hashApiKey`/`verifyKitAuth`: bearer-secret verification
  for calling kits, checked on every `/api/v1/*` route before any DB access.
- `vendor-session.ts` — `getVendorSession()` (dashboard auth guard,
  redirects to `/login` on no session) and `getVendorPlan()`. Deliberately
  **not** used by Sheet-embedded server actions (`feedback.ts`,
  `support.ts` in `src/app/actions/`) — see that folder's README for why.
- `merqo-vendor-profile.ts` — generic-over-caller's-`Db`/`SchemaName` RPC
  wrapper for the shared `merqo.vendor_profile` table (stall name, social
  links) — get/upsert via `merqo`'s `SECURITY DEFINER` functions, never a
  direct cross-schema table query.
- `merqo-support.ts` — same generic-RPC-wrapper pattern as
  `merqo-vendor-profile.ts`, for `merqo.submit_support_message` (the
  shared cross-kit Get-help inbox, `kit_slug: "paykit"`).
- `brand-icon.tsx` — `brandIcon(size)` + `BRAND_MINT`/`BRAND_INK`: the
  paykit "P" mark as a `ReactElement` for `ImageResponse`-generated icons
  (favicon, apple-touch) — hex literals, not theme tokens, since
  `ImageResponse` needs concrete CSS colors.
- `action-result.ts` — `ActionResult<T>`: the discriminated
  `{success:true,...T} | {success:false,error}` shape every Server Action
  returns.
- `env.ts` — `publicEnv`: required-env-var accessors that throw at import
  time if unset, instead of silently reading `undefined`.
- `image-resize.ts` — client-side (Canvas, browser-only) resize + WebP
  encode before upload; used by `ImageUploader`.
- `utils.ts` — `cn()` (clsx + tailwind-merge) and shared form label/error
  Tailwind class constants.

## Connectivity

Consumed throughout `src/app/` (route handlers, Server Actions, dashboard
pages) and `src/components/`. `payments/` and `supabase/` are the two
subfolders with their own concerns — see their READMEs.

## Parent

[paykit](../../README.md)
