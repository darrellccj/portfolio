import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Sanity's image CDN — required for next/image to serve asset URLs.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  // October 2026 restructure (docs/direction.md): Work and KIV became one
  // Projects list. KIV items keep their slugs when migrated, so both old
  // URL shapes land on the same project. Temporary, so the old paths stay
  // free if the structure changes again.
  redirects() {
    return [
      { source: '/work', destination: '/projects', permanent: false },
      { source: '/work/:slug', destination: '/projects/:slug', permanent: false },
      { source: '/kiv', destination: '/projects', permanent: false },
      { source: '/kiv/:slug', destination: '/projects/:slug', permanent: false },
    ];
  },
};

export default nextConfig;
