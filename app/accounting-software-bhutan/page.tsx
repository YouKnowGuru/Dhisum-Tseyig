import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import {
  Download,
  CheckCircle2,
  ArrowRight,
  Calculator,
  BookOpen,
  TrendingUp,
  FileText,
  BarChart3,
  Layers,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/accounting-software-bhutan',
  title: 'Best Accounting Software in Bhutan — Double-Entry & GST | Jinda POS',
  description:
    'Looking for accounting software in Bhutan? Jinda POS is the best accounting software for Bhutanese businesses with double-entry ledgers, automatic 5% GST, P&L reports, balance sheet, trial balance, and full inventory — all offline. Better than Tally.',
  keywords: [
    'accounting software Bhutan',
    'best accounting software Bhutan',
    'accounting software for Bhutanese',
    'accounting software for Bhutan business',
    'double entry accounting Bhutan',
    'bookkeeping software Bhutan',
    'financial software Bhutan',
    'accounting software Thimphu',
    'accounting software Phuntsholing',
    'tally alternative accounting Bhutan',
    'GST accounting software Bhutan',
    'small business accounting Bhutan',
  ],
})

const faqs = [
  {
    question: 'What accounting features does Jinda POS include for Bhutanese businesses?',
    answer:
      'Jinda POS includes complete double-entry accounting: General Ledger, Trial Balance, Profit & Loss Statement, Balance Sheet, Accounts Payable, Accounts Receivable, customer credit (udhaaro) ledgers, and supplier payment tracking — all generated automatically from your daily sales and purchases without any manual journal entries.',
  },
  {
    question: 'Does Jinda POS work as a Tally replacement for accounting in Bhutan?',
    answer:
      'Yes. Jinda POS replaces Tally for retail and wholesale businesses in Bhutan. Unlike Tally, it also includes a full barcode POS terminal so your front desk and back-office accounting are unified in one software with no double data entry.',
  },
  {
    question: 'Can I generate financial reports like P&L and Balance Sheet in Jinda?',
    answer:
      'Yes. Jinda automatically generates Profit & Loss Statements, Balance Sheets, and Trial Balance reports from your sales, purchases, and expenses. Reports can be exported as PDF or Excel for accountants and bank submissions.',
  },
  {
    question: 'Does Jinda support VAT/GST accounting for Bhutan?',
    answer:
      'Jinda POS is built specifically for Bhutan\'s 5% GST system. It tracks output tax (GST collected on sales) and input tax (GST paid on purchases) automatically in separate ledger accounts and generates ready-to-file monthly GST returns for the Bhutan Revenue & Customs (RAMCO system).',
  },
]

export default function AccountingSoftwareBhutanPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Accounting Software in Bhutan', url: 'https://jindapos.com/accounting-software-bhutan' },
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
              #1 Accounting Software for Bhutanese Businesses
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Best Accounting Software in Bhutan
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Full double-entry accounting, automatic 5% GST tracking, P&amp;L reports, balance sheet, and trial balance — all built into Jinda POS and running 100% offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  See All Features <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> No Manual Journal Entries</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Auto GST Ledgers</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Works 100% Offline</span>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Complete Accounting Suite for Bhutan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
              Everything a Bhutanese business owner or accountant needs — in one affordable offline software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Double-Entry Ledgers</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Every sale, purchase, expense, and payment automatically creates balanced debit/credit journal entries. Customer and supplier ledgers track outstanding balances in real time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Financial Reports</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Generate Profit &amp; Loss Statements, Balance Sheets, Trial Balance, and Cash Flow reports with one click. Export as PDF or Excel for your accountant or bank.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Auto GST Accounting</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  5% Bhutan GST is automatically recorded in output and input tax ledgers. Monthly GST summaries are generated ready for RAMCO / BRC filing — no accountant needed.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                Jinda POS vs Tally — Accounting Software Comparison
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Why Bhutanese accountants and business owners prefer Jinda over Tally Prime
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <th className="py-5 px-6 font-black">Accounting Feature</th>
                      <th className="py-5 px-6 font-black text-bhutan-maroon dark:text-bhutan-gold">Jinda POS Bhutan</th>
                      <th className="py-5 px-6 font-black text-slate-400">Tally Prime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
                    {[
                      ['Bhutan 5% GST Auto-Accounting', 'Built-in, Zero Setup', 'Requires Paid Customization'],
                      ['Double-Entry Accounting', 'Automatic via POS', 'Manual Voucher Entry'],
                      ['Retail POS Terminal', 'Built-in Barcode POS', 'Not Available'],
                      ['mBOB / BNB Pay Ledgers', 'Native Support', 'Not Available'],
                      ['Staff Training Time', 'Under 10 Minutes', 'Days / Weeks'],
                      ['Monthly GST Return', '1-Click Export', 'Complex Report Setup'],
                      ['Pricing Model', 'One-time / Annual (BTN)', 'Expensive USD Subscription'],
                    ].map(([feature, jinda, tally]) => (
                      <tr key={feature}>
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{feature}</td>
                        <td className="py-4 px-6 text-emerald-600 font-black flex items-center gap-2">
                          <Check className="h-5 w-5 text-emerald-500 shrink-0" /> {jinda}
                        </td>
                        <td className="py-4 px-6 text-slate-500 items-center gap-2">
                          <X className="h-4 w-4 text-rose-400 inline mr-2" />{tally}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Who Uses It */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Who Uses Jinda Accounting Software in Bhutan?
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Grocery Stores & Mini-Marts',
              'Pharmacies & Medical Stores',
              'Hardware & Construction Shops',
              'Restaurants & Cafes',
              'Wholesale Distributors',
              'Electronics Retailers',
              'Boutique & Clothing Shops',
              'Stationery Shops',
              'General Trade Businesses',
            ].map((biz) => (
              <div key={biz} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="h-5 w-5 text-bhutan-maroon shrink-0" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{biz}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Accounting Software FAQs — Bhutan
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

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-bhutan-maroon-dark to-slate-900 text-white">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-2xl md:text-4xl font-black">
              Start Using the Best Accounting Software in Bhutan — Free for 7 Days
            </h2>
            <p className="text-slate-300 font-medium">
              No credit card. No internet required. Install and start managing your accounts in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-10 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-10 h-14 rounded-xl text-base">
                  View Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
