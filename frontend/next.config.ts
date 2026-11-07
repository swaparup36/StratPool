import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@base-org/account'],
  // Without this, `next dev` behind a tunnel blocks its dev resources and the page never becomes interactive.
  allowedDevOrigins: process.env.APP_DOMAIN ? [process.env.APP_DOMAIN] : [],
};

export default nextConfig;
