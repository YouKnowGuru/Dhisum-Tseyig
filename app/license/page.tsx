import { Key, Laptop, LifeBuoy, RefreshCcw, UserPlus, Zap, Shield, Ban, Clock, FileText, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
    title: 'License Agreement - Jinda',
    description: 'End User License Agreement for Jinda POS software. Learn about activation, user limits, renewals, transfers, termination, and anti-piracy rules.',
}

interface Section {
    icon: typeof Key
    title: string
    content: string
    points?: string[]
}

export default function LicensePage() {
    const sections: Section[] = [
        {
            icon: Key,
            title: 'What Your License Allows',
            content: 'When you purchase a Jinda POS license, you receive a personal, non-exclusive, non-transferable right to install and use the Software on your computer for the duration of your license term. You may use all features included in your plan during your active license period.',
            points: [
                'Full access to all 20+ features: POS sales, inventory, accounting, GST, invoicing, reports, payroll, and more.',
                'Unlimited products, customers, suppliers, and transactions.',
                'Barcode scanning, receipt printing, and all payment method support.',
                'Software updates and bug fixes included for the full license term.',
                'Technical support via email, phone, or remote assistance during business hours.',
            ],
        },
        {
            icon: Zap,
            title: 'Free Trial License',
            content: 'The 7-day free trial gives you full access to every feature in Jinda POS with no limitations. No credit card is required. The trial is intended for you to evaluate whether Jinda meets your business needs before purchasing.',
            points: [
                'Trial duration: 7 days from first activation on your computer.',
                'All features unlocked — no feature restrictions during the trial.',
                'No credit card or payment required to start.',
                'After 7 days, you must enter a valid paid license key to continue using the Software.',
                'Data created during the trial is preserved when you activate a paid license — nothing is lost.',
            ],
        },
        {
            icon: UserPlus,
            title: 'User Account Limits',
            content: 'Each license plan includes a specific number of user accounts. A user account allows one person to log in to the Software with their own username and password. To add more users, you must upgrade to a higher plan.',
            points: [
                'Starter Plan: 1 user account — ideal for single-operator shops.',
                'Growth Plan: 2 user accounts — for small teams with a second operator.',
                'Enterprise Plan: 5 user accounts — for larger businesses with multiple staff.',
                'Each user account has its own login credentials and can be assigned different permissions.',
                'User accounts cannot be shared between individuals — each user should have their own account.',
            ],
        },
        {
            icon: Laptop,
            title: 'One Computer Per License',
            content: 'Each license key is tied to a single computer based on a unique hardware identifier. This prevents license sharing and piracy while ensuring your data stays on your machine.',
            points: [
                'The hardware ID is generated from your computer components (CPU, motherboard, disk).',
                'Minor hardware changes (adding RAM, replacing a mouse) do not invalidate your license.',
                'Major changes (replacing the motherboard or computer) will require a license reset.',
                'License resets are free — contact our support team to request one.',
                'You may not use the same license key on multiple computers simultaneously.',
            ],
        },
        {
            icon: Key,
            title: 'License Activation Process',
            content: 'Activating your license is simple and requires a one-time internet connection. Once activated, the Software works fully offline.',
            points: [
                'Enter your license key in the Software under Help > Activate License.',
                'The Software connects to our licensing server to verify the key and bind it to your computer.',
                'Activation typically takes a few seconds and requires an internet connection.',
                'Once activated, no internet connection is needed for day-to-day use.',
                'If activation fails, contact support — we will resolve it quickly.',
            ],
        },
        {
            icon: ArrowRightLeft,
            title: 'License Transfer',
            content: 'If you purchase a new computer or need to move Jinda to a different machine, you can transfer your license. A license transfer deactivates the license on your old computer and activates it on the new one.',
            points: [
                'License transfers are free of charge.',
                'Contact support at dhisumtseyig@gmail.com with your license key and reason for transfer.',
                'You may transfer a license up to 3 times per year (to prevent abuse).',
                'After transfer, the old computer will no longer run the Software with that license.',
                'Your data is not transferred automatically — use the backup/restore feature to move your data.',
            ],
        },
        {
            icon: RefreshCcw,
            title: 'License Renewal',
            content: 'Licenses are valid for your chosen term: 1 year, 2 years, or 3 years from the activation date. To continue using the Software after expiry, you must renew your license. Renew before expiry to avoid any interruption.',
            points: [
                'You will receive email reminders before your license expires.',
                'Renewal rates are based on the then-current price of your plan.',
                'Renewing before expiry ensures continuous, uninterrupted use.',
                'If your license expires, your data is preserved — renew and reactivate to access it again.',
                'Auto-renewal can be enabled for convenience and cancelled anytime.',
            ],
        },
        {
            icon: Clock,
            title: 'License Expiry',
            content: 'If your license expires and you choose not to renew, the Software will enter a limited read-only mode. You can still view your data, generate reports, and export your records, but you will not be able to process new sales or create new transactions.',
            points: [
                'Expired licenses switch to read-only mode — you can view and export data but not process new entries.',
                'Your data is never deleted — it remains safe on your computer.',
                'You can renew at any time to restore full functionality.',
                'Software updates and technical support are not available for expired licenses.',
            ],
        },
        {
            icon: LifeBuoy,
            title: 'Support & Updates',
            content: 'All active licenses include free software updates and technical support for the duration of the license term. We are committed to helping you get the most out of Jinda POS.',
            points: [
                'Free software updates: new features, improvements, and bug fixes.',
                'Email support: dhisumtseyig@gmail.com — response within 24 hours on business days.',
                'Phone support: available for Growth and Enterprise plan customers.',
                'Remote assistance: our team can remotely help with setup and troubleshooting (with your permission).',
                'Support hours: Monday to Friday, 9:00 AM to 5:00 PM (Bhutan Standard Time).',
            ],
        },
        {
            icon: Shield,
            title: 'Intellectual Property Rights',
            content: 'Jinda POS is the intellectual property of Jinda POS and its founder, Mr. Keshab Baral. Your license grants you a right to use the Software — it does not transfer ownership of any kind.',
            points: [
                'The source code, design, logos, and all materials are owned by Jinda POS.',
                'The "Jinda" name and logo are trademarks of Jinda POS.',
                'You may not claim ownership of or redistribute any part of the Software.',
                'Feedback and feature requests you submit may be used by us without obligation or compensation.',
            ],
        },
        {
            icon: Ban,
            title: 'Termination',
            content: 'We may terminate your license immediately and without refund if you violate this License Agreement, the Terms of Service, or applicable laws. You may also terminate your license at any time by stopping use of the Software and contacting us to deactivate your account.',
            points: [
                'Violation of the anti-piracy clause results in immediate termination without refund.',
                'Fraudulent chargebacks or payment disputes result in license termination.',
                'Sharing license keys with unauthorized parties results in termination of all associated licenses.',
                'Upon termination, you must uninstall the Software and delete all copies.',
                'Your data remains on your computer — we cannot remotely delete it.',
            ],
        },
        {
            icon: AlertTriangle,
            title: 'Anti-Piracy',
            content: 'Piracy harms the developers who work hard to build software for Bhutanese businesses. We take piracy seriously and have implemented technical measures to detect and prevent unauthorized use.',
            points: [
                'Any attempt to bypass, crack, or circumvent the license activation system will result in immediate license termination without refund.',
                'Sharing, selling, leasing, or renting license keys to unauthorized parties is strictly prohibited.',
                'Distributing cracked, modified, or pirated copies of Jinda is illegal and will be prosecuted under Bhutanese law.',
                'We reserve the right to deactivate license keys that show signs of piracy or abuse.',
                'If you encounter a pirated copy of Jinda, please report it to dhisumtseyig@gmail.com.',
            ],
        },
        {
            icon: FileText,
            title: 'Changes to This Agreement',
            content: 'We may update this License Agreement from time to time. Changes do not retroactively affect licenses already purchased — your existing license terms remain valid until expiry. Updated terms apply to new purchases and renewals.',
            points: [
                'Changes are posted on this page with an updated date.',
                'Existing licenses are governed by the terms in effect at the time of purchase.',
                'Renewals are governed by the terms in effect at the time of renewal.',
                'Continued use of the Software after changes constitutes acceptance for new purchases.',
            ],
        },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Hero Header */}
            <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-bhutan-maroon-dark py-20 text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bhutan-gold/5 blur-[150px] rounded-full pointer-events-none" />
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <Badge className="bg-bhutan-gold text-bhutan-maroon-dark border-none px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-[10px]">License Terms</Badge>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">License Agreement</h1>
                        <p className="text-sm md:text-lg text-white/60 font-medium leading-relaxed">
                            Clear rules for activation, user limits, transfers, renewals, and anti-piracy. Read this to understand exactly how your license works.
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
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Questions About Your License?</h2>
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
                                <p>
                                    If you have questions about license activation, transfers, renewals, or user limits, we are here to help. Contact us and we will respond within 24 hours on business days.
                                </p>
                                <p>
                                    Email us at <span className="text-bhutan-maroon font-black">dhisumtseyig@gmail.com</span>
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
