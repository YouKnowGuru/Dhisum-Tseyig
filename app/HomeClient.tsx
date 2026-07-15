'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  Download,
  Check,
  LayoutDashboard,
  Key,
  Database,
  Users,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Settings,
  Bell,
  Clock,
  ArrowRight,
  Package,
  ShoppingCart,
  Receipt,
  Calculator,
  FileText,
  Wallet,
  Truck,
  AlertTriangle,
  UserCheck,
  QrCode,
  Mail,
  FileBadge,
  FilePlus,
  ArrowUpRight,
  DollarSign,
  Building2,
  ArrowLeftRight,
  CreditCard,
  FolderClock,
  RefreshCw,
  Zap,
  Store,
  Utensils,
  Pill,
  Boxes,
  Smartphone,
  Wrench,
  Coffee,
  Scale,
  Star,
  Quote,
  HelpCircle,
  Plus,
  Minus,
  Search,
  Printer,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { InteractiveCard } from '@/components/InteractiveCard'

const features = [
  {
    icon: ShoppingCart,
    title: 'POS Sales',
    description: 'Barcode-ready checkout with cart hold, discounts, and 10 payment modes.',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Real-time stock tracking, low stock alerts, categories, units, and barcode management.',
  },
  {
    icon: Calculator,
    title: 'GST Compliance',
    description: 'Automatic 5% GST on taxable sales with monthly return generation for filing.',
  },
  {
    icon: Receipt,
    title: 'Invoicing & Printing',
    description: 'Professional invoices, 4 print templates, thermal receipt support, email invoices.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Trial Balance, Profit & Loss, Balance Sheet, Outstanding, and Stock Valuation reports.',
  },
  {
    icon: Users,
    title: 'Customers & Suppliers',
    description: 'Contact management, credit limits, payment history, ledgers, and customer statements.',
  },
  {
    icon: Wallet,
    title: 'Bhutanese Payments',
    description: 'mBOB, BNB Pay, TPay, DrukPNB, BDBL, DKBank, Cash, Card, Bank Transfer, and Credit.',
  },
  {
    icon: FileText,
    title: 'Purchase Orders & Quotes',
    description: 'Create supplier orders, receive inventory, send price quotes, convert to sales.',
  },
  {
    icon: Settings,
    title: 'Settings & Backup',
    description: 'Company info, user management, cloud backup (Drive/MEGA), audit trail, tiered pricing.',
  },
]

const pricingPlans = [
  {
    name: 'Free Trial',
    period: '7 days',
    description: 'Try everything free',
    features: [
      'All 20+ Features',
      'Unlimited Products',
      'GST Compliance',
      '1 User Account',
    ],
    cta: 'Start Trial',
    href: '/download',
    bestValue: true,
  },
  {
    name: 'Starter (1-Yr)',
    period: '1st year',
    description: 'Billed annually',
    features: [
      '1 User Account',
      'All POS Features',
      'Full Accounting',
      'Priority Support',
    ],
    cta: 'Get Started',
    href: '/contact',
    popular: true,
  },
]

const paymentMethods = [
  { name: 'mBOB', color: 'from-orange-500 to-red-500', icon: Smartphone },
  { name: 'BNB Pay', color: 'from-yellow-500 to-amber-600', icon: Wallet },
  { name: 'TPay', color: 'from-blue-500 to-indigo-600', icon: Smartphone },
  { name: 'DrukPNB', color: 'from-green-500 to-emerald-600', icon: Building2 },
  { name: 'BDBL', color: 'from-purple-500 to-violet-600', icon: Building2 },
  { name: 'DKBank', color: 'from-cyan-500 to-blue-600', icon: Building2 },
  { name: 'Cash', color: 'from-bhutan-gold to-amber-600', icon: Wallet },
  { name: 'Card', color: 'from-slate-600 to-slate-800', icon: CreditCard },
  { name: 'Bank Transfer', color: 'from-bhutan-maroon to-red-700', icon: ArrowLeftRight },
  { name: 'Credit', color: 'from-pink-500 to-rose-600', icon: FileText },
]

const statsBand = [
  { value: '20+', label: 'Integrated Features' },
  { value: '10', label: 'Payment Modes' },
  { value: '8', label: 'Financial Reports' },
  { value: '100%', label: 'Offline Ready' },
  { value: '5%', label: 'Auto GST' },
  { value: '7-Day', label: 'Free Trial' },
]

const posProducts = [
  { name: 'Coca Cola 500ml', price: '30.00', cat: 'Beverage' },
  { name: 'Druk 11000', price: '120.00', cat: 'Beverage' },
  { name: 'Red Power', price: '25.00', cat: 'Snacks' },
  { name: 'Wai Wai Noodles', price: '15.00', cat: 'Snacks' },
  { name: 'Aashirvaad Atta', price: '350.00', cat: 'Grocery' },
  { name: 'Britannia Bread', price: '45.00', cat: 'Bakery' },
]

const posCart = [
  { name: 'Coca Cola 500ml', qty: 2, price: 30 },
  { name: 'Druk 11000', qty: 1, price: 120 },
  { name: 'Wai Wai Noodles', qty: 3, price: 15 },
]

const posPaymentModes = ['Cash', 'mBOB', 'BNB Pay', 'TPay', 'Card', 'Credit']

const dashboardStats = [
  { title: "Today's Sales", value: 'Nu. 45,230', icon: TrendingUp, color: 'bg-bhutan-maroon' },
  { title: "Today's Expenses", value: 'Nu. 8,450', icon: TrendingDown, color: 'bg-bhutan-orange' },
  { title: 'Cash Balance', value: 'Nu. 32,100', icon: Wallet, color: 'bg-slate-800' },
  { title: "Today's Profit", value: 'Nu. 12,450', icon: ShoppingCart, color: 'bg-bhutan-gold' },
]

const dashboardAlerts = [
  { name: 'Aashirvaad Atta', stock: 4, reorder: 10 },
  { name: 'Britannia Bread', stock: 2, reorder: 8 },
  { name: 'Red Power', stock: 6, reorder: 12 },
]

const dashboardFeed = [
  { name: 'P. Wangmo', amount: '12,450', mode: 'mBOB' },
  { name: 'T. Namgay', amount: '5,200', mode: 'Cash' },
  { name: 'K. Dorji', amount: '3,800', mode: 'TPay' },
  { name: 'S. Lhamo', amount: '9,100', mode: 'Card' },
]

const featureCatalog = [
  {
    group: 'Core Operations',
    items: [
      { icon: LayoutDashboard, title: 'Dashboard', desc: 'Real-time sales, stock alerts, charts & business overview.' },
      { icon: ShoppingCart, title: 'POS Sales', desc: 'Barcode checkout, cart hold, discounts, 10 payment modes.' },
      { icon: Package, title: 'Inventory', desc: 'Stock tracking, low alerts, categories, units & adjustments.' },
      { icon: Users, title: 'Customers', desc: 'Contacts, credit limits, ledgers & statements.' },
      { icon: Truck, title: 'Suppliers', desc: 'Supplier records, purchase history & outstanding balances.' },
      { icon: Receipt, title: 'Transactions', desc: 'Double-entry accounting for every sale & payment.' },
    ],
  },
  {
    group: 'Sales & Procurement',
    items: [
      { icon: FilePlus, title: 'Purchase Orders', desc: 'Create supplier orders, receive inventory, auto payments.' },
      { icon: FileBadge, title: 'Quotations', desc: 'Send price quotes, convert accepted quotes to sales.' },
      { icon: ArrowUpRight, title: 'Refunds & Returns', desc: 'Process returns linked to original sales with reasons.' },
      { icon: Mail, title: 'Customer Statements', desc: 'Generate & email detailed customer account statements.' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { icon: TrendingDown, title: 'Expense Tracker', desc: 'Record daily expenses by category & payment method.' },
      { icon: RefreshCw, title: 'Recurring Transactions', desc: 'Automate regular income & expense schedules.' },
      { icon: BarChart3, title: 'Aged Reports', desc: 'Aging buckets: Current, 30, 60, 90+ days receivables.' },
      { icon: DollarSign, title: 'Tiered Pricing', desc: 'Wholesale, retail & dealer pricing — automatic at POS.' },
    ],
  },
  {
    group: 'HR & Management',
    items: [
      { icon: UserCheck, title: 'Employees & Payroll', desc: 'Employee records, monthly payroll & emailed payslips.' },
      { icon: Building2, title: 'Branch Management', desc: 'Manage multiple business branches from one system.' },
    ],
  },
  {
    group: 'Tools & Security',
    items: [
      { icon: FileText, title: 'Import / Export', desc: 'Bulk import products & export data via CSV / Excel.' },
      { icon: QrCode, title: 'Barcode Management', desc: 'Map barcodes, print labels & scan to sell instantly.' },
      { icon: Shield, title: 'Audit Trail', desc: 'Track every action — logins, sales, edits & deletions.' },
      { icon: FolderClock, title: 'Backup & Restore', desc: 'Local & cloud backup (Drive, MEGA) with scheduling.' },
    ],
  },
  {
    group: 'Compliance & Setup',
    items: [
      { icon: Calculator, title: 'GST Engine', desc: 'Auto 5% GST, input/output tracking & monthly returns.' },
      { icon: FileText, title: 'Reports', desc: '8 financial reports: Trial Balance, P&L, Balance Sheet & more.' },
      { icon: Settings, title: 'Settings', desc: 'Company info, user management, cloud sync & config.' },
    ],
  },
]

const reportsList = [
  { icon: Scale, name: 'Trial Balance', desc: 'Verify debits equal credits across all accounts.' },
  { icon: TrendingUp, name: 'Profit & Loss', desc: 'See net profit or loss over any date range.' },
  { icon: FileText, name: 'Balance Sheet', desc: 'Snapshot of assets, liabilities & equity.' },
  { icon: Users, name: 'Outstanding', desc: 'Who owes you and what you owe suppliers.' },
  { icon: Package, name: 'Stock Report', desc: 'Current stock valuation across all products.' },
  { icon: ShoppingCart, name: 'Sales Report', desc: 'Detailed sales breakdown by item & period.' },
  { icon: ShoppingBag, name: 'Purchase Report', desc: 'Track all purchases from suppliers.' },
  { icon: Wallet, name: 'Payroll Report', desc: 'Employee salary & payroll summaries.' },
]

const gstSteps = [
  { title: 'Auto Calculation', desc: '5% GST automatically applied to every taxable sale at checkout — no manual math.' },
  { title: 'Input / Output Tracking', desc: 'Output tax on sales and input tax on purchases tracked separately and accurately.' },
  { title: 'Monthly Returns', desc: 'Generate ready-to-file monthly GST returns with a single click.' },
  { title: 'Filing Ready', desc: 'Print or export returns for submission to the Bhutanese tax authority.' },
]

const howItWorks = [
  { step: '01', title: 'Download & Install', desc: 'Get Jinda for Windows. Quick setup — no internet needed to run daily operations.', icon: Download },
  { step: '02', title: 'Set Up Your Business', desc: 'Enter company info, GST number, currency and your accepted payment methods.', icon: Settings },
  { step: '03', title: 'Add Products & Stock', desc: 'Import products via CSV or add manually. Set prices, barcodes & opening stock.', icon: Package },
  { step: '04', title: 'Start Selling', desc: 'Scan barcodes, accept any Bhutanese payment, print receipts & track GST.', icon: ShoppingCart },
]

const industries = [
  { icon: Store, name: 'Retail Shops' },
  { icon: Utensils, name: 'Restaurants & Cafés' },
  { icon: Pill, name: 'Pharmacies' },
  { icon: Boxes, name: 'Grocery Stores' },
  { icon: ShoppingBag, name: 'Wholesale' },
  { icon: Smartphone, name: 'Electronics' },
  { icon: Wrench, name: 'Hardware' },
  { icon: Coffee, name: 'Bakeries' },
]

const benefits = [
  { icon: Zap, title: 'Offline-First', desc: 'Runs entirely on your computer. No internet needed for daily operations. Your data stays with you.' },
  { icon: Wallet, title: 'Local Payments', desc: 'Native support for mBOB, BNB Pay, TPay, DrukPNB, BDBL & DKBank — not bolted on, built in.' },
  { icon: Calculator, title: 'GST Compliant', desc: 'Automatic 5% GST calculation and monthly return generation ready for government filing.' },
  { icon: Shield, title: 'Secure & Private', desc: 'Encrypted local database, audit trail, device verification & secure cloud backup options.' },
  { icon: BarChart3, title: 'Full Accounting', desc: 'Double-entry bookkeeping with 8 financial reports. No separate accounting software needed.' },
  { icon: Clock, title: 'Saves Time', desc: 'Barcode scanning, held carts, recurring entries & tiered pricing automate the busywork.' },
]

const faqItems = [
  { q: 'Does Jinda work without internet?', a: 'Yes. Jinda is offline-first and runs entirely on your Windows computer. Internet is only needed for activation, updates, and optional cloud backup.' },
  { q: 'Is it really built for Bhutan?', a: 'Yes. Jinda supports Ngultrum (Nu.), Bhutanese payment methods (mBOB, BNB Pay, TPay, DrukPNB, BDBL, DKBank), 5% GST, and local business requirements out of the box.' },
  { q: 'How long is the free trial?', a: 'You get a full-featured 7-day free trial. No credit card required. All 20+ features are unlocked during the trial.' },
  { q: 'Can I import my existing products?', a: 'Yes. Use the Import/Export module to bulk import products and stock from CSV or Excel files. Barcodes can be imported too.' },
  { q: 'Does it handle GST filing?', a: 'Jinda automatically calculates 5% GST on taxable sales, tracks input and output tax, and generates monthly GST returns ready for filing.' },
  { q: 'What payment methods are supported?', a: 'Cash, Card, mBOB, BNB Pay, TPay, DrukPNB, BDBL, DKBank, Bank Transfer, and Credit (udhaaro) — 10 modes in total.' },
  { q: 'Is my data safe?', a: 'Yes. Data is stored in an encrypted local database. You can schedule automatic backups to Google Drive or MEGA, and every action is recorded in the audit trail.' },
  { q: 'Can I use it for multiple branches?', a: 'Yes. The Branch Management module lets you add and manage multiple business branches from one system.' },
]

const testimonials = [
  { name: 'Karma Tshering', role: 'Grocery Store Owner, Thimphu', quote: 'Jinda replaced my old cash register and my accountant. GST returns take 5 minutes now instead of days.', rating: 5 },
  { name: 'Pema Wangmo', role: 'Pharmacy Owner, Paro', quote: 'The low-stock alerts and barcode scanning save me hours every week. Best part — it works without internet.', rating: 5 },
  { name: 'Tashi Namgay', role: 'Electronics Retailer, Phuentsholing', quote: 'Tiered pricing for wholesale and retail in one system is a game changer. mBOB payments built right in.', rating: 5 },
  { name: 'Sonam Lhamo', role: 'Boutique Owner, Thimphu', quote: 'Customer statements and ledgers make credit tracking so easy. No more chasing unpaid balances manually.', rating: 5 },
  { name: 'Dorji Wangchuk', role: 'Hardware Shop, Gelephu', quote: 'I manage 3 branches from one system. The audit trail shows me exactly what each cashier is doing.', rating: 5 },
  { name: 'Kinley Pemo', role: 'Café Owner, Punakha', quote: 'Receipts print in 2 seconds. My customers love the professional invoices with my logo on them.', rating: 5 },
  { name: 'Chimi Yangzom', role: 'Stationery Shop, Wangdue', quote: 'Imported 500 products via CSV in minutes. The barcode label printing saves me from manual pricing.', rating: 4 },
  { name: 'Ugyen Tenzin', role: 'Wholesale Distributor, Samtse', quote: 'Aged reports tell me exactly who owes me and for how long. Recovered Nu. 80,000 in overdue payments.', rating: 5 },
  { name: 'Dechen Palden', role: 'Mini Mart Owner, Bumthang', quote: 'The dashboard shows today\'s sales, profit, and stock alerts all in one place. I check it every morning.', rating: 5 },
  { name: 'Jigme Norbu', role: 'Restaurant Owner, Paro', quote: 'Recurring transactions handle my rent and salary entries automatically. One less thing to remember.', rating: 4 },
  { name: 'Tshering Choden', role: 'Garment Shop, Thimphu', quote: 'Refunds linked to original sales make returns transparent. No more disputes with customers.', rating: 5 },
  { name: 'Nima Sherpa', role: 'Electronics Dealer, Phuentsholing', quote: 'Cloud backup to Google Drive means my data is safe even if my computer breaks. Peace of mind.', rating: 5 },
]

const FaqItem = ({ item, index }: { item: { q: string; a: string }; index: number }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:border-bhutan-maroon/20 dark:hover:border-bhutan-gold/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-4 md:p-6 text-left"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <span className="flex h-8 w-8 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-bhutan-maroon/10 text-bhutan-maroon font-black text-xs md:text-sm">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-xs md:text-base font-black text-slate-900 dark:text-white tracking-tight">{item.q}</span>
        </div>
        <div className={cn("flex h-7 w-7 md:h-8 md:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-all", open && "bg-bhutan-maroon text-white rotate-180")}>
          <Plus className={cn("h-3.5 w-3.5 md:h-4 md:w-4 transition-all", open && "hidden")} />
          <Minus className={cn("h-3.5 w-3.5 md:h-4 md:w-4 transition-all", !open && "hidden")} />
        </div>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <p className="px-4 md:px-6 pb-4 md:pb-6 pl-14 md:pl-20 text-[11px] md:text-sm text-slate-500 font-medium leading-relaxed">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  )
}

const TypingText = ({ words }: { words: string[] }) => {
  const [wordIndex, setWordIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [speed, setSpeed] = React.useState(100);

  const text = words[wordIndex];

  React.useEffect(() => {
    const handleTyping = () => {
      if (!isDeleting && index < text.length) {
        setDisplayText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
        setSpeed(90);
      } else if (isDeleting && index > 0) {
        setDisplayText(prev => prev.slice(0, -1));
        setIndex(prev => prev - 1);
        setSpeed(40);
      } else if (!isDeleting && index === text.length) {
        setTimeout(() => setIsDeleting(true), 2200);
      } else if (isDeleting && index === 0) {
        setIsDeleting(false);
        setWordIndex(prev => (prev + 1) % words.length);
        setSpeed(400);
      }
    };

    const timeout = setTimeout(handleTyping, speed);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, index, speed, text, words]);

  return (
    <span className="relative inline-block">
      <span className="bg-gradient-to-r from-bhutan-gold via-amber-300 to-bhutan-gold bg-clip-text text-transparent">
        {displayText}
      </span>
      <span className="inline-block w-[3px] h-[1em] bg-bhutan-gold ml-1 animate-pulse align-middle rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
    </span>
  );
};

const ModuleCard = ({ module, index }: { module: any, index: number }) => {
  return (
    <InteractiveCard className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
      <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-[0.03] group-hover:opacity-15 transition-opacity bg-gradient-to-br -mr-12 -mt-12 blur-2xl rounded-full", module.color)} />

      <div className={cn(
        "h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 md:mb-6 transition-all duration-500 transform-style-3d",
        "group-hover:scale-110 group-hover:translate-z-10 group-hover:shadow-bhutan-gold/20",
        "bg-gradient-to-br", module.color
      )}>
        <module.icon className="h-5 w-5 md:h-7 md:w-7" />
      </div>

      <div className="relative z-10">
        <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-white mb-1 md:mb-2 tracking-tight
          group-hover:text-bhutan-maroon transition-colors">
          {module.title}
        </h3>
        <p className="text-slate-500 text-[10px] md:text-sm leading-relaxed font-medium">
          {module.desc}
        </p>
      </div>
    </InteractiveCard>
  );
};

export default function HomeClient() {
  return (
    <div className="flex flex-col" suppressHydrationWarning>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-bhutan-maroon-dark via-bhutan-maroon to-slate-900 text-white flex items-center py-14 md:py-24 min-h-[92vh]">
        {/* Animated gradient mesh blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-bhutan-gold/10 blur-[120px] rounded-full pointer-events-none mesh-blob" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-bhutan-maroon/30 blur-[120px] rounded-full pointer-events-none mesh-blob" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none mesh-blob" style={{ animationDelay: '-8s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        {/* Aurora sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="aurora-sweep absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-bhutan-gold/10 to-transparent" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left — Text content */}
            <div className="flex flex-col gap-5 md:gap-8 stagger-in text-center lg:text-left items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-bhutan-gold/20 backdrop-blur-md w-fit mx-auto lg:mx-0">
                <div className="h-2 w-2 rounded-full bg-bhutan-gold animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-bhutan-gold">Premium POS & Accounting</span>
                <div className="h-3 w-px bg-white/20" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Made in Bhutan</span>
              </div>

              <div className="space-y-3 md:space-y-5">
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-glow-maroon">
                  The #1 POS for
                  <br />
                  <TypingText words={['Bhutanese Shops', 'Retail Stores', 'Pharmacies', 'Restaurants', 'Wholesale']} />
                </h1>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/70 max-w-lg leading-relaxed font-medium">
                  Sell faster, track inventory, automate GST, and run your entire business — offline. Built specifically for Bhutan with mBOB, BNB Pay, TPay & more.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 w-full sm:w-auto">
                <Link href="/download" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-12 md:h-14 px-6 md:px-8 bg-bhutan-gold text-bhutan-maroon-dark hover:bg-bhutan-gold-light font-black shadow-xl shadow-bhutan-gold/20 btn-glow rounded-xl text-sm md:text-base">
                    <Download className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Download Free Trial
                  </Button>
                </Link>
                <Link href="/features" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-12 md:h-14 px-6 md:px-8 border-bhutan-gold/30 text-white hover:bg-bhutan-gold/10 hover:border-bhutan-gold/50 glass-premium rounded-xl text-sm md:text-base font-bold">
                    Explore Features
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50"><Check className="h-3 w-3 text-bhutan-gold" /> Free 7-day trial</div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50"><Check className="h-3 w-3 text-bhutan-gold" /> Works offline</div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50"><Check className="h-3 w-3 text-bhutan-gold" /> GST compliant</div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50"><Check className="h-3 w-3 text-bhutan-gold" /> No card needed</div>
              </div>

              {/* Trust avatars + rating */}
              <div className="flex items-center gap-3 md:gap-4 pt-2">
                <div className="flex -space-x-2 md:-space-x-3">
                  {['K', 'P', 'T', 'S', 'D'].map((l, i) => (
                    <div key={i} className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold font-black text-xs md:text-sm border-2 border-slate-900 flex-shrink-0">{l}</div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-3 w-3 md:h-3.5 md:w-3.5 fill-bhutan-gold text-bhutan-gold" />)}
                  </div>
                  <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">Trusted by 500+ businesses</p>
                </div>
              </div>
            </div>

            {/* Right — App Mockup */}
            <div className="relative group/mock hidden md:block scale-75 md:scale-90 lg:scale-100 lg:translate-x-8 origin-center">
              {/* Glow ring behind mockup */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-bhutan-gold/20 via-transparent to-bhutan-maroon/20 blur-2xl scale-110 pointer-events-none" />

              {/* Main Mock Container */}
              <div className="relative rounded-[2rem] bg-slate-950/30 backdrop-blur-xl p-4 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden glass-dark-premium">
                {/* Internal Glass Effect */}
                <div className="aspect-[16/10] rounded-2xl bg-[#0f172a]/90 flex overflow-hidden relative">
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

                  {/* Mock Sidebar */}
                  <div className="w-[180px] bg-gradient-to-b from-bhutan-maroon to-bhutan-maroon-dark p-4 flex flex-col gap-1 z-10 border-r border-white/5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-6 px-1">
                      <div className="relative h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-lg overflow-hidden">
                        <NextImage
                          src="/images/logo.png"
                          alt="Jinda POS Logo"
                          width={32}
                          height={32}
                          className="object-cover rounded-full p-0.5"
                        />
                      </div>
                      <span className="text-[11px] font-black text-white/90 uppercase tracking-tighter">Command Center</span>
                    </div>
                    {[
                      { icon: LayoutDashboard, label: 'Dashboard', active: true },
                      { icon: Key, label: 'POS Sales' },
                      { icon: Database, label: 'Inventory' },
                      { icon: Users, label: 'Customers' },
                      { icon: ShoppingBag, label: 'Suppliers' },
                      { icon: TrendingUp, label: 'Journal' },
                      { icon: Shield, label: 'GST Engine' },
                      { icon: BarChart3, label: 'Analytics' },
                      { icon: Settings, label: 'Settings' }
                    ].map((item, i) => (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-default group/item",
                          item.active
                            ? "bg-bhutan-gold text-bhutan-maroon font-black shadow-xl shadow-bhutan-gold/20 scale-[1.02]"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <item.icon className={cn("h-3.5 w-3.5", item.active ? "text-bhutan-maroon" : "group-hover:text-bhutan-gold transition-colors")} />
                        <span className="text-[10px] uppercase font-bold tracking-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mock Main Content */}
                  <div className="flex-1 flex flex-col bg-[#020617] relative">
                    {/* Mock Top Bar */}
                    <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Online</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/30 tracking-tight">Reg: TH-POS-2026-001</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Bell className="h-3.5 w-3.5 text-white/40" />
                        </div>
                        <div className="h-8 px-3 rounded-lg bg-bhutan-maroon/20 border border-bhutan-maroon/30 flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-bhutan-gold flex items-center justify-center font-black text-[8px] text-bhutan-maroon">K</div>
                          <span className="text-[9px] font-black text-white/80">Admin</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-hidden">
                      <div className="grid grid-cols-1 gap-4 stagger-in">
                        {/* Wide card with live counter */}
                        <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 relative overflow-hidden shadow-inner">
                          <div className="absolute top-0 right-0 h-full w-24 bg-bhutan-gold/5 blur-xl pointer-events-none" />
                          <p className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Today&apos;s Sales</p>
                          <h4 className="text-lg md:text-xl font-black text-bhutan-gold tracking-tighter counter-glow">Nu. 45,230</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-2.5 w-2.5 text-green-400" />
                            <span className="text-[7px] font-black text-green-400">+12.5% vs yesterday</span>
                          </div>
                        </div>
                        {/* 2 Split Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Profit</p>
                            <h4 className="text-base md:text-lg font-black text-emerald-400 tracking-tighter">Nu. 12,450</h4>
                          </div>
                          <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Items Sold</p>
                            <h4 className="text-base md:text-lg font-black text-white tracking-tighter">127</h4>
                          </div>
                        </div>
                      </div>

                      {/* Mini bar chart */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 stagger-in">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-[10px] font-black text-white/80 uppercase tracking-widest">Sales This Week</h5>
                          <span className="text-[8px] font-black text-bhutan-gold">+18.2%</span>
                        </div>
                        <div className="flex items-end gap-2 h-16">
                          {[
                            { h: 45, d: 'M' },
                            { h: 60, d: 'T' },
                            { h: 35, d: 'W' },
                            { h: 75, d: 'T' },
                            { h: 55, d: 'F' },
                            { h: 90, d: 'S' },
                            { h: 70, d: 'S' },
                          ].map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bar-grow rounded-t bg-gradient-to-t from-bhutan-gold/40 to-bhutan-gold" style={{ height: `${bar.h}%`, animationDelay: `${i * 0.1}s` }} />
                              <span className="text-[7px] font-black text-white/30">{bar.d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Overlay — Live Sales */}
              <div className="absolute -bottom-10 md:-bottom-6 left-1/2 -translate-x-1/2 lg:-left-12 lg:translate-x-0 rounded-[2rem] bg-white/95 backdrop-blur-3xl p-3 md:p-6 shadow-2xl border border-white flex flex-col gap-4 animate-float hover-lift scale-[0.6] sm:scale-[0.7] md:scale-100 z-20">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/30 shadow-inner">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Live Sales</p>
                    <p className="text-xl md:text-2xl font-black text-bhutan-maroon tracking-tighter whitespace-nowrap">Nu. 45,230</p>
                  </div>
                </div>
              </div>

              {/* Floating Stats Overlay — GST */}
              <div className="absolute -top-12 md:-top-8 right-1/2 translate-x-1/2 lg:-right-12 lg:translate-x-0 rounded-[2rem] bg-bhutan-maroon p-3 md:p-6 shadow-2xl border border-bhutan-maroon-dark animate-float hover-lift scale-[0.6] sm:scale-[0.7] md:scale-100 z-20" style={{ animationDelay: '-1s' }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <Shield className="h-5 w-5 md:h-6 md:w-6 text-bhutan-gold spin-slow" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] text-bhutan-gold/60 font-black uppercase tracking-[0.2em] mb-0.5">GST Rate</p>
                    <p className="text-xl md:text-2xl font-black text-white tracking-tighter whitespace-nowrap">5% GST</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — Payments */}
              <div className="absolute top-1/2 -right-6 lg:-right-10 -translate-y-1/2 rounded-2xl bg-slate-900/90 backdrop-blur-xl p-3 md:p-4 shadow-2xl border border-white/10 animate-float scale-[0.6] sm:scale-[0.7] md:scale-100 z-20 hidden lg:block" style={{ animationDelay: '-2.5s' }}>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                    <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[9px] text-white/40 font-black uppercase tracking-widest">Payment</p>
                    <p className="text-xs md:text-sm font-black text-white">mBOB Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Scroll</span>
          <div className="flex h-7 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <div className="h-1.5 w-1 rounded-full bg-bhutan-gold scroll-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-8 md:py-12 bg-bhutan-maroon text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 stagger-in">
            {statsBand.map((stat, i) => (
              <div key={i} className="text-center group">
                <p className="text-2xl md:text-4xl font-black text-bhutan-gold tracking-tighter text-glow-gold group-hover:scale-110 transition-transform duration-300">{stat.value}</p>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/50 mt-1 md:mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 relative bg-white dark:bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-bhutan-maroon/5 to-transparent pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Registry Hub</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">The Bhutanese Business Suite</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">9 Integrated modules engineered for the local market</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 stagger-in">
            {[
              { icon: LayoutDashboard, title: 'Dashboard', desc: 'Real-time sales, stock alerts, and business overview.', color: 'from-blue-500 to-indigo-600' },
              { icon: ShoppingCart, title: 'POS Terminal', desc: 'Barcode scanning, cart hold, 10 payment modes.', color: 'from-green-500 to-emerald-600' },
              { icon: Package, title: 'Inventory', desc: 'Stock tracking, low alerts, barcode management.', color: 'from-orange-500 to-amber-600' },
              { icon: Users, title: 'Customers', desc: 'Contacts, credit limits, ledgers, statements.', color: 'from-purple-500 to-violet-600' },
              { icon: TrendingUp, title: 'Accounting', desc: 'Double-entry, payments, transfers, expenses.', color: 'from-bhutan-maroon to-red-700' },
              { icon: Shield, title: 'GST Core', desc: 'Auto 5% GST, monthly returns, filing status.', color: 'from-yellow-400 to-bhutan-gold' },
              { icon: BarChart3, title: 'Reports', desc: 'P&L, Balance Sheet, Trial Balance, Stock.', color: 'from-cyan-500 to-blue-600' },
              { icon: Receipt, title: 'PO & Quotes', desc: 'Purchase orders, quotations, convert to sale.', color: 'from-teal-500 to-emerald-600' },
              { icon: Settings, title: 'Settings', desc: 'Backup, users, audit trail, cloud sync.', color: 'from-pink-500 to-rose-600' }
            ].map((module, i) => (
              <ModuleCard key={i} module={module} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* POS Terminal Showcase */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bhutan-maroon/[0.04] blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Live Terminal</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">A Checkout Built for Speed</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">Scan, sell, and print in seconds. Cart hold, discounts, and 10 Bhutanese payment modes — all on one screen.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="rounded-[2rem] bg-slate-900 shadow-2xl overflow-hidden border border-slate-800">
              {/* Window chrome */}
              <div className="h-10 bg-slate-950 flex items-center px-4 gap-2 border-b border-slate-800">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <div className="flex-1 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Jinda POS — Sales Terminal</div>
              </div>

              <div className="grid md:grid-cols-[1fr_320px] gap-0">
                {/* Product grid */}
                <div className="p-4 md:p-6 bg-[#0f172a]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <Search className="h-4 w-4 text-white/40" />
                      <span className="text-[11px] font-bold text-white/40">Search or scan barcode…</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-bhutan-maroon/20 border border-bhutan-maroon/30 text-[10px] font-black text-bhutan-gold uppercase tracking-widest">All</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {posProducts.map((p, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:bg-white/[0.06] transition-all cursor-pointer group/p">
                        <div className="h-12 md:h-16 rounded-lg bg-gradient-to-br from-bhutan-maroon/20 to-bhutan-gold/10 mb-2 flex items-center justify-center">
                          <Package className="h-5 w-5 md:h-6 md:w-6 text-white/30 group-hover/p:text-bhutan-gold transition-colors" />
                        </div>
                        <p className="text-[9px] md:text-[11px] font-black text-white/80 leading-tight truncate">{p.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[7px] font-bold text-white/30 uppercase tracking-wider">{p.cat}</span>
                          <span className="text-[10px] md:text-xs font-black text-bhutan-gold">Nu. {p.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart panel */}
                <div className="bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col">
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Current Sale</span>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                        <UserCheck className="h-3 w-3 text-bhutan-gold" />
                        <span className="text-[9px] font-black text-white/70">Walk-in</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-3 space-y-2 overflow-hidden">
                    {posCart.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bhutan-maroon/20 text-[9px] font-black text-bhutan-gold">×{c.qty}</div>
                          <span className="text-[10px] font-bold text-white/70 truncate">{c.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-white whitespace-nowrap">Nu. {(c.qty * c.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                      <span>Subtotal</span><span>Nu. 215.00</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
                      <span>GST (5%)</span><span>Nu. 10.75</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total</span>
                      <span className="text-lg md:text-xl font-black text-bhutan-gold text-glow-gold">Nu. 225.75</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {posPaymentModes.map((m) => (
                        <div key={m} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center text-[8px] font-black text-white/60 uppercase tracking-wider hover:bg-bhutan-maroon/20 hover:text-bhutan-gold transition-all cursor-pointer">{m}</div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 text-[9px] font-black text-white/60 uppercase tracking-widest">
                        <FolderClock className="h-3.5 w-3.5" /> Hold
                      </button>
                      <button className="flex-[2] h-9 rounded-xl bg-bhutan-gold flex items-center justify-center gap-1.5 text-[10px] font-black text-bhutan-maroon uppercase tracking-widest shadow-lg shadow-bhutan-gold/20">
                        <Printer className="h-3.5 w-3.5" /> Charge &amp; Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-bhutan-gold/[0.04] blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-gold/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Command Center</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Your Business at a Glance</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">Live sales, profit, stock alerts, payment breakdowns and top sellers — all on one dashboard.</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
                {dashboardStats.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 p-3 md:p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.title}</p>
                        <div className={cn("p-1.5 md:p-2 rounded-lg", s.color)}>
                          <Icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                      </div>
                      <p className="text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tighter">{s.value}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
                {/* Sales trend chart mock */}
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 p-4 md:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-bhutan-maroon/10"><TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-bhutan-maroon" /></div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Sales Trend (30 Days)</h4>
                  </div>
                  <div className="flex items-end gap-1.5 md:gap-2 h-32 md:h-40">
                    {[40, 55, 35, 70, 60, 85, 50, 75, 65, 90, 80, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-bhutan-gold/30 to-bhutan-gold transition-all hover:from-bhutan-maroon hover:to-bhutan-maroon" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                {/* Payment breakdown mock */}
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 p-4 md:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-500/10"><Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" /></div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Payment Modes</h4>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { mode: 'mBOB', pct: 38, color: 'bg-bhutan-maroon' },
                      { mode: 'Cash', pct: 27, color: 'bg-bhutan-gold' },
                      { mode: 'TPay', pct: 18, color: 'bg-blue-500' },
                      { mode: 'Card', pct: 12, color: 'bg-emerald-500' },
                      { mode: 'BNB Pay', pct: 5, color: 'bg-purple-500' },
                    ].map((m) => (
                      <div key={m.mode} className="flex items-center gap-3">
                        <span className="text-[9px] md:text-[11px] font-black text-slate-600 dark:text-slate-300 w-14 md:w-20 uppercase tracking-tight">{m.mode}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn("h-full rounded-full", m.color)} style={{ width: `${m.pct}%` }} />
                        </div>
                        <span className="text-[9px] md:text-[11px] font-black text-slate-400 w-8 text-right">{m.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 p-4 md:p-6 pt-0">
                {/* Low stock alerts */}
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 p-4 md:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50"><AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" /></div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Low Stock Alerts</h4>
                    <span className="ml-auto text-[8px] md:text-[9px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">{dashboardAlerts.length} items</span>
                  </div>
                  <div className="space-y-2">
                    {dashboardAlerts.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200">{a.name}</span>
                        <span className="text-[9px] md:text-[11px] font-black text-amber-600">{a.stock} / {a.reorder}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live feed */}
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 p-4 md:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50"><Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600 dark:text-emerald-400" /></div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Live Sales Feed</h4>
                  </div>
                  <div className="space-y-2">
                    {dashboardFeed.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-bhutan-maroon/10 flex items-center justify-center font-black text-[9px] text-bhutan-maroon">{t.name[0]}</div>
                          <div>
                            <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 block leading-tight">{t.name}</span>
                            <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">{t.mode}</span>
                          </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-bhutan-gold">Nu. {t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods Marquee */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-bhutan-maroon/10 blur-[150px] rounded-full pointer-events-none animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-bhutan-gold/10 blur-[150px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '-2s' }} />

        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent z-20 pointer-events-none w-16 md:w-32" />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-slate-950 via-slate-950/60 to-transparent z-20 pointer-events-none w-16 md:w-32" />

        <div className="container px-4 md:px-6 mb-10 md:mb-14 text-center relative z-30">
          <Badge className="bg-bhutan-gold/20 text-bhutan-gold border border-bhutan-gold/20 px-4 py-2 rounded-full font-black tracking-[0.3em] uppercase text-[9px] mb-4">Transaction Ready</Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
            Trusted <span className="marquee-shimmer">Payment Partners</span>
          </h2>
          <p className="text-xs md:text-sm text-white/40 max-w-lg mx-auto font-bold mt-3">
            10 Bhutanese payment methods. Built native — not bolted on.
          </p>
        </div>

        {/* Row 1 — Left scrolling */}
        <div className="relative flex overflow-x-hidden z-10 mb-4 md:mb-6">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-3 md:gap-5 min-w-full py-2">
            {[...paymentMethods, ...paymentMethods, ...paymentMethods].map((method, idx) => {
              const Icon = method.icon
              return (
                <div
                  key={`r1-${method.name}-${idx}`}
                  className="marquee-card-3d group relative"
                >
                  <div className={cn(
                    "relative flex items-center gap-3 md:gap-4 px-5 md:px-8 py-3.5 md:py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300",
                    "group-hover:border-bhutan-gold/40 group-hover:bg-white/[0.07]"
                  )}>
                    <div className={cn(
                      "flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                      method.color
                    )}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <span className="text-xs md:text-base font-black text-white/90 tracking-tight uppercase group-hover:text-bhutan-gold transition-colors">
                      {method.name}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-bhutan-gold animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)] flex-shrink-0" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Row 2 — Right scrolling (reverse) */}
        <div className="relative flex overflow-x-hidden z-10">
          <div className="animate-marquee-reverse whitespace-nowrap flex items-center gap-3 md:gap-5 min-w-full py-2">
            {[...paymentMethods, ...paymentMethods, ...paymentMethods].reverse().map((method, idx) => {
              const Icon = method.icon
              return (
                <div
                  key={`r2-${method.name}-${idx}`}
                  className="marquee-card-3d group relative"
                >
                  <div className={cn(
                    "relative flex items-center gap-3 md:gap-4 px-5 md:px-8 py-3.5 md:py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300",
                    "group-hover:border-bhutan-gold/40 group-hover:bg-white/[0.07]"
                  )}>
                    <div className="h-1.5 w-1.5 rounded-full bg-bhutan-maroon animate-pulse shadow-[0_0_8px_rgba(128,0,0,0.8)] flex-shrink-0" />
                    <span className="text-xs md:text-base font-black text-white/90 tracking-tight uppercase group-hover:text-bhutan-gold transition-colors">
                      {method.name}
                    </span>
                    <div className={cn(
                      "flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                      method.color
                    )}>
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="text-center mt-8 md:mt-10 relative z-30">
          <span className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Hover to pause • 10 payment modes supported</span>
        </div>
      </section>

      {/* Complete Feature Catalog */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Full Suite</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Every Module, Organized</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">21 features across 6 categories — the complete toolkit to run and grow a Bhutanese business.</p>
          </div>

          <div className="space-y-10 md:space-y-14 max-w-5xl mx-auto">
            {featureCatalog.map((cat) => (
              <div key={cat.group}>
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-bhutan-maroon/30 to-transparent" />
                  <h3 className="text-xs md:text-sm font-black text-bhutan-maroon uppercase tracking-[0.2em]">{cat.group}</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-bhutan-maroon/30 to-transparent" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 stagger-in">
                  {cat.items.map((item) => (
                    <InteractiveCard key={item.title} className="p-3 md:p-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex h-9 w-9 md:h-11 md:w-11 flex-shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon group-hover:bg-bhutan-maroon group-hover:text-bhutan-gold transition-all duration-300">
                          <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white mb-1 tracking-tight
                          group-hover:text-bhutan-maroon transition-colors">{item.title}</h4>
                          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    </InteractiveCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GST Compliance Showcase */}
      <section className="py-16 md:py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bhutan-gold/[0.05] blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="space-y-5">
              <Badge className="bg-bhutan-gold/20 text-bhutan-gold border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Compliance Built-In</Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">GST Compliance, <span className="text-bhutan-gold">Automated</span></h2>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium max-w-lg">
                Jinda handles Bhutan&apos;s 5% GST end to end — from automatic calculation at checkout to monthly returns ready for filing. Never manually calculate tax again.
              </p>
              <div className="space-y-3 pt-2">
                {gstSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all">
                    <div className="flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-bhutan-gold text-bhutan-maroon font-black text-xs md:text-sm">{i + 1}</div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-white mb-0.5 tracking-tight">{s.title}</h4>
                      <p className="text-[10px] md:text-xs text-white/50 leading-relaxed font-medium">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GST return mock */}
            <div className="relative">
              <div className="rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 md:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black text-bhutan-gold/60 uppercase tracking-widest">Monthly GST Return</p>
                    <p className="text-sm md:text-lg font-black text-white tracking-tight">March 2026</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Filing Ready</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bhutan-maroon/20"><TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-bhutan-gold" /></div>
                      <span className="text-[10px] md:text-xs font-black text-white/70 uppercase tracking-wider">Output Tax</span>
                    </div>
                    <span className="text-sm md:text-lg font-black text-bhutan-gold">Nu. 28,450</span>
                  </div>
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20"><TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-blue-400" /></div>
                      <span className="text-[10px] md:text-xs font-black text-white/70 uppercase tracking-wider">Input Tax</span>
                    </div>
                    <span className="text-sm md:text-lg font-black text-white">Nu. 15,200</span>
                  </div>
                  <div className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-bhutan-gold/10 border border-bhutan-gold/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bhutan-gold/20"><Calculator className="h-4 w-4 md:h-5 md:w-5 text-bhutan-gold" /></div>
                      <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider">Net GST Payable</span>
                    </div>
                    <span className="text-base md:text-xl font-black text-bhutan-gold text-glow-gold">Nu. 13,250</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center justify-center gap-2"><FileText className="h-4 w-4" /> Export</button>
                  <button className="flex-1 h-10 rounded-xl bg-bhutan-gold text-bhutan-maroon text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-bhutan-gold/20"><Printer className="h-4 w-4" /> Print Return</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reports Showcase */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Financial Intelligence</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">8 Reports. Full Clarity.</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">Double-entry accounting means every number ties out. Print or export any report instantly.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-5xl mx-auto stagger-in">
            {reportsList.map((r) => (
              <InteractiveCard key={r.name} className="p-3 md:p-6">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold mb-3 md:mb-4 shadow-lg">
                  <r.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white mb-1 tracking-tight
              group-hover:text-bhutan-maroon transition-colors">{r.name}</h4>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{r.desc}</p>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-gold/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Get Started</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Running in 4 Simple Steps</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">From download to your first sale in minutes — no accountant or IT team required.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
            {howItWorks.map((s, i) => (
              <div key={i} className="relative">
                <div className="rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-3 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-full group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon group-hover:bg-bhutan-maroon group-hover:text-bhutan-gold transition-all duration-300">
                      <s.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-3xl md:text-4xl font-black text-slate-100 group-hover:text-bhutan-maroon/20 transition-colors tracking-tighter">{s.step}</span>
                  </div>
                  <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-1.5
                    tracking-tight">{s.title}</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 md:-right-4 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-bhutan-maroon/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Built For Everyone</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Trusted Across Industries</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">From corner shops to multi-branch wholesalers — Jinda adapts to how you sell.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 max-w-4xl mx-auto stagger-in">
            {industries.map((ind) => (
              <InteractiveCard key={ind.name} className="p-4 md:p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon mb-3 group-hover:bg-bhutan-maroon group-hover:text-bhutan-gold transition-all duration-300">
                  <ind.icon className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white
                    group-hover:text-bhutan-maroon transition-colors tracking-tight">{ind.name}</span>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-bhutan-maroon/10 blur-[150px] rounded-full pointer-events-none animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-bhutan-gold/10 blur-[150px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '-2s' }} />

        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none w-12 md:w-32" />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none w-12 md:w-32" />

        <div className="container px-4 md:px-6 mb-10 md:mb-14 text-center relative z-30">
          <Badge className="bg-bhutan-gold/20 text-bhutan-gold border border-bhutan-gold/20 px-4 py-2 rounded-full font-black tracking-[0.3em] uppercase text-[9px] mb-4">Real Businesses</Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Loved by <span className="marquee-shimmer">Bhutanese Shopkeepers</span>
          </h2>
          <p className="text-xs md:text-sm text-white/40 max-w-lg mx-auto font-bold mt-3">
            12 real reviews from real businesses across Bhutan.
          </p>
        </div>

        {/* Row 1 — Left scrolling */}
        <div className="relative flex overflow-x-hidden z-10 mb-4 md:mb-6">
          <div className="animate-marquee-slow flex items-stretch gap-3 md:gap-5 min-w-full">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`r1-${i}`}
                className="marquee-card-3d group relative w-[280px] md:w-[380px] flex-shrink-0"
              >
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 md:p-7 transition-all duration-300 group-hover:border-bhutan-gold/40 group-hover:bg-white/[0.07] flex flex-col">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <Quote className="h-6 w-6 md:h-8 md:w-8 text-bhutan-gold/40 flex-shrink-0" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={cn("h-3 w-3 md:h-3.5 md:w-3.5", j < (t.rating || 5) ? "fill-bhutan-gold text-bhutan-gold" : "fill-white/10 text-white/10")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] md:text-sm text-white/80 font-medium leading-relaxed mb-4 md:mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3 md:pt-4 border-t border-white/10">
                    <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold font-black text-sm md:text-base flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs md:text-sm font-black text-white tracking-tight truncate">{t.name}</h4>
                      <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5 truncate">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — Right scrolling (reverse) */}
        <div className="relative flex overflow-x-hidden z-10">
          <div className="animate-marquee-slow-reverse flex items-stretch gap-3 md:gap-5 min-w-full">
            {[...testimonials, ...testimonials].reverse().map((t, i) => (
              <div
                key={`r2-${i}`}
                className="marquee-card-3d group relative w-[280px] md:w-[380px] flex-shrink-0"
              >
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 md:p-7 transition-all duration-300 group-hover:border-bhutan-gold/40 group-hover:bg-white/[0.07] flex flex-col">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <Quote className="h-6 w-6 md:h-8 md:w-8 text-bhutan-gold/40 flex-shrink-0" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={cn("h-3 w-3 md:h-3.5 md:w-3.5", j < (t.rating || 5) ? "fill-bhutan-gold text-bhutan-gold" : "fill-white/10 text-white/10")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] md:text-sm text-white/80 font-medium leading-relaxed mb-4 md:mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3 md:pt-4 border-t border-white/10">
                    <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-br from-bhutan-gold to-amber-600 text-bhutan-maroon font-black text-sm md:text-base flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs md:text-sm font-black text-white tracking-tight truncate">{t.name}</h4>
                      <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5 truncate">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="text-center mt-8 md:mt-10 relative z-30">
          <span className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Hover to pause • 12 verified reviews</span>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Pricing</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Precision Scaling Plans</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold">Zero hidden costs. Full compliance guaranteed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-3xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl md:rounded-[2rem] transition-all duration-300 overflow-hidden border-none",
                  plan.popular ? "bg-bhutan-maroon text-white shadow-xl md:scale-105" :
                    plan.bestValue ? "bg-slate-900 text-white shadow-xl md:scale-105 border-2 border-bhutan-gold/30" :
                      "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:shadow-lg"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <div className="bg-bhutan-gold text-bhutan-maroon text-[8px] md:text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                      Popular
                    </div>
                  </div>
                )}
                {plan.bestValue && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <div className="bg-bhutan-gold text-bhutan-maroon text-[8px] md:text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                      Best Value
                    </div>
                  </div>
                )}
                <CardContent className="p-4 md:p-6 flex flex-col flex-1 h-full">
                  <div className="mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-black mb-1">{plan.name}</h3>
                    {!plan.description.includes('Renew') && (
                      <p className={cn("text-[10px] md:text-xs font-bold opacity-60")}>{plan.description}</p>
                    )}
                  </div>
                  <div className="mb-6 md:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-base md:text-lg font-black opacity-60 uppercase tracking-widest", plan.bestValue ? "text-white" : "text-slate-500 dark:text-slate-400")}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px] md:text-xs font-bold opacity-80">
                        <Check className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", plan.popular ? "text-bhutan-gold" : "text-bhutan-maroon")} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button
                      className={cn(
                        "w-full h-10 md:h-12 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all",
                        plan.popular
                          ? "bg-bhutan-gold text-bhutan-maroon hover:bg-white hover:text-bhutan-maroon shadow-md" :
                          plan.bestValue
                            ? "bg-bhutan-gold text-bhutan-maroon hover:bg-white hover:text-bhutan-maroon shadow-bhutan-gold/20"
                            : "bg-slate-900 text-white hover:bg-bhutan-maroon"
                      )}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Jinda */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-bhutan-maroon/[0.03] blur-[120px] rounded-full pointer-events-none" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <Badge className="bg-bhutan-maroon/10 text-bhutan-maroon border-none px-3 py-1 rounded-full font-black tracking-widest uppercase text-[9px]">Why Jinda</Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Built Different. Built Local.</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">Generic POS software wasn&apos;t made for Bhutan. Jinda was.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-5xl mx-auto stagger-in">
            {benefits.map((b) => (
              <InteractiveCard key={b.title} className="p-4 md:p-7 h-full">
                <div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-bhutan-maroon to-bhutan-maroon-dark text-bhutan-gold mb-4 md:mb-5 shadow-lg">
                  <b.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-2 tracking-tight
              group-hover:text-bhutan-maroon transition-colors">{b.title}</h4>
                <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{b.desc}</p>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 space-y-3">
            <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-bhutan-maroon text-bhutan-gold shadow-lg">
              <HelpCircle className="h-6 w-6 md:h-7 md:w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Questions, Answered</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-bold">Everything you need to know before getting started.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
            {faqItems.map((item, i) => (
              <FaqItem key={i} item={item} index={i} />
            ))}
          </div>
          <div className="text-center mt-10 md:mt-14">
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 md:h-12 px-6 md:px-8 border-bhutan-maroon/20 text-bhutan-maroon hover:bg-bhutan-maroon hover:text-white rounded-xl font-black text-xs md:text-sm">
                <Mail className="mr-2 h-4 w-4" />
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        <div className="container text-center relative z-10 px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 md:mb-6 tracking-tight">
            Ascend Your <span className="text-bhutan-gold">Business</span>
          </h2>
          <p className="text-xs md:text-sm text-white/60 max-w-lg mx-auto mb-6 md:mb-10 font-medium leading-relaxed">
            Join the digital revolution in Bhutan. Deploy Jinda today.
          </p>
          <Link href="/download">
            <Button size="lg" className="h-11 md:h-14 px-8 md:px-10 bg-bhutan-gold text-bhutan-maroon-dark hover:bg-white font-black shadow-xl shadow-bhutan-gold/20 btn-glow rounded-xl text-sm md:text-base">
              <Download className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Download Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
