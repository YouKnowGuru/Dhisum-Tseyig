import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import FeaturesClient from './FeaturesClient'

export const metadata: Metadata = createMetadata({
  path: '/features',
  title: 'Jinda POS Features — POS, Accounting, GST, Inventory & More for Bhutan',
  description: 'Explore 20+ features of Jinda POS — Bhutan\'s best business software. Barcode POS terminal, double-entry accounting, real-time inventory tracking, 5% GST filing, professional invoicing, payroll, mBOB & BNB Pay integration, and cloud backup. All offline.',
  keywords: [
    'Bhutan GST compliance software',
    'Bhutan double entry accounting',
    'mBOB integration POS',
    'sales dashboard Bhutan',
    'inventory tracker Bhutan',
    'offline billing system Bhutan',
    'barcode POS Bhutan',
    'payroll software Bhutan',
    'cloud backup software Bhutan',
    'POS features Bhutan',
    'accounting features Bhutan',
    'GST return Bhutan software',
    'multi-user POS Bhutan',
    'POS software features Thimphu',
    'POS software features Phuntsholing',
    'udhaaro ledger Bhutan',
    'customer ledger software Bhutan',
  ]
})

export default function FeaturesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Features', url: 'https://jindapos.com/features' },
        ]}
      />
      <FeaturesClient />
    </>
  )
}
