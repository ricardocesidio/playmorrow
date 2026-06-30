import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@playmorrow/types'],
  typedRoutes: true,
  outputFileTracingRoot: path.join(process.cwd(), '..', '..'),

  // Proxy API requests in dev to avoid cross-origin cookie issues
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
