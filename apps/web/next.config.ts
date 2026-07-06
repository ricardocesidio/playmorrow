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

  // Proxy API requests to backend (keeps cookies same-origin)
  async rewrites() {
    const apiUrl = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
