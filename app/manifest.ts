import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jinda POS — Modern POS & Accounting for Bhutan',
    short_name: 'Jinda POS',
    description: 'Modern POS and accounting software designed for small businesses in Bhutan. Sales, inventory, GST compliance, invoicing, reports — all in one offline desktop app.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7B1F3A',
    orientation: 'portrait',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
