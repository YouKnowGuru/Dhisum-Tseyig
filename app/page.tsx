import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import HomeClient from './HomeClient'

export const metadata: Metadata = createMetadata({
  path: '/',
  title: '#1 Best POS & Accounting Software in Bhutan | Tally Alternative — Jinda POS',
  description: 'Looking for the best POS in Bhutan or a Tally alternative? Jinda POS is Bhutan’s #1 offline point of sale, GST filing & accounting software. Supports mBOB, BNB Pay, TPay, DrukPNB. Free 7-day trial.',
  keywords: [
    'POS in Bhutan',
    'best POS in Bhutan',
    'best POS software Bhutan',
    'tally in Bhutan',
    'tally alternative Bhutan',
    'GST filing software Bhutan',
    'GST software Bhutan',
    'billing software Bhutan',
    'accounting software Bhutan',
    'Jinda POS',
    'point of sale Bhutan',
    'inventory management Bhutan',
    'offline POS Bhutan',
    'mBOB payment POS',
    'BNB Pay POS',
    'TPay POS',
  ],
})

export default function HomePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
        ]}
      />
      <HomeClient />
    </>
  )
}
