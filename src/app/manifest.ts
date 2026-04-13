import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Imagine Marketplace',
    short_name:       'Imagine',
    description:      "The world's first AI-powered app marketplace. Discover, launch, and manage apps instantly.",
    start_url:        '/',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#0e8f82',
    icons: [
      // Next.js serves /apple-icon at 512×512 — browsers scale for 192 too
      {
        src:     '/apple-icon',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/apple-icon',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
