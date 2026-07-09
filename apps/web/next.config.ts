import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@playmorrow/types'],
  typedRoutes: true,
  outputFileTracingRoot: path.join(process.cwd(), '..', '..'),
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Proxy API requests to backend to avoid cross-origin cookie issues
  async rewrites() {
    const apiDest = process.env.API_URL || (
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:4000/api'
        : 'https://playmorrow-api-production.up.railway.app/api'
    );
    return [
      {
        source: '/api/:path*',
        destination: `${apiDest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
