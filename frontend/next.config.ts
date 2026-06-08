import type { NextConfig } from "next";

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

export default nextConfig;
