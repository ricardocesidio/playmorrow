import path from 'node:path';

import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Sentry integration added as part of elite audit (Observability section).
// DSN controlled via NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN.

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

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For the Sentry webpack plugin to work, we need to provide the auth token.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
