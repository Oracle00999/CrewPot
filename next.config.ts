import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  webpack(config, { isServer }) {
    // Anchor includes a Node-only wallet loader in its browser distribution.
    // Browser signing always uses wallet-adapter; filesystem loading is disabled.
    if (!isServer)
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};
export default config;
