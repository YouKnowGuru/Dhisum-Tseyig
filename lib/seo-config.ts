import type { Metadata } from 'next'

const SITE_URL = 'https://jindapos.com'
const SITE_NAME = 'Jinda POS'
const SITE_DESCRIPTION =
  'Jinda is the #1 POS and accounting software built for Bhutan. Manage sales, inventory, GST compliance, invoicing, and financial reports — all offline. Best Tally alternative for Bhutanese businesses. Supports mBOB, BNB Pay, TPay, DrukPNB. Free 7-day trial.'

export const seoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  siteDescription: SITE_DESCRIPTION,
  locale: 'en_BT',
  creator: 'Keshab Baral',
  publisher: 'Jinda POS',
  twitterHandle: '@jindapos',
  themeColor: '#7B1F3A', // bhutan-maroon
  keywords: [
    // ─── Primary / High-Intent POS Keywords ───────────────────────────────
    'POS in Bhutan',
    'best POS in Bhutan',
    'best POS software Bhutan',
    'POS software Bhutan',
    'point of sale Bhutan',
    'POS system Bhutan',
    'point of sale software Bhutan',
    'POS machine Bhutan',
    'offline POS Bhutan',
    'desktop POS software Bhutan',

    // ─── Tally Alternative Keywords ────────────────────────────────────────
    'tally in Bhutan',
    'tally alternative Bhutan',
    'tally software Bhutan',
    'better than tally Bhutan',
    'tally replacement Bhutan',
    'tally prime Bhutan',
    'tally alternative for Bhutanese',

    // ─── Accounting & Billing Keywords ────────────────────────────────────
    'accounting software Bhutan',
    'best accounting software Bhutan',
    'accounting software for Bhutanese',
    'accounting software for Bhutan business',
    'billing software Bhutan',
    'best billing software Bhutan',
    'invoicing software Bhutan',
    'double entry accounting Bhutan',
    'bookkeeping software Bhutan',
    'financial software Bhutan',

    // ─── GST & Tax Keywords ───────────────────────────────────────────────
    'GST filing software Bhutan',
    'GST software Bhutan',
    'GST return software Bhutan',
    'GST compliance Bhutan',
    'tax filing software Bhutan',
    '5% GST software Bhutan',
    'Bhutan GST software',

    // ─── Inventory & Stock Keywords ────────────────────────────────────────
    'inventory management Bhutan',
    'inventory management software Bhutan',
    'stock management software Bhutan',
    'stock tracking software Bhutan',
    'warehouse management Bhutan',

    // ─── Business Type Keywords ────────────────────────────────────────────
    'retail software Bhutan',
    'small business software Bhutan',
    'Bhutanese business software',
    'shop management software Bhutan',
    'mini mart software Bhutan',
    'grocery store software Bhutan',
    'pharmacy software Bhutan',
    'restaurant POS Bhutan',
    'cafe POS Bhutan',
    'restaurant billing software Bhutan',
    'hardware shop software Bhutan',
    'wholesale software Bhutan',
    'wholesale billing Bhutan',
    'supermarket software Bhutan',

    // ─── City-Level Local Keywords ─────────────────────────────────────────
    'POS software Thimphu',
    'billing software Thimphu',
    'accounting software Thimphu',
    'POS software Phuntsholing',
    'billing software Phuntsholing',
    'accounting software Phuntsholing',
    'POS software Paro',
    'billing software Paro',
    'POS software Gelephu',
    'billing software Gelephu',
    'POS software Punakha',
    'POS software Wangdue',
    'POS software Samdrup Jongkhar',
    'POS software Bumthang',
    'POS software Trashigang',
    'software for shops in Bhutan',
    'business software Thimphu',

    // ─── Brand & Payment Keywords ──────────────────────────────────────────
    'Jinda POS',
    'Jinda POS Bhutan',
    'jindapos',
    'mBOB payment POS',
    'BNB Pay POS',
    'TPay POS',
    'DrukPNB POS',
    'BDBL POS',
    'Bhutan mobile payment POS',
  ],
}

export function createMetadata(
  overrides: Partial<Metadata> & { path?: string; keywords?: string[] } = {}
): Metadata {
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
          alt: `${SITE_NAME} - Best POS & Accounting Software in Bhutan | Tally Alternative`,
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
      // ── Google Search Console ──────────────────────────────────────────
      // 1. Go to https://search.google.com/search-console
      // 2. Add property → URL prefix → https://jindapos.com
      // 3. Choose "HTML tag" verification method
      // 4. Copy ONLY the content="XXXX" value and paste below:
      // google: 'PASTE_YOUR_GOOGLE_VERIFICATION_CODE_HERE',

      // ── Bing Webmaster Tools ──────────────────────────────────────────
      // 1. Go to https://www.bing.com/webmasters
      // 2. Add site → https://jindapos.com
      // 3. Paste the msvalidate code below:
      // other: { 'msvalidate.01': 'PASTE_YOUR_BING_CODE_HERE' },
    },
    other: {
      'geo.region': 'BT',
      'geo.placename': 'Bhutan',
      'geo.position': '27.4728;89.6393',
      'ICBM': '27.4728, 89.6393',
      'language': 'English',
      'revisit-after': '7 days',
      'rating': 'general',
      'distribution': 'global',
    },
    category: 'business',
    ...rest,
  }
}
