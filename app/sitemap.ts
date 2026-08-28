import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://jindapos.com'
  const lastMod = new Date('2026-08-28')

  return [
    // ─── Homepage ──────────────────────────────────────────────────────────
    {
      url: baseUrl,
      lastModified: lastMod,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // ─── Primary SEO Landing Pages (Highest Priority) ──────────────────────
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
      url: `${baseUrl}/accounting-software-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/billing-software-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/inventory-management-bhutan`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ─── City-Level Local SEO Pages ────────────────────────────────────────
    {
      url: `${baseUrl}/pos-software-thimphu`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pos-software-phuntsholing`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ─── Core Product Pages ────────────────────────────────────────────────
    {
      url: `${baseUrl}/features`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // ─── Supporting Pages ──────────────────────────────────────────────────
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
      priority: 0.65,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.6,
    },

    // ─── Legal Pages ───────────────────────────────────────────────────────
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
