# specs

## Purpose

Design docs, one per feature, written and approved before the matching implementation plan in `../plans/`. Each states the problem, the locked decisions, and the scope boundary — kept as project history, not living docs.

## Contents

- `2026-07-15-paykit-mvp-design.md` — "paykit MVP — Design": extracts the already-proven PayNow QR + payment-confirmation logic that shipped inside qkit into paykit, the Merqo family's shared PayNow payment engine, with its own schema and a bearer-secret cross-kit HTTP API.
- `2026-07-22-paykit-freemium-nudge-redesign-design.md` — "paykit — Freemium Redesign: Nudge, Not Block — Design": replaces paykit's hard 100-transactions/month Free-tier checkout block (which contradicts the platform's own onboarding philosophy) with an unlimited Free tier plus a usage-triggered informational Pro nudge.
- `2026-07-22-paykit-multi-method-byo-design.md` — "paykit — Multi-Method BYO Payment Config — Design": adds a `pointer` payment-method kind (a vendor's own link/QR image — Stripe, GrabPay, HitPay, a photographed bank QR, etc.) alongside the existing `paynow` kind, porting the discriminated-union pattern qkit already solved.
- `2026-08-14-paykit-byo-preset-directory-design.md` — "paykit — BYO Payment Preset Directory — Design": replaces the `pointer` config's one generic text field with a curated preset picker (Stripe Payment Link, HitPay Payment Link, PayLah! QR, Other/Custom) plus tailored per-service instructions, closing a real onboarding-friction gap for first-time SG hawker/pop-up vendors. Free tier always; no PSP integration of any kind — UI/copy only.

Also relevant, kept outside this repo: `../../../docs/superpowers/specs/2026-08-13-paynow-tap-to-pay-design.md` (cross-kit, in the parent `Merqo Business/docs`) — the design behind `../plans/2026-08-13-payment-provider-seam.md`, covering the same-device QR UX fix (qkit-side) and this repo's pluggable `PaymentProvider` seam.

## Parent

[docs](../../README.md)
