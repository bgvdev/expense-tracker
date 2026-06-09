// Sentry init for the browser. Inert when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Lets Sentry trace client-side navigations in the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
