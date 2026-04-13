import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Imagine Marketplace',
    short_name:       'Imagine',
    description:      'The world\'s first AI-powered app marketplace. Discover, launch, and manage apps instantly.',
    start_url:        '/',
    display:          'standalone',
    background_color: '#f8fafc',
    theme_color:      '#14b8a6',
    icons: [
      {
        src:     '/icon',
        sizes:   '32x32',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/apple-icon',
        sizes:   '180x180',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
