import type { NextConfig } from 'next'

// ---------------------------------------------------------------------------
// Next.js configuration
//
// @prisma/client is imported as `import type` only — TypeScript erases those at
// erases those at compile time so no Node-only code (Prisma client, ioredis)

// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow images from localhost (API) and common CDN patterns used in dev.
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.up.railway.app' },
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: 'imaginehq.services' },
      { protocol: 'https', hostname: '*.imaginehq.services' },
    ],
  },
}

export default nextConfig
