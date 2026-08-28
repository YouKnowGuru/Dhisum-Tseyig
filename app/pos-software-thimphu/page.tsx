import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import {
  Download,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Zap,
  Calculator,
  CreditCard,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/pos-software-thimphu',
  title: 'Best POS Software in Thimphu, Bhutan — Shop & Retail Billing | Jinda POS',
  description:
    'Looking for POS software in Thimphu? Jinda POS is the top-rated point of sale and billing software for shops, restaurants, pharmacies, and businesses in Thimphu, Bhutan. Works offline, auto 5% GST, supports mBOB and BNB Pay.',
  keywords: [
    'POS software Thimphu',
    'billing software Thimphu',
    'accounting software Thimphu',
    'point of sale Thimphu',
    'shop software Thimphu',
    'POS system Thimphu Bhutan',
    'retail software Thimphu',
    'restaurant POS Thimphu',
    'grocery store software Thimphu',
    'inventory management Thimphu',
    'GST software Thimphu',
    'business software Thimphu',
    'best POS Thimphu',
    'best billing software Thimphu',
  ],
})

const faqs = [
  {
    question: 'Which shops in Thimphu use Jinda POS?',
    answer:
      'Jinda POS is used by grocery stores, mini-marts, pharmacies, hardware shops, electronics retailers, clothing boutiques, restaurants, cafes, and wholesale distributors across Thimphu. The software is designed for Bhutanese retail environments with mBOB and BNB Pay payment support.',
  },
  {
    question: 'Does Jinda POS support mBOB and BNB Pay for Thimphu shops?',
    answer:
      'Yes. Jinda POS lets you record payments made via mBOB, BNB Pay, TPay, DrukPNB, BDBL, Druk Bank, cash, and customer credit (udhaaro). All payment methods are tracked separately in your sales reports.',
  },
  {
    question: 'Can I get support in Thimphu for Jinda POS?',
    answer:
      'Yes. We provide remote installation support, training sessions, and ongoing technical support for all businesses in Thimphu and across Bhutan. Contact us via WhatsApp or email and we will assist you promptly.',
  },
]

export default function PosSoftwareThimphuPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'POS Software in Thimphu', url: 'https://jindapos.com/pos-software-thimphu' },
        ]}
      />
      <FAQPageJsonLd faqs={faqs} />
      <SoftwareApplicationJsonLd />

      <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-950 via-bhutan-maroon-dark to-slate-900 text-white py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bhutan-gold/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="container relative z-10 px-4 md:px-6 mx-auto text-center max-w-4xl space-y-6">
            <Badge className="bg-bhutan-gold text-bhutan-maroon-dark border-none px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-xs">
              #1 POS Software in Thimphu, Bhutan
            </Badge>
            <div className="flex items-center justify-center gap-2 text-bhutan-gold">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Serving Thimphu & All of Bhutan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Best POS Software for Thimphu Shops & Businesses
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Jinda POS is the most trusted billing and point of sale software for businesses in Thimphu. Fast barcode checkout, auto 5% GST, mBOB &amp; BNB Pay support, and full inventory management — offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  Get Support in Thimphu <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> mBOB & BNB Pay</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Auto 5% Bhutan GST</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> 100% Offline</span>
            </div>
          </div>
        </section>

        {/* Business Types */}
        <section className="py-16 md:py-20 container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Jinda POS is Used by These Thimphu Businesses
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              From Chang Lam to Norzin Lam — Thimphu shops trust Jinda for fast, reliable billing.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Grocery Stores & Mini-Marts',
              'Pharmacies & Medical Stores',
              'Electronics & Mobile Shops',
              'Clothing & Boutique Shops',
              'Hardware & Building Materials',
              'Restaurants & Cafes',
              'Stationery & Book Shops',
              'General Trade Stores',
              'Wholesale Distributors',
            ].map((biz) => (
              <div key={biz} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                <CheckCircle2 className="h-5 w-5 text-bhutan-maroon shrink-0" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{biz}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                Why Thimphu Businesses Choose Jinda POS
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: 'Fast Checkout', desc: 'Scan barcode → instant bill in under 3 seconds.' },
                { icon: Calculator, title: 'Auto 5% GST', desc: 'Bhutan GST calculated and invoiced automatically.' },
                { icon: CreditCard, title: 'mBOB & BNB Pay', desc: 'All Bhutanese payment methods supported natively.' },
                { icon: ShieldCheck, title: '100% Offline', desc: 'No internet? No problem. Sell anywhere, anytime.' },
              ].map((item) => (
                <Card key={item.title} className="border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl transition-all text-center">
                  <CardContent className="p-0 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center mx-auto">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              POS Software Thimphu — Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Other Cities */}
        <section className="py-12 bg-slate-100 dark:bg-slate-800/30">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Jinda POS is Available Across All of Bhutan
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: 'Phuntsholing', href: '/pos-software-phuntsholing' },
                { name: 'Paro', href: '/best-pos-bhutan' },
                { name: 'Gelephu', href: '/best-pos-bhutan' },
                { name: 'Punakha', href: '/best-pos-bhutan' },
                { name: 'Wangdue', href: '/best-pos-bhutan' },
                { name: 'Bumthang', href: '/best-pos-bhutan' },
                { name: 'Samdrup Jongkhar', href: '/best-pos-bhutan' },
                { name: 'Trashigang', href: '/best-pos-bhutan' },
              ].map((city) => (
                <Link key={city.name} href={city.href}>
                  <Badge className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-bold hover:bg-bhutan-maroon hover:text-white hover:border-bhutan-maroon transition-all cursor-pointer">
                    <MapPin className="h-3 w-3 mr-1" />{city.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-bhutan-maroon-dark to-slate-900 text-white">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-2xl md:text-4xl font-black">
              Get Jinda POS for Your Thimphu Shop — 7-Day Free Trial
            </h2>
            <p className="text-slate-300 font-medium">
              Download now and start billing in minutes. No internet required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-10 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-10 h-14 rounded-xl text-base">
                  View Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
