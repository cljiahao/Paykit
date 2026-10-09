# supabase/tests/isolation

refund-concurrency.spec is a PostgreSQL isolation-test specification for competing refund writes against one transaction. It requires a disposable migrated database and the PostgreSQL isolation runner; it is not a pgTAP file and is not executed by the Vitest suite or ordinary supabase test db command. Do not run fixture setup against production.
