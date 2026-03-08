import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  Package,
  Calculator,
  Shield,
  Zap,
  Database,
  Wallet,
  Clock,
  Printer,
  Truck,
  FileText,
} from 'lucide-react'

const mainFeatures = [
  {
    icon: ShoppingCart,
    title: 'POS Sales',
    description: 'Process sales quickly with an intuitive cart-based interface. Search products, manage quantities, apply discounts, and check out in seconds.',
    highlights: ['Quick product search', 'Cart management', 'Multiple payment modes', 'Instant receipt printing'],
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Keep track of all your products with real-time stock levels. Get automatic low stock alerts and manage multiple categories and units.',
    highlights: ['Real-time stock tracking', 'Low stock alerts', 'Categories & units', 'Stock adjustments & history'],
  },
  {
    icon: Calculator,
    title: 'GST Compliance',
    description: 'Automatic 5% GST calculation on all taxable transactions per Bhutanese regulation (Jan 2026). Generate and print reports monthly.',
    highlights: ['Auto 5% GST calculation', 'Input & Output tracking', 'Report generation', 'Filing status tracking'],
  },
  {
    icon: Receipt,
    title: 'Invoicing & Billing',
    description: 'Create professional branded invoices for both retail and wholesale. Track payment status, manage due dates, and handle partial payments.',
    highlights: ['Custom branded invoices', 'Payment status tracking', 'Due date management', 'Duplicate invoice printing'],
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Make data-driven decisions with comprehensive financial reports including Trial Balance, Profit & Loss, Balance Sheet, and stock valuation.',
    highlights: ['Trial Balance', 'Profit & Loss statement', 'Balance Sheet', 'Stock valuation report'],
  },
  {
    icon: Users,
    title: 'Customer & Supplier Management',
    description: 'Manage all your business contacts in one place. Track credit limits, payment history, outstanding balances, and overdue accounts.',
    highlights: ['Customer & supplier ledgers', 'Credit limit tracking', 'Outstanding balances', 'Overdue payment alerts'],
  },
]

const additionalFeatures = [
  {
    icon: Wallet,
    title: 'Bhutanese Payment Methods',
    description: 'Support for all major Bhutanese payment platforms: mBOB, BNB, TPay, DrukPNB, BDBL, DKBank, plus cash and card.',
  },
  {
    icon: Shield,
    title: 'Double-Entry Accounting',
    description: 'Full chart of accounts with automatic journal entries. Every transaction is properly recorded with debit/credit entries.',
  },
  {
    icon: Database,
    title: 'Offline-First Design',
    description: 'Runs entirely on your local machine with SQLite database. No internet required for daily operations — your data stays with you.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized SQLite database and Electron framework ensure blazing fast performance, even with thousands of products and transactions.',
  },
  {
    icon: Printer,
    title: 'Receipt & Report Printing',
    description: 'Professional receipt printing with your business logo. Print invoices, GST returns, financial reports, and customer ledgers.',
  },
  {
    icon: Clock,
    title: 'Backup & Restore',
    description: 'Schedule automatic backups or create manual backups anytime. Restore data from any backup point with one click.',
  },
]

import { InteractiveCard } from '@/components/InteractiveCard'

import { Badge } from '@/components/ui/badge'

const paymentMethods = [
  'mBOB', 'BNB', 'TPay', 'DrukPNB', 'BDBL', 'DKBank', 'Cash', 'Card', 'Transfer', 'Credit'
]

export const metadata = {
  title: 'Features - Dhisum Tseyig',
  description: 'Explore the powerful features of Dhisum Tseyig — the complete POS and accounting solution for Bhutanese businesses.',
}

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-bhutan-maroon-dark to-bhutan-maroon py-10 md:py-14 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-bhutan-gold opacity-5 blur-[80px] md:blur-[120px] rounded-full" />
        <div className="container relative z-10 px-4 md:px-6">
          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-3 tracking-tight leading-tight">9 Powerful Modules for Your Business</h1>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed font-medium">
              From point-of-sale to GST compliance — everything you need to run your Bhutanese business efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-10 md:py-14">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
            {mainFeatures.map((feature) => (
              <InteractiveCard key={feature.title} className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex-shrink-0 group-hover:bg-bhutan-maroon group-hover:text-bhutan-gold transition-all duration-300 transform-style-3d group-hover:scale-110">
                    <feature.icon className="h-4 w-4 md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-black mb-1 tracking-tight group-hover:text-bhutan-maroon transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground mb-3 text-[10px] md:text-xs leading-relaxed font-medium">{feature.description}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold opacity-80">
                          <div className="h-1 w-1 rounded-full bg-bhutan-maroon flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-10 md:py-14 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-3 tracking-tight">And Much More</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
              Built-in features that make Dhisum Tseyig the perfect choice.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {additionalFeatures.map((feature) => (
              <InteractiveCard key={feature.title} className="p-3 md:p-5">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-bhutan-maroon/10 text-bhutan-maroon mb-3 group-hover:bg-bhutan-maroon group-hover:text-bhutan-gold transition-all duration-300 transform-style-3d group-hover:scale-110">
                  <feature.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <h3 className="text-xs md:text-sm font-black mb-1 tracking-tight group-hover:text-bhutan-maroon transition-colors">{feature.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods Marquee */}
      <section className="py-16 md:py-24 border-y bg-white overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 pointer-events-none w-20 md:w-40" />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-white via-transparent to-transparent z-10 pointer-events-none w-20 md:w-40" />

        <div className="container px-4 md:px-6 mb-12 text-center relative z-20">
          <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-4 py-2 rounded-full font-black tracking-[0.2em] uppercase text-[10px] mb-4">Registry Hub</Badge>
          <h2 className="text-xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">Bhutanese Payment Integration</h2>
          <p className="text-xs md:text-base text-slate-500 font-bold mt-2">Support for all major Bhutanese payment platforms.</p>
        </div>

        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-4 md:gap-8 min-w-full py-4">
            {[...paymentMethods, ...paymentMethods, ...paymentMethods].map((method, idx) => (
              <div
                key={`${method}-${idx}`}
                className="group relative"
              >
                <div className="glow-card lighting-glow bg-slate-50 px-6 md:px-10 py-4 md:py-7 rounded-2xl md:rounded-[2rem] border border-slate-100 flex items-center gap-3 md:gap-5 transition-all duration-300 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-bhutan-gold animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                  <span className="text-sm md:text-2xl font-black text-slate-800 tracking-tighter uppercase group-hover:text-bhutan-maroon transition-colors">
                    {method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
