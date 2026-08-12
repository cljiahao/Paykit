# `POST /api/v1/checkout/{id}/unclaim`

Reverts a `claimed` transaction back to `pending` — undoes an accidental
"I've paid" tap. Same auth/shape family as the sibling `claim`/`confirm`
routes (`../claim/route.ts`, `../confirm/route.ts`): bearer-secret
(`verifyKitAuth`), path-param UUID validation, and the guarded-update-with-
recheck-fallback pattern.

Idempotent and provably safe: `unclaimTransition` (`src/lib/tx-state.ts`)
only transitions from `claimed`; a `confirmed` transaction is never
reverted, and the response just echoes the unchanged `confirmed` status
back so the caller can detect "too late to undo."

Response shape is the same `TransactionStatusResponse` `claim`/`confirm`
already return (`src/lib/api-schemas.ts`'s `toStatusResponse`).
