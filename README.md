# paykit

The Merqo family's shared payment engine. A vendor sets up their payment
method once here — a generated PayNow QR, or their own BYO payment
link/QR image — and any Merqo kit can then request a checkout + track
payment status for that vendor over paykit's HTTP API. paykit never
touches funds — it renders the checkout the customer pays through in
their own bank/payment app, and a human confirms receipt.

See `AGENTS.md` for stack, commands, data model, and rules; `CHANGELOG.md`
for what's shipped since the MVP. Folder-level `README.md`s (`src/lib/`,
`src/components/`, and their subfolders) cover what each module does and
how it's wired together. See
`docs/superpowers/specs/2026-07-15-paykit-mvp-design.md` for the original
approved design and `docs/superpowers/plans/2026-07-15-paykit-mvp.md` for
its implementation plan — later work has its own dated specs/plans under
the same `docs/superpowers/` folders.
