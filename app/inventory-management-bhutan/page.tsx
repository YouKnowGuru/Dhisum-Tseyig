import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/seo-config'
import { BreadcrumbJsonLd, FAQPageJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import {
  Download,
  CheckCircle2,
  ArrowRight,
  Package,
  AlertTriangle,
  BarChart3,
  Tags,
  Truck,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = createMetadata({
  path: '/inventory-management-bhutan',
  title: 'Inventory Management Software in Bhutan — Stock Tracking | Jinda POS',
  description:
    'Best inventory management software for Bhutanese businesses. Jinda POS tracks real-time stock levels, sends low-stock alerts, manages purchase orders, barcode labels, and generates stock reports — all offline on Windows.',
  keywords: [
    'inventory management software Bhutan',
    'inventory management Bhutan',
    'stock management software Bhutan',
    'stock tracking software Bhutan',
    'warehouse management Bhutan',
    'inventory software Bhutan',
    'stock control software Bhutan',
    'real time inventory Bhutan',
    'low stock alert software Bhutan',
    'barcode inventory Bhutan',
    'purchase order software Bhutan',
    'inventory software Thimphu',
    'inventory software Phuntsholing',
    'shop stock management Bhutan',
  ],
})

const faqs = [
  {
    question: 'How does Jinda POS track inventory in real time?',
    answer:
      'Every sale automatically deducts stock from your inventory. Every purchase order automatically adds to stock. Jinda maintains an accurate, real-time count of all product quantities, values, and movement history — even across multiple categories and suppliers.',
  },
  {
    question: 'Does Jinda send alerts for low stock items?',
    answer:
      'Yes. You can set a minimum stock quantity (reorder level) for each product. When stock falls below that level, Jinda highlights the item and can generate a restock list. This prevents stockouts for fast-moving items.',
  },
  {
    question: 'Can I manage purchase orders for suppliers in Bhutan?',
    answer:
      'Yes. Jinda has a full Purchase Order module. Create POs for any supplier, track delivery, and when goods arrive, receiving the PO automatically updates your inventory and creates the corresponding accounting entry.',
  },
  {
    question: 'Does Jinda support barcode labels for inventory?',
    answer:
      'Yes. Print custom barcode sticker labels for any product directly from Jinda using a label printer or standard thermal printer. Barcodes include product name, price, and barcode number for fast scanning at checkout.',
  },
]

export default function InventoryManagementBhutanPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://jindapos.com' },
          { name: 'Inventory Management Software in Bhutan', url: 'https://jindapos.com/inventory-management-bhutan' },
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
              Real-Time Inventory for Bhutan Businesses
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Inventory Management Software for Bhutan
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              Track every product, manage suppliers, receive low-stock alerts, print barcode labels, and generate stock reports — all in one offline inventory system built for Bhutanese shops.
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
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Real-Time Stock Updates</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Low Stock Alerts</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-bhutan-gold" /> Barcode Labels</span>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Complete Stock Management for Bhutan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
              Manage thousands of products across multiple categories, suppliers, and price tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Real-Time Stock Tracking</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Stock levels update instantly on every sale, purchase, return, or adjustment. Know the exact quantity and value of every product at any time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Low Stock Alerts</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Set reorder levels for every product. Jinda alerts you when stock drops below the threshold so you never run out of fast-selling items.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Tags className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Barcode Label Printing</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Design and print custom barcode stickers for your products directly from Jinda. Use those barcodes at checkout for instant scan-to-bill speed.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Purchase Order Management</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Create purchase orders for suppliers and track delivery status. Receiving a PO automatically updates inventory and creates accounting entries.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Stock Reports & Valuation</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Generate stock valuation reports (FIFO / average cost), movement history, slow-moving items, and top-selling product analysis — exportable to Excel.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all">
              <CardContent className="p-0 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Unlimited Products</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Add unlimited products with categories, variants, multiple price tiers (retail, wholesale, dealer), supplier cost, and margin tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-12 bg-bhutan-maroon text-white">
          <div className="container px-4 md:px-6 mx-auto max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: 'Unlimited', label: 'Products Supported' },
                { stat: 'Real-time', label: 'Stock Updates' },
                { stat: '100%', label: 'Offline Operation' },
                { stat: '< 5 sec', label: 'Barcode Scan Speed' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-3xl font-black text-bhutan-gold">{item.stat}</div>
                  <div className="text-sm font-bold text-white/80 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 md:py-24 container px-4 md:px-6 mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
              Inventory Management FAQs — Bhutan
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
              Start Managing Inventory for Your Bhutan Business — Free Trial
            </h2>
            <p className="text-slate-300 font-medium">
              7-day free trial. Unlimited products. No credit card. Works offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/download">
                <Button size="lg" className="w-full sm:w-auto bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black px-10 h-14 rounded-xl text-base shadow-xl">
                  <Download className="mr-2 h-5 w-5" /> Download Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold px-10 h-14 rounded-xl text-base">
                  See Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
