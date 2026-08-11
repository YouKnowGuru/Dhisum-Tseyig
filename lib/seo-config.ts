import type { Metadata } from 'next'

const SITE_URL = 'https://jindapos.com'
const SITE_NAME = 'Jinda POS'
const SITE_DESCRIPTION = 'Jinda is the #1 POS and accounting software built for Bhutan. Manage sales, inventory, GST compliance, invoicing, and financial reports — all offline. Best Tally alternative for Bhutanese businesses. Supports mBOB, BNB Pay, TPay, DrukPNB. Free 7-day trial.'

export const seoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  siteDescription: SITE_DESCRIPTION,
  locale: 'en_US',
  creator: 'Keshab Baral',
  publisher: 'Jinda POS',
  twitterHandle: '@jindapos',
  themeColor: '#7B1F3A', // bhutan-maroon
  keywords: [
    // Primary target keywords (what people search)
    'POS in Bhutan',
    'best POS in Bhutan',
    'best POS software Bhutan',
    'POS software Bhutan',
    'point of sale Bhutan',
    'POS system Bhutan',
    // Tally alternative keywords
    'tally in Bhutan',
    'tally alternative Bhutan',
    'tally software Bhutan',
    'better than tally Bhutan',
    'tally replacement Bhutan',
    // GST & tax keywords
    'GST filing software Bhutan',
    'GST software Bhutan',
    'GST return software Bhutan',
    'GST compliance Bhutan',
    'tax filing software Bhutan',
    // Accounting & billing keywords
    'accounting software Bhutan',
    'billing software Bhutan',
    'best billing software Bhutan',
    'invoicing software Bhutan',
    'best accounting software Bhutan',
    'double entry accounting Bhutan',
    // Business & inventory keywords
    'inventory management Bhutan',
    'retail software Bhutan',
    'small business software Bhutan',
    'Bhutanese business software',
    'shop management software Bhutan',
    'desktop POS software',
    'offline POS Bhutan',
    // Brand & payments
    'Jinda POS',
    'Jinda POS Bhutan',
    'mBOB payment POS',
    'BNB Pay POS',
    'TPay POS',
    'DrukPNB POS',
  ],
}

export function createMetadata(overrides: Partial<Metadata> & { path?: string; keywords?: string[] } = {}): Metadata {
  const { path = '', keywords: extraKeywords, ...rest } = overrides
  const url = `${SITE_URL}${path}`
  const mergedKeywords = extraKeywords
    ? [...seoConfig.keywords, ...extraKeywords]
    : seoConfig.keywords

  return {
    metadataBase: new URL(SITE_URL),
    title: rest.title || {
      default: `${SITE_NAME} — #1 POS & Accounting Software in Bhutan | Best Tally Alternative`,
      template: `%s | ${SITE_NAME}`,
    },
    description: rest.description || SITE_DESCRIPTION,
    keywords: mergedKeywords,
    authors: [{ name: seoConfig.creator, url: SITE_URL }],
    creator: seoConfig.creator,
    publisher: seoConfig.publisher,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url || SITE_URL,
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale,
      url: url || SITE_URL,
      siteName: SITE_NAME,
      title: (rest.title as string) || `${SITE_NAME} — #1 POS & Accounting Software in Bhutan`,
      description: (rest.description as string) || SITE_DESCRIPTION,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Best POS Software in Bhutan | Tally Alternative`,
          type: 'image/png',
        },
      ],
      ...(rest.openGraph || {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: (rest.title as string) || `${SITE_NAME} — #1 POS & Accounting Software in Bhutan`,
      description: (rest.description as string) || SITE_DESCRIPTION,
      images: [`${SITE_URL}/og-image.png`],
      creator: seoConfig.twitterHandle,
      ...(rest.twitter || {}),
    },
    verification: {
      // TODO: Add your Google Search Console verification code
      // Sign up at https://search.google.com/search-console
      // google: 'your-google-verification-code',
      // TODO: Add Bing Webmaster Tools verification
      // other: { 'msvalidate.01': 'your-bing-verification-code' },
    },
    other: {
      'geo.region': 'BT',
      'geo.placename': 'Bhutan',
      'geo.position': '27.4728;89.6393',
      'ICBM': '27.4728, 89.6393',
    },
    category: 'business',
    ...rest,
  }
}
