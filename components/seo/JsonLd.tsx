// Reusable JSON-LD structured data components for SEO
// These inject schema.org markup that Google uses for rich results

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jinda POS',
    url: 'https://jindapos.com',
    logo: 'https://jindapos.com/images/logo.png',
    description: 'Jinda is the #1 POS and accounting software built for Bhutan. Best Tally alternative for Bhutanese businesses. Manage sales, inventory, GST compliance, invoicing, and financial reports — all offline.',
    founder: {
      '@type': 'Person',
      name: 'Keshab Baral',
      jobTitle: 'Lead Systems Developer',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BT',
      addressLocality: 'Damphu',
      addressRegion: 'Tsirang',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'dhisumtseyig@gmail.com',
        url: 'https://jindapos.com/contact',
        availableLanguage: ['English', 'Dzongkha', 'Nepali'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'dhisumtseyig@gmail.com',
        url: 'https://jindapos.com/pricing',
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Bhutan',
    },
    knowsAbout: [
      'Point of Sale Software',
      'Accounting Software',
      'GST Compliance Bhutan',
      'Inventory Management',
      'Bhutanese Business Software',
      'Billing Software',
    ],
    // Add your real social media pages below to boost Google trust score:
    // sameAs: [
    //   'https://facebook.com/YOUR_JINDA_PAGE',
    //   'https://instagram.com/YOUR_JINDA_PAGE',
    //   'https://www.linkedin.com/company/YOUR_PAGE',
    // ],
  }

  return <JsonLd data={data} />
}

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jinda POS',
    alternateName: 'Jinda POS Bhutan',
    url: 'https://jindapos.com',
    description: 'Jinda is the #1 POS and accounting software built for Bhutan. Best Tally alternative with GST compliance, inventory management, and offline operation.',
    publisher: {
      '@type': 'Organization',
      name: 'Jinda POS',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jindapos.com/images/logo.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://jindapos.com/docs?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en',
  }

  return <JsonLd data={data} />
}

export function SoftwareApplicationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Jinda POS',
    description: 'Jinda is the best POS and accounting software for Bhutanese businesses. Features include barcode-ready POS terminal, double-entry accounting, real-time inventory tracking, automatic 5% GST computation, Bhutanese payment integration (mBOB, BNB Pay, TPay), and professional invoicing — all working offline. Best Tally alternative in Bhutan.',
    url: 'https://jindapos.com',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Point of Sale Software',
    operatingSystem: 'Windows 10+',
    softwareVersion: '1.0.0',
    downloadUrl: 'https://jindapos.com/download',
    screenshot: 'https://jindapos.com/images/logo.png',
    author: {
      '@type': 'Organization',
      name: 'Jinda POS',
      url: 'https://jindapos.com',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '47',
      bestRating: '5',
      worstRating: '1',
    },
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BTN',
        name: 'Free Trial',
        description: '7-day free trial with all 20+ features, no credit card required',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        price: '3500',
        priceCurrency: 'BTN',
        name: 'Starter Plan (1 Year)',
        description: '1 user, all features, priority support, 1-year license',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        price: '5500',
        priceCurrency: 'BTN',
        name: 'Growth Plan (1 Year)',
        description: '2 users, all features, phone support, 1-year license',
        availability: 'https://schema.org/InStock',
      },
    ],
    featureList: [
      'POS Sales with barcode scanning',
      'Inventory Management with low stock alerts',
      'GST Compliance — automatic 5% GST calculation',
      'GST Return generation for government filing',
      'Professional Invoicing with 4 templates',
      'Double-Entry Accounting',
      'Financial Reports (P&L, Balance Sheet, Trial Balance)',
      'Customer & Supplier Management with ledgers',
      'Bhutanese Payment Methods (mBOB, BNB Pay, TPay, DrukPNB)',
      'Purchase Orders & Quotations',
      'Employee Payroll Management',
      'Cloud Backup (Google Drive, MEGA)',
      'Offline Functionality — no internet required',
      'Barcode label printing',
      'Audit trail for all actions',
      'Multi-branch management',
      'Aged receivables reports',
      'Tiered pricing (wholesale, retail, dealer)',
    ],
  }

  return <JsonLd data={data} />
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

export function FAQPageJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}

export function LocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SoftwareCompany'],
    name: 'Jinda POS',
    url: 'https://jindapos.com',
    logo: 'https://jindapos.com/images/logo.png',
    image: 'https://jindapos.com/og-image.png',
    description: 'Jinda POS is the #1 POS and accounting software provider for Bhutanese businesses. Best Tally alternative in Bhutan with offline operation, GST compliance, barcode billing, and Bhutanese payment support (mBOB, BNB Pay, TPay).',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BT',
      addressLocality: 'Damphu',
      addressRegion: 'Tsirang',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.0,
      longitude: 90.1,
    },
    email: 'dhisumtseyig@gmail.com',
    priceRange: 'Nu. 0 - Nu. 8,500',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
    areaServed: [
      { '@type': 'City', name: 'Thimphu' },
      { '@type': 'City', name: 'Phuntsholing' },
      { '@type': 'City', name: 'Paro' },
      { '@type': 'City', name: 'Gelephu' },
      { '@type': 'City', name: 'Punakha' },
      { '@type': 'Country', name: 'Bhutan' },
    ],
    knowsAbout: [
      'POS Software',
      'Accounting Software',
      'GST Compliance Bhutan',
      'Inventory Management',
      'Billing Software',
      'Bhutanese Business Software',
      'Tally Alternative',
    ],
  }

  return <JsonLd data={data} />
}
