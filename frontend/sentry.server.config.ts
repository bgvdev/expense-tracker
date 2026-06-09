// Sentry init for the Node.js server runtime.
// Inert when NEXT_PUBLIC_SENTRY_DSN is unset (local dev stays quiet).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
