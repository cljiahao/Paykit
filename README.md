# paykit

The Merqo family's shared PayNow payment engine. A vendor sets up their
PayNow config once here; any Merqo kit can then request a QR + track payment
status for that vendor over paykit's HTTP API. paykit never touches funds —
it renders a QR the customer scans in their own bank app, and a human
confirms receipt.

See `AGENTS.md` for stack, commands, data model, and rules. See
`docs/superpowers/specs/2026-07-15-paykit-mvp-design.md` for the approved
design and `docs/superpowers/plans/2026-07-15-paykit-mvp.md` for the
implementation plan.
