import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile shared workspace TS packages instead of expecting prebuilt JS.
  transpilePackages: ['@playmorrow/types'],
  typedRoutes: true,
  // Pin the monorepo root so Next ignores unrelated lockfiles elsewhere on disk.
  outputFileTracingRoot: path.join(process.cwd(), '..', '..'),
};

export default nextConfig;
