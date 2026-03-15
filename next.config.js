/** @type {import('next').NextConfig} */
const nextConfig = {
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
