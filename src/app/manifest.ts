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
      {
        src:     '/icon-192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
