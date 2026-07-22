# profile

## Purpose

Vendor account profile page — stall/shop name, social links, profile icon,
display name, and sign-in password, each saved independently through the
channel that owns that data (shared `merqo.vendor_profile` for stall
name/social links vs. the Supabase auth user for icon/display
name/password). Built per the cross-kit
`Merqo Business/docs/business/2026-07-21-profile-settings-page-standard.md`.

## Contents

- `actions.ts` — `updateStallName(input)` and `updateSocialLinks(input)`
  server actions. Both call `getVendorSession()` (`@/lib/vendor-session`,
  paykit's own auth guard), validate with their Zod schema
  (`profileNameSchema`, `socialLinksSchema`), read the vendor's current
  shared profile via `getOrCreateVendorProfile`, then write the one changed
  field through `upsertVendorProfile` — both from
  `@/lib/merqo-vendor-profile`, which calls the shared `merqo.vendor_profile`
  table's RPC functions, never a raw cross-schema query. Both call
  `revalidatePath("/dashboard/profile")` on success. Display name, avatar,
  and password are explicitly **not** handled here — they live on the auth
  user and are set client-side via `supabase.auth.updateUser`.
- `page.tsx` — `ProfilePage()` (server, `revalidate = 0`): calls
  `getVendorSession()`, reads `display_name`/`avatar_url` defensively off
  `user.user_metadata`, and renders `ProfileForm` with the vendor's id,
  stall name, display name, email, avatar URL, and social links.
- `profile-form.tsx` — `ProfileForm({ vendorId, stallName, displayName,
email, avatarUrl, socialLinks })` client component with four
  independently-saved sections inside `Section` blocks (`@/components/
section`), laid out as two independent `flex flex-col gap-5` stacks side
  by side on `md`+ — never a CSS grid, whose row height would track the
  tallest cell in that row and desync the columns the moment "Social &
  website" outgrew "Stall/shop name". Column 1: stall/shop name
  (`profileNameSchema` → `updateStallName` server action), profile icon
  (`ImageUploader` → `supabase.auth.updateUser({ data: { avatar_url } })`),
  change password (`passwordChangeSchema` → `supabase.auth.updateUser({
password })`). Column 2: display name (`displayNameSchema` →
  `supabase.auth.updateUser({ data: { display_name } })`) above social
  links (`SocialLinksFields` + `socialLinksSchema` → `updateSocialLinks`
  server action); email is shown read-only.
- `actions.test.ts` — unit tests for `updateStallName`/`updateSocialLinks`:
  upserts with the new value while preserving the other field, rejects an
  empty stall name and an invalid social URL.
- `profile-form.dom.test.tsx` — jsdom tests for `ProfileForm`: renders the
  profile-icon upload widget, saves a changed stall name, blocks saving an
  emptied stall name, updates the display name via the browser auth client,
  rejects a mismatched password confirmation, saves social links through
  the server action.

## Connectivity

Reachable from `dashboard-nav.tsx`'s "Profile" link. `page.tsx` calls
`getVendorSession()` (`@/lib/vendor-session`) and renders `profile-form.tsx`,
which calls the server actions `updateStallName`/`updateSocialLinks` in
`actions.ts` for stall name/social links and the browser Supabase client
(`@/lib/supabase/client`) directly for avatar/display-name/password, all
validated against schemas in `@/lib/schemas`. The profile-icon upload goes
through `@/components/image-uploader`, which writes to the shared
`vendor-images` Storage bucket (project-wide, not paykit-local — see
`docs/DEPLOY.md`).
