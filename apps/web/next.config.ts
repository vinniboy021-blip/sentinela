import type { NextConfig } from 'next';

// Security headers are set dynamically (with per-request CSP nonce) by middleware.ts.
// next.config.ts headers() runs at build time and cannot generate nonces, so it is
// intentionally left empty here. All security headers are emitted by the middleware.

const config: NextConfig = {
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL ?? 'http://localhost:8001'}/api/:path*`,
      },
    ];
  },
};

export default config;
