-- Secret-rotation hygiene: kit_api_keys had no way to tell whether a
-- given secret is actually in active use — an operator rotating a kit's
-- bearer secret had no signal to confirm the new one was picked up, or
-- that a stale/never-deployed row is safe to clean up. Nullable (a
-- freshly-minted key that's never been used yet is a real, valid state,
-- not an error).
alter table paykit.kit_api_keys add column last_used_at timestamptz;
