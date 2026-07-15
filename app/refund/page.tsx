import { Undo2, XCircle, CreditCard, RotateCcw, AlertTriangle, HelpCircle, Clock, Ban, FileCheck, Zap, RefreshCcw, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
    title: 'Refund Policy - Jinda',
    description: 'Refund and cancellation policy for Jinda POS software. Learn about eligibility, processing times, non-refundable items, and how to request a refund.',
}

interface Section {
    icon: typeof Undo2
    title: string
    content: string
    points?: string[]
}

export default function RefundPage() {
    const sections: Section[] = [
        {
            icon: Zap,
            title: 'Try Before You Buy — 7-Day Free Trial',
            content: 'We offer a fully-featured 7-day free trial so you can test Jinda POS on your hardware, with your products, and in your shop before spending any money. No credit card is required to start the trial. We strongly encourage you to use the trial thoroughly before purchasing a paid license.',
            points: [
                'The trial includes all 20+ features — nothing is locked or limited.',
                'No credit card or payment required to start.',
                'You can test with unlimited products, customers, and transactions.',
                'If the Software does not work for you during the trial, simply let it expire — no charges.',
            ],
        },
        {
            icon: Undo2,
            title: 'Refund Eligibility',
            content: 'If you purchase a paid license and are not satisfied, you may request a refund within 14 days of your purchase date. Refund requests made after 14 days will not be eligible, except in cases where the Software is non-functional and our support team cannot resolve the issue.',
            points: [
                'Refund window: 14 days from the date of purchase.',
                'The license key must not be permanently activated on more than one computer.',
                'You must provide your Order ID, License Key, and the reason for the refund.',
                'Refunds are only available for first-time purchases — renewals are non-refundable (see below).',
            ],
        },
        {
            icon: FileCheck,
            title: 'When Refunds Are Granted',
            content: 'We want every customer to be satisfied. Refunds are typically approved in the following situations:',
            points: [
                'The Software does not work as described on your hardware and our support team cannot fix the issue.',
                'The Software has a critical bug that prevents core functionality (sales, invoicing, accounting) and we cannot provide a fix within a reasonable time.',
                'You accidentally purchased a license without using the free trial first, and you request a refund within 48 hours of purchase without activating the license.',
                'You were charged in error due to a system malfunction.',
            ],
        },
        {
            icon: Ban,
            title: 'When Refunds Are Denied',
            content: 'To keep our refund process fair for everyone, the following situations are not eligible for a refund:',
            points: [
                'The refund request is made after the 14-day eligibility window.',
                'You have already used the Software extensively (e.g., processed many transactions over several days) and simply changed your mind.',
                'The issue is caused by your hardware, operating system, or third-party software — not by Jinda itself.',
                'You failed to contact our support team to attempt a resolution before requesting a refund.',
                'The license key has been shared, transferred, or used on multiple computers in violation of the License Agreement.',
                'The request is for a license renewal (see Renewal Refunds section below).',
            ],
        },
        {
            icon: XCircle,
            title: 'Cancelling Auto-Renewal',
            content: 'If you have enabled auto-renewal for your license, you can cancel it at any time before the renewal date. Cancellation stops future charges but does not refund the current term.',
            points: [
                'Cancellation takes effect immediately — no future charges will occur.',
                'Your license remains active until the end of your current paid term.',
                'You will continue to receive software updates and support until your license expires.',
                'After cancellation, you can manually renew if you change your mind before expiry.',
            ],
        },
        {
            icon: RefreshCcw,
            title: 'Renewal Refunds',
            content: 'License renewals are processed as new transactions. Because you have already used the Software for a full term and know what to expect, renewals are non-refundable except in cases of billing errors or system malfunction.',
            points: [
                'If you were charged for a renewal you did not authorize, contact us immediately for a full refund.',
                'If you cancel auto-renewal before the charge occurs, no refund is needed (no charge was made).',
                'If a renewal charge has already been processed and you did not intend to renew, contact us within 48 hours of the charge.',
            ],
        },
        {
            icon: RotateCcw,
            title: 'Non-Refundable Items',
            content: 'Certain services and situations are non-refundable once they have been delivered or completed:',
            points: [
                'Remote setup and installation services — non-refundable once the session is completed.',
                'On-site training sessions — non-refundable once delivered.',
                'Custom feature development — non-refundable once development work has begun.',
                'License keys that have been extensively used (determined by our support team based on usage data).',
                'Refunds for purchases made more than 14 days ago.',
            ],
        },
        {
            icon: CreditCard,
            title: 'How Refunds Are Processed',
            content: 'Approved refunds are returned through the original payment method used for the purchase. The processing time depends on your bank or payment provider.',
            points: [
                'Refunds are initiated within 3 business days of approval.',
                'Bank transfers: 5-10 business days to appear in your account.',
                'Credit/debit cards: 5-10 business days, depending on your card issuer.',
                'Digital wallets (mBOB, BNB Pay, etc.): 3-7 business days.',
                'You will receive an email confirmation when the refund is initiated.',
            ],
        },
        {
            icon: Clock,
            title: 'Refund Processing Timeline',
            content: 'From the moment you submit a refund request to the moment the money reaches your account, here is what to expect:',
            points: [
                'Step 1: Submit request via email — we acknowledge within 24 hours.',
                'Step 2: Support review (we may contact you to troubleshoot) — up to 3 business days.',
                'Step 3: Decision and approval notification — within 3 business days of review.',
                'Step 4: Refund initiated to your payment method — within 3 business days of approval.',
                'Step 5: Funds appear in your account — 5-10 business days (depends on your bank).',
            ],
        },
        {
            icon: AlertTriangle,
            title: 'Chargebacks',
            content: 'If you believe a charge is incorrect, please contact us first before initiating a chargeback with your bank. We are committed to resolving billing disputes quickly and fairly.',
            points: [
                'Contact us at dhisumtseyig@gmail.com before filing a chargeback — we can usually resolve it faster.',
                'Frivolous or fraudulent chargebacks may result in immediate license termination without refund.',
                'If a chargeback is filed and resolved in our favor, the original charge stands and no refund will be issued.',
                'We reserve the right to dispute chargebacks we believe are filed in bad faith.',
            ],
        },
        {
            icon: RefreshCcw,
            title: 'Plan Changes and Upgrades',
            content: 'If you upgrade from one plan to another, the price difference is charged at the time of upgrade. Downgrades or refunds for plan differences are not available mid-term, but you can downgrade at renewal time.',
            points: [
                'Upgrades: pay the price difference — effective immediately.',
                'Downgrades: apply at the next renewal — no refund for the current term.',
                'You can change plans at any time by contacting us.',
                'Your data is always preserved when changing plans.',
            ],
        },
        {
            icon: HelpCircle,
            title: 'How to Request a Refund',
            content: 'To request a refund, email us with the details below. The more information you provide, the faster we can process your request.',
            points: [
                'Email: dhisumtseyig@gmail.com',
                'Subject: "Refund Request — [Your License Key]"',
                'Include: Your Order ID (from your purchase confirmation email).',
                'Include: Your License Key (found in the app under Help > License Info).',
                'Include: Your name and email used during purchase.',
                'Include: A clear reason for the refund request.',
                'If the issue is technical, describe what happened and what you expected.',
            ],
        },
        {
            icon: Shield,
            title: 'Our Commitment to You',
            content: 'We stand behind Jinda POS. If you are not happy, we want to know. Our support team will do everything possible to resolve your issue before a refund becomes necessary. We are a small Bhutanese company, and every customer matters to us.',
            points: [
                'We respond to all refund requests within 24 hours.',
                'We will attempt to resolve your issue before processing a refund.',
                'If a refund is warranted, we process it quickly and without hassle.',
                'Your feedback helps us improve Jinda for all Bhutanese businesses.',
            ],
        },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Hero Header */}
            <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-bhutan-maroon-dark py-20 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-bhutan-maroon/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <Badge className="bg-bhutan-gold text-bhutan-maroon-dark border-none px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-[10px]">Return Policy</Badge>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Refund Policy</h1>
                        <p className="text-sm md:text-lg text-white/60 font-medium leading-relaxed">
                            Fair and transparent refund rules. Try Jinda free for 7 days before you buy — and if you are not satisfied, we will make it right.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {sections.map((section, i) => (
                                <Card key={i} className="group border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-bhutan-maroon/5 transition-all duration-500 rounded-[2rem] overflow-hidden">
                                    <CardContent className="p-8 space-y-4">
                                        <div className="h-12 w-12 rounded-2xl bg-bhutan-maroon/10 text-bhutan-maroon flex items-center justify-center group-hover:bg-bhutan-maroon group-hover:text-white transition-all duration-500">
                                            <section.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{section.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            {section.content}
                                        </p>
                                        {section.points && (
                                            <ul className="space-y-2 pt-2">
                                                {section.points.map((point, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                        <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-bhutan-maroon dark:bg-bhutan-gold" />
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-16 p-8 md:p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Still Have Questions?</h2>
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
                                <p>
                                    We recommend using the 7-day free trial first. If you face any issues, contact our support team before requesting a refund — most problems can be fixed quickly.
                                </p>
                                <p>
                                    Email us at <span className="text-bhutan-maroon font-black">dhisumtseyig@gmail.com</span> with your Order ID and License Key, and we will help you right away.
                                </p>
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Updated: July 2026
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
