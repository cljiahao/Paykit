# Paykit component reuse cleanup

## Confirmed scope

Latest main confirmation found two identical dollar-to-cent converters, three repeated statistic tiles, two identical radio option shells, inline brand markup already represented by Wordmark, an unused navigatingAway re-export, and six unused generated primitives. Consolidate the converters into a pure local helper without changing Number/rounding behavior or boundary validation. Use shared StatTile inside the existing card and preserve label-first order, typography and spacing. Extract a route-local radio option shell preserving label associations and disabled/focus behavior. Remove only unused complete primitives after source/test graph confirmation. Correct stale comments and adjacent README mappings with each change.

## Intentional exclusions

Keep payment-provider future contracts, private auth/data adapters, dynamic async-handler adapter, independent profile persistence, and all payment/storage semantics. No schema/governance edits, mass feature-folder migration, new library or product policy changes.

## Acceptance

Booking/refund actions retain Zod/RLS behavior, exact integer-cent conversion and failure contracts. Radio cards retain input names, selected values and image cleanup behavior. Existing DOM/action tests plus meaningful conversion edge cases pass. Run normal check/full coverage (all four metrics >=80%), production dependency audit and redacted secret scans. Independent finished-diff review and green required CI precede merge.
