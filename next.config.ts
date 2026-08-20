import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Sanity's image CDN — required for next/image to serve asset URLs.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
};

export default nextConfig;
