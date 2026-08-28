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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/pos-software-phuntsholing',
  title: 'Best POS Software in Phuntsholing, Bhutan — Shop & Wholesale Billing | Jinda POS',
  description:
    'Best POS and billing software for shops and wholesale businesses in Phuntsholing, Bhutan. Jinda POS offers barcode billing, automatic 5% Bhutan GST, mBOB & BNB Pay support, wholesale pricing tiers, and works 100% offline.',
  keywords: [
    'POS software Phuntsholing',
    'billing software Phuntsholing',
    'accounting software Phuntsholing',
    'point of sale Phuntsholing',
    'shop software Phuntsholing',
    'wholesale software Phuntsholing',
    'POS system Phuntsholing Bhutan',
    'retail software Phuntsholing',
    'GST software Phuntsholing',
    'inventory software Phuntsholing',
    'best billing software Phuntsholing',
    'Bhutan border trade software',
    'import export billing software Bhutan',
    'wholesale billing Bhutan',
  ],
})

const faqs = [
  {
    question: 'Why is Jinda POS ideal for Phuntsholing wholesale businesses?',
    answer:
      'Phuntsholing is a major trade hub at the Bhutan-India border. Jinda POS supports wholesale pricing tiers (retail price, wholesale price, dealer price), large-volume purchase orders, supplier management, and cross-border trade billing with multi-currency notes — making it ideal for wholesale distributors and import/export businesses in Phuntsholing.',
  },
  {
    question: 'Can Jinda handle both retail and wholesale billing in Phuntsholing?',
    answer:
      'Yes. Each customer in Jinda can be assigned a price tier (retail, wholesale, or dealer). When billing, the correct price tier is applied automatically based on the customer, so you can serve both walk-in customers and wholesale clients from the same counter.',
  },
  {
    question: 'Does Jinda support mBOB and BNB Pay payments in Phuntsholing?',
    answer:
      'Yes. All major Bhutanese digital payment methods — mBOB, BNB Pay, TPay, DrukPNB, BDBL, and Druk Bank — are supported in Jinda POS. Each payment method is recorded separately for accurate accounting and GST reporting.',
  },
]

export default function PosSoftwarePhuntsholingPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'POS Software in Phuntsholing', url: 'https://jindapos.com/pos-software-phuntsholing' },
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
              #1 POS Software in Phuntsholing, Bhutan
            </Badge>
            <div className="flex items-center justify-center gap-2 text-bhutan-gold">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Serving Phuntsholing & All Trade Hubs in Bhutan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Best POS & Billing Software for Phuntsholing Businesses
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Built for the retail and wholesale trade of Phuntsholing. Manage multi-tier wholesale pricing, barcode billing, 5% Bhutan GST, and mBOB payments — 100% offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  Contact Us <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Wholesale Pricing Tiers</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Auto 5% Bhutan GST</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> 100% Offline</span>
            </div>
          </div>
        </section>

        {/* Business Types in Phuntsholing */}
        <section className="py-16 md:py-20 container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Phuntsholing Businesses Using Jinda POS
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              From Rinchending to the main trade belt — Phuntsholing businesses trust Jinda for fast, accurate billing.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Wholesale Distributors',
              'Import & Export Traders',
              'General Trade Stores',
              'Grocery & Provisions',
              'Electronics Shops',
              'Hardware & Materials',
              'Clothing & Fabric Shops',
              'Pharmacies',
              'Restaurants & Canteens',
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
                Features That Make Jinda Perfect for Phuntsholing
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: 'Wholesale Pricing', desc: 'Set retail, wholesale, and dealer prices per product and auto-apply by customer type.' },
                { icon: Calculator, title: 'Auto 5% GST', desc: 'Bhutan GST is automatically calculated and filed — no accountant needed.' },
                { icon: CreditCard, title: 'All Bhutan Payments', desc: 'mBOB, BNB Pay, TPay, DrukPNB, BDBL, cash, and credit tracked accurately.' },
                { icon: ShieldCheck, title: 'Offline & Secure', desc: 'All data stored on your computer. No cloud subscription needed.' },
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
              POS Software Phuntsholing — Frequently Asked Questions
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
              Also Available in These Cities Across Bhutan
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: 'Thimphu', href: '/pos-software-thimphu' },
                { name: 'Paro', href: '/best-pos-bhutan' },
                { name: 'Gelephu', href: '/best-pos-bhutan' },
                { name: 'Punakha', href: '/best-pos-bhutan' },
                { name: 'Wangdue', href: '/best-pos-bhutan' },
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
              Get Jinda POS for Your Phuntsholing Business — Free for 7 Days
            </h2>
            <p className="text-slate-300 font-medium">
              Download and start billing today. No internet required. No credit card.
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
