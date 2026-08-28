import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import AboutClient from './AboutClient'

export const metadata: Metadata = createMetadata({
  path: '/about',
  title: 'About Jinda POS — Bhutan\'s #1 POS & Accounting Software Company',
  description: 'Jinda POS is built specifically for Bhutanese businesses by developer Keshab Baral from Tsirang, Bhutan. Learn our mission to help every shop in Thimphu, Phuntsholing, Paro, Gelephu, and across Bhutan manage billing, accounting, and GST easily.',
  keywords: [
    'Jinda POS Bhutan',
    'Keshab Baral',
    'POS software developer Bhutan',
    'Tsirang Bhutan software',
    'Bhutan POS development team',
    'Bhutan point of sale history',
    'Bhutan made software',
    'software company Bhutan',
    'Bhutanese software developer',
    'POS company Bhutan',
    'accounting software company Bhutan',
    'Damphu Tsirang software',
    'local software Bhutan',
    'Bhutan IT company',
  ]
})

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'About Us', url: 'https://jindapos.com/about' },
        ]}
      />
      <AboutClient />
    </>
  )
}
