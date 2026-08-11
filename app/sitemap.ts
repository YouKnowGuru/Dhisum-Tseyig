import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://jindapos.com'
  const lastMod = new Date('2026-08-11')

  return [
    {
      url: baseUrl,
      lastModified: lastMod,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/best-pos-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/tally-alternative-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/gst-filing-software-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: lastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: lastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: lastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/license`,
      lastModified: lastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
