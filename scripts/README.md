# scripts

create-kit-key.mjs creates a calling-kit bearer key and stores its hash. Existing kit names fail closed unless rotation is explicitly requested. Use the secret rotation runbook for the operational cutover; tests replace randomness and database calls without loading deployment secrets.
