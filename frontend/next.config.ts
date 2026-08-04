import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// rewrites() is evaluated at BUILD time and baked into routes-manifest.json, so
// BACKEND_URL must be supplied as a build arg — a runtime env var arrives too late.
//
// There is deliberately no production URL fallback here. A previous default of
// https://expense-tracker-funw.onrender.com meant `npm run dev` without
// BACKEND_URL silently proxied every /api/* call — including auth/register — to
// the live production backend.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

if (!process.env.BACKEND_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "BACKEND_URL must be set for a production build — it is baked into the /api/* rewrite at build time."
  );
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

// Source-map upload runs only when SENTRY_AUTH_TOKEN + org/project are present
// (i.e. in CI/Vercel). Builds without them succeed with maps upload skipped.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
