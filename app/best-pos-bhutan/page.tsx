import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { Download, CheckCircle2, ShieldCheck, Zap, ArrowRight, Star, Calculator, CreditCard, Layers, BarChart3, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/best-pos-bhutan',
  title: 'Best POS in Bhutan — #1 Point of Sale Software for Shops & Retail',
  description: 'Looking for the best POS in Bhutan? Jinda POS is the top-rated offline point of sale and billing software for Bhutanese retailers, restaurants, pharmacies, and shops.',
  keywords: [
    'best POS in Bhutan',
    'best POS software Bhutan',
    'POS in Bhutan',
    'point of sale software Bhutan',
    'retail billing software Bhutan',
    'shop management software Bhutan',
    'offline POS system Bhutan',
  ],
})

const faqs = [
  {
    question: 'Why is Jinda considered the best POS in Bhutan?',
    answer: 'Jinda POS is specifically engineered for the Bhutanese retail and wholesale ecosystem. Unlike foreign cloud POS systems, Jinda works 100% offline, integrates with Bhutanese mobile banking apps (mBOB, BNB Pay, TPay, DrukPNB), auto-calculates 5% Bhutan GST, and includes double-entry accounting without monthly cloud fees.',
  },
  {
    question: 'Does Jinda POS work without internet in Bhutan?',
    answer: 'Yes! Jinda POS runs entirely offline on your Windows desktop or laptop. Your sales data, inventory ledgers, and customer history remain securely stored in your computer local database. You only need internet for license setup or optional cloud backup.',
  },
  {
    question: 'What retail business types can use Jinda POS in Bhutan?',
    answer: 'Jinda POS is used across Bhutan by grocery stores, mini-marts, boutique shops, electronics retailers, pharmacies, hardware suppliers, restaurants, cafes, and wholesale distributors.',
  },
  {
    question: 'How does barcode scanning work in Jinda POS?',
    answer: 'Simply plug any USB or wireless barcode scanner into your computer. Jinda instantly matches product barcodes for instant checkout, barcode label printing, and automatic stock deduction.',
  },
]

export default function BestPosBhutanPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Best POS in Bhutan', url: 'https://jindapos.com/best-pos-bhutan' },
        ]}
      />
      <FAQPageJsonLd faqs={faqs} />
      <SoftwareApplicationJsonLd />

      <main className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-950 via-bhutan-maroon-dark to-slate-900 text-white py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bhutan-gold/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="container relative z-10 px-4 md:px-6 mx-auto text-center max-w-4xl space-y-6">
            <Badge className="bg-bhutan-gold text-bhutan-maroon-dark border-none px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-xs">
              #1 Ranked POS Software in Bhutan
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              The Best POS in Bhutan for Retail & Business Growth
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Empower your shop with fast barcode sales, real-time inventory management, automatic 5% GST calculation, and native mBOB / BNB Pay payment support — 100% offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  View Pricing & Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> No Credit Card Required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> 100% Offline Ready</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Free 7-Day Trial</span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Bhutanese Businesses Choose Jinda POS
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
              Designed specifically for local shop owners in Thimphu, Phuntsholing, Paro, Gelephu, Punakha, and across Bhutan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Lightning Fast Checkout</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Barcode scanning support, product hotkeys, hold cart feature, and instant thermal receipt printing keeps line-ups moving fast.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Automatic 5% Bhutan GST</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Pre-configured with Bhutan tax regulations. Autocalculates 5% GST on taxable items and outputs monthly ready-to-file returns.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Local Payment Integration</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Record sales paid with mBOB, BNB Pay, TPay, DrukPNB, cash, cards, bank transfers, or customer credit (udhaaro ledgers).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                How Jinda Compares to Generic POS Systems
              </h2>
              <p className="text-slate-500 text-sm font-medium">See why Jinda is rated the best POS software in Bhutan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-sm uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-4 font-black">Feature</th>
                    <th className="py-4 px-4 font-black text-bhutan-maroon dark:text-bhutan-gold">Jinda POS Bhutan</th>
                    <th className="py-4 px-4 font-black text-slate-400">Generic / Foreign POS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">Offline Functionality</td>
                    <td className="py-4 px-4 text-emerald-600 font-black">100% Offline (SQLite)</td>
                    <td className="py-4 px-4 text-slate-500">Requires Constant Internet</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">Bhutan GST (5%)</td>
                    <td className="py-4 px-4 text-emerald-600 font-black">Auto Built-in</td>
                    <td className="py-4 px-4 text-slate-500">Manual setup / Not compliant</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">Bhutan Bank QR Payments</td>
                    <td className="py-4 px-4 text-emerald-600 font-black">mBOB, BNB, TPay, DrukPNB</td>
                    <td className="py-4 px-4 text-slate-500">Only Stripe / PayPal</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">Pricing Model</td>
                    <td className="py-4 px-4 text-emerald-600 font-black">One-time / Annual License</td>
                    <td className="py-4 px-4 text-slate-500">Monthly USD Subscription</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm font-medium">Everything you need to know about setting up the best POS in Bhutan</p>
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
      </main>
    </>
  )
}
