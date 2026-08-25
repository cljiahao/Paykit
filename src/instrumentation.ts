import * as Sentry from "@sentry/nextjs";

// Activates only when SENTRY_DSN is set — the SDK no-ops (initializes but
// sends nothing) when dsn is undefined, so this is safe to leave unset in
// dev/preview, same fallback shape as PAYKIT_PROVIDER (see .env.example).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
