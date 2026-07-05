import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is copied into web/data before build (see scripts/sync-data.mjs).
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*"],
  },
};

export default nextConfig;
