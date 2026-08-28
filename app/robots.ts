import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jindapos.com'

  return {
    rules: [
      {
        // Google — allow everything public, block private/admin/auth routes
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/best-pos-bhutan',
          '/tally-alternative-bhutan',
          '/gst-filing-software-bhutan',
          '/accounting-software-bhutan',
          '/billing-software-bhutan',
          '/inventory-management-bhutan',
          '/pos-software-thimphu',
          '/pos-software-phuntsholing',
          '/features',
          '/pricing',
          '/download',
          '/about',
          '/contact',
          '/docs',
          '/security',
          '/privacy',
          '/terms',
          '/refund',
          '/license',
          '/updates',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/private',
          '/electron',
          '/electron/*',
          '/license-activate',
          '/license-activate/*',
          '/verify-email',
          '/reset-password',
        ],
      },
      {
        // All other crawlers — same rules
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
          '/private',
          '/electron',
          '/electron/*',
          '/license-activate',
          '/license-activate/*',
          '/verify-email',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
