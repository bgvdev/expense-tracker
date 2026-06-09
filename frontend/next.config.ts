import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://expense-tracker-funw.onrender.com";

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
