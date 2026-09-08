/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enables instrumentation.ts so the mindshare refresh scheduler can start
    // once when the Node server boots (Next 15+ enables this by default).
    instrumentationHook: true,
    // rettiwt-api pulls in linkedom (ESM-only internals) — keep it a real
    // Node `require` at runtime instead of letting webpack try to bundle it.
    serverComponentsExternalPackages: ["rettiwt-api"],
  },
  webpack: (config) => {
    // Required for Solana wallet adapters
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;
