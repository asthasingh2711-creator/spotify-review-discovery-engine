import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle parent data/ with serverless API routes on Vercel (root directory = web).
  outputFileTracingIncludes: {
    "/api/**/*": ["../data/**/*"],
  },
};

export default nextConfig;
