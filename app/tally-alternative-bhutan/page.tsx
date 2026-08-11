import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { Download, CheckCircle2, ArrowRight, ShieldCheck, Zap, Receipt, Calculator, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/tally-alternative-bhutan',
  title: 'Best Tally Alternative in Bhutan — Modern POS & Accounting | Jinda POS',
  description: 'Looking for a Tally alternative in Bhutan? Discover why Bhutanese businesses are switching from Tally Prime to Jinda POS. Built-in barcode POS, 5% Bhutan GST, mBOB integration, and no complex training.',
  keywords: [
    'tally in Bhutan',
    'tally alternative Bhutan',
    'tally software Bhutan',
    'better than tally Bhutan',
    'tally replacement Bhutan',
    'accounting software Bhutan',
    'POS software Bhutan',
  ],
})

const faqs = [
  {
    question: 'Why switch from Tally to Jinda POS in Bhutan?',
    answer: 'Tally was designed as a heavy back-office accounting tool, whereas Jinda POS combines front-desk retail POS sales with back-office double-entry accounting. Jinda offers a modern user interface, built-in thermal receipt printing, integrated barcode creation, and direct Bhutanese mobile payment tracking (mBOB, BNB Pay, TPay) without requiring complex TDD or costly customization.',
  },
  {
    question: 'Does Jinda support double-entry accounting like Tally?',
    answer: 'Yes! Jinda includes complete double-entry accounting built-in. It automatically generates General Ledgers, Trial Balance, Profit & Loss Statements, Balance Sheet, and Customer/Supplier debit/credit ledgers with zero manual accounting entry required during sales.',
  },
  {
    question: 'Can I import my existing product data from Tally?',
    answer: 'Yes. You can export your product inventory or contact lists from Tally to CSV/Excel and import them directly into Jinda POS within seconds.',
  },
  {
    question: 'Is Jinda POS easier to learn than Tally?',
    answer: 'Significantly easier. While Tally requires days of specialized training, any staff member or cashier can learn Jinda POS in less than 10 minutes. The point of sale touchscreen and barcode system make billing instantaneous.',
  },
]

export default function TallyAlternativeBhutanPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Tally Alternative in Bhutan', url: 'https://jindapos.com/tally-alternative-bhutan' },
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
              Modern Accounting & POS Built For Bhutan
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              The #1 Tally Alternative in Bhutan
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Tired of complex Tally menus? Upgrade to Jinda POS — combining easy barcode billing with full double-entry accounting, Bhutan 5% GST filing, and mBOB integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  Compare License Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Jinda POS vs Tally Prime Comparison
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Why business owners in Thimphu, Paro, and Phuntsholing are replacing Tally with Jinda POS.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <th className="py-5 px-6 font-black">Capability</th>
                    <th className="py-5 px-6 font-black text-bhutan-maroon dark:text-bhutan-gold">Jinda POS Bhutan</th>
                    <th className="py-5 px-6 font-black text-slate-400">Tally Prime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                  <tr>
                    <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">User Interface</td>
                    <td className="py-5 px-6 text-emerald-600 font-black flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" /> Modern, Intuitive & Visual
                    </td>
                    <td className="py-5 px-6 text-slate-500 flex items-center gap-2">
                      <X className="h-5 w-5 text-rose-400" /> Keyboard-only / Complex Navigation
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">Retail Checkout Speed</td>
                    <td className="py-5 px-6 text-emerald-600 font-black flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" /> Fast Barcode Checkout (2 sec)
                    </td>
                    <td className="py-5 px-6 text-slate-500 flex items-center gap-2">
                      <X className="h-5 w-5 text-rose-400" /> Slow Voucher Entry
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">Bhutan Bank Integration</td>
                    <td className="py-5 px-6 text-emerald-600 font-black flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" /> mBOB, BNB Pay, TPay Built-in
                    </td>
                    <td className="py-5 px-6 text-slate-500 flex items-center gap-2">
                      <X className="h-5 w-5 text-rose-400" /> Not Available
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">Bhutan 5% GST Reports</td>
                    <td className="py-5 px-6 text-emerald-600 font-black flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" /> Auto 1-Click Returns
                    </td>
                    <td className="py-5 px-6 text-slate-500 flex items-center gap-2">
                      <X className="h-5 w-5 text-rose-400" /> Requires Custom Modules
                    </td>
                  </tr>
                  <tr>
                    <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">Staff Training Needed</td>
                    <td className="py-5 px-6 text-emerald-600 font-black flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" /> Under 10 Minutes
                    </td>
                    <td className="py-5 px-6 text-slate-500 flex items-center gap-2">
                      <X className="h-5 w-5 text-rose-400" /> Days / Formal Accounting Course
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Tally Switcher FAQs</h2>
            <p className="text-slate-500 text-sm font-medium">Questions about migrating from Tally to Jinda POS</p>
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
