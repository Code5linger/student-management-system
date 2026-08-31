import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Raising Server Action Payload Limit from default 1MB to 10MB to accommodate larger assignment files.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
