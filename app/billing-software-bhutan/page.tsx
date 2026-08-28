import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import {
  Download,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Printer,
  QrCode,
  Zap,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/billing-software-bhutan',
  title: 'Best Billing Software in Bhutan — Fast Invoicing & Receipt | Jinda POS',
  description:
    'Best billing software in Bhutan for shops, restaurants, and businesses. Jinda POS generates instant thermal receipts, professional A4 invoices with 5% GST, barcode billing, and supports mBOB, BNB Pay, TPay payments — 100% offline.',
  keywords: [
    'billing software Bhutan',
    'best billing software Bhutan',
    'invoice software Bhutan',
    'billing software Thimphu',
    'billing software Phuntsholing',
    'billing software Paro',
    'shop billing Bhutan',
    'GST invoice software Bhutan',
    'thermal receipt printer Bhutan',
    'online billing software Bhutan',
    'restaurant billing software Bhutan',
    'retail billing software Bhutan',
    'invoicing software for small business Bhutan',
  ],
})

const faqs = [
  {
    question: 'What types of invoices and receipts can Jinda generate?',
    answer:
      'Jinda POS generates thermal receipt slips (58mm and 80mm), A4 tax invoices, A5 invoices, and delivery challan/quotation formats. All include your business name, TPN, itemized 5% GST breakdown, and payment details.',
  },
  {
    question: 'Does Jinda billing software work without internet in Bhutan?',
    answer:
      'Yes — completely offline. Jinda stores all sales, customer records, and inventory on your local Windows computer. Billing works 24/7 even during power outages or connectivity issues.',
  },
  {
    question: 'Can I print barcodes and bills from the same software?',
    answer:
      'Yes. Jinda includes a barcode label printing module. You can design and print barcode stickers for all products, and then use those same barcodes for instant scan-to-bill checkout at the POS terminal.',
  },
  {
    question: 'Does Jinda support mBOB, BNB Pay, and TPay billing?',
    answer:
      'Yes. When generating a bill, you can select the payment method: mBOB, BNB Pay, TPay, DrukPNB, cash, bank card, bank transfer, or udhaaro (credit). This keeps your payment records accurate for accounting.',
  },
]

export default function BillingSoftwareBhutanPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Billing Software in Bhutan', url: 'https://jindapos.com/billing-software-bhutan' },
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
              Best Billing Software for Bhutanese Shops
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Fast Billing Software Built for Bhutan
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Print GST-compliant thermal bills and A4 invoices in seconds. Supports barcode scanning, mBOB, BNB Pay, TPay payments, and works 100% offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-8 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-xl text-base">
                  View Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Thermal & A4 Receipts</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Auto 5% GST</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Barcode Billing</span>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Billing Features Made for Bhutan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
              From small shops in Thimphu to wholesale distributors in Phuntsholing — Jinda handles every billing need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Instant Barcode Billing</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Scan any barcode and product details, price, and GST auto-fill instantly. Complete a sale in under 5 seconds. Supports USB and wireless barcode scanners.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Printer className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">GST-Compliant Invoices</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Every invoice includes your TPN, itemized 5% GST amounts, tax invoice headers, and professional formatting. 4 invoice templates available: thermal, A4, A5, and quotation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">mBOB & BNB Pay Billing</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Record bills paid via mBOB, BNB Pay, TPay, DrukPNB, BDBL, or cash. All payment methods are tracked separately in your financial reports automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Invoice Types */}
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                4 Invoice Formats for Every Business in Bhutan
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Thermal Receipt (58mm / 80mm)',
                  desc: 'Instant small receipts for retail checkout counters. Works with all USB thermal printers.',
                },
                {
                  title: 'A4 Tax Invoice',
                  desc: 'Formal invoice with TPN, GST breakdown, and company logo for B2B and government supplies.',
                },
                {
                  title: 'A5 Invoice',
                  desc: 'Compact professional invoice for service businesses, cafes, and freelancers.',
                },
                {
                  title: 'Quotation / Challan',
                  desc: 'Generate purchase quotes and delivery challans for wholesale, construction, and project billing.',
                },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-bhutan-maroon shrink-0" />
                    <h3 className="font-black text-slate-900 dark:text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Billing Software FAQs — Bhutan
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
              Try the Best Billing Software in Bhutan — Free for 7 Days
            </h2>
            <p className="text-slate-300 font-medium">
              Install in minutes, print your first GST invoice in seconds. No internet needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-10 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-10 h-14 rounded-xl text-base">
                  Contact Us <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
