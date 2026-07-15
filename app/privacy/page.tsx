import { Shield, Lock, Eye, FileText, Database, Bell, Cookie, Server, Trash2, Users, Globe, Baby, Brain } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
    title: 'Privacy Policy - Jinda',
    description: 'How Jinda POS handles your data. Your business data stays on your computer. Learn about data collection, encryption, your rights, and more.',
}

interface Section {
    icon: typeof Shield
    title: string
    content: string
    points?: string[]
}

export default function PrivacyPage() {
    const sections: Section[] = [
        {
            icon: Database,
            title: 'Where Your Business Data Is Stored',
            content: 'Your business data — sales, inventory, customers, suppliers, invoices, and accounting entries — is stored entirely on your own computer in a local SQLite database. We do not collect, transmit, or store your daily business transactions on our servers at any point. Your data never leaves your machine unless you explicitly choose to create a cloud backup.',
            points: [
                'All sales, inventory, and accounting data lives in a local SQLite file on your computer.',
                'No internet connection is required to use the software or access your data.',
                'You can move, copy, or back up your database file at any time — it belongs to you.',
                'Cloud backups to Google Drive or MEGA are optional and must be explicitly enabled by you.',
            ],
        },
        {
            icon: Server,
            title: 'What Information We Collect',
            content: 'We collect only the minimum information needed to activate your license, provide support, and operate the platform. This includes basic account details and a hardware identifier used to tie your license to your computer.',
            points: [
                'Your name and email address — used for account creation and license communication.',
                'Your phone number (optional) — used only if you request phone or remote support.',
                'A unique hardware ID generated from your computer components — used to prevent license sharing.',
                'Your license key and activation status — used to verify your subscription.',
                'Contact form submissions — your name, email, subject, and message are stored to respond to your inquiry.',
            ],
        },
        {
            icon: Eye,
            title: 'What We Do NOT Collect',
            content: 'We believe in data minimization. We do not collect, track, or transmit any of your business activity, personal browsing habits, or sensitive financial details to our servers.',
            points: [
                'We do not track your sales, revenue, inventory levels, or customer data.',
                'We do not monitor your browsing habits or website usage patterns.',
                'We do not collect your bank account numbers, payment credentials, or GST details.',
                'We do not use tracking cookies, advertising pixels, or third-party analytics on the desktop app.',
                'We do not record your screen, keystrokes, or camera at any time.',
            ],
        },
        {
            icon: Lock,
            title: 'How We Protect Your Data',
            content: 'We take security seriously. Your account information on our servers is protected with industry-standard practices, and your business data on your computer is entirely under your control.',
            points: [
                'Passwords are hashed using bcrypt — we never store plain-text passwords.',
                'All API communication between the app and our servers uses HTTPS/TLS encryption.',
                'License keys are cryptographically signed and verified on each activation.',
                'Your local SQLite database is stored in a non-shared directory on your computer.',
                'We recommend enabling automatic backups to prevent data loss from hardware failure.',
            ],
        },
        {
            icon: Globe,
            title: 'Third-Party Service Providers',
            content: 'To operate the licensing platform and deliver updates, we rely on a few trusted third-party providers. Each provider is bound by their own privacy and security policies, and we only share the minimum data necessary for them to perform their function.',
            points: [
                'MongoDB Atlas — hosts our license and account database (name, email, license key, hardware ID).',
                'Cloudflare R2 / AWS S3 — stores software update files for download.',
                'Gmail SMTP (Google) — sends license activation emails and support replies.',
                'Vercel — hosts the jindapos.com website and admin dashboard.',
                'None of these providers have access to your local business data.',
            ],
        },
        {
            icon: Cookie,
            title: 'Cookies and Local Storage',
            content: 'The Jinda desktop application does not use cookies. The jindapos.com website uses minimal local storage and cookies only for essential functionality. We do not use advertising or tracking cookies.',
            points: [
                'Theme preference (dark/light mode) is stored in your browser local storage.',
                'No advertising cookies (no Google Ads, Facebook Pixel, or similar trackers).',
                'No third-party analytics cookies on the website.',
                'The desktop app stores your license activation status locally on your computer.',
            ],
        },
        {
            icon: Brain,
            title: 'AI Chatbot Data Handling',
            content: 'Our website features an AI assistant ("Jinda AI") powered by Phojaa95 using OpenRouter. When you use the chatbot, your conversation messages are sent to OpenRouter to generate a response. We do not store your chat conversations on our servers.',
            points: [
                'Chat messages are sent directly from your browser to our API, then forwarded to OpenRouter.',
                'We do not save, log, or store your chat conversations on our servers.',
                'Your chat history is saved only in your own browser local storage — clear it anytime with the "Clear" button.',
                'Do not share sensitive personal information (passwords, license keys, bank details) with the chatbot.',
                'OpenRouter may temporarily process messages to generate responses, per their privacy policy.',
            ],
        },
        {
            icon: Users,
            title: 'We Do Not Share or Sell Your Data',
            content: 'We never sell, trade, rent, or share your personal information with third parties for marketing or commercial purposes. The only exception is trusted service providers who help us operate the platform (listed above), and they are contractually required to keep your information confidential.',
            points: [
                'We do not sell your email address or phone number to anyone.',
                'We do not share your data for advertising purposes.',
                'We do not use your data to train AI models.',
                'We will only disclose information if legally required by Bhutanese law or a court order.',
            ],
        },
        {
            icon: FileText,
            title: 'Your Rights',
            content: 'You have full control over your personal information. Since your business data is stored locally on your computer, you can delete it at any time by uninstalling the software or deleting the database file. For your account information stored on our servers, you have the following rights:',
            points: [
                'Access — request a copy of the personal data we hold about you.',
                'Correction — ask us to fix inaccurate or incomplete information.',
                'Deletion — request that we delete your account and associated personal data.',
                'Export — receive your data in a portable format.',
                'Withdraw consent — opt out of marketing communications at any time.',
                'To exercise any of these rights, email us at dhisumtseyig@gmail.com.',
            ],
        },
        {
            icon: Trash2,
            title: 'Data Retention',
            content: 'We retain your account information only for as long as your license is active, plus a short period after expiry for record-keeping and potential renewal. Your business data is never sent to us, so retention is entirely in your hands.',
            points: [
                'Active license accounts are retained for the duration of your license plus 90 days after expiry.',
                'Contact form submissions are retained for 12 months, then automatically deleted.',
                'You can request early deletion of your account at any time via email.',
                'Your local business data is retained on your computer until you choose to delete it.',
            ],
        },
        {
            icon: Baby,
            title: "Children's Privacy",
            content: "Jinda POS is a business application designed for shop owners, retailers, and business operators. It is not directed at children under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.",
        },
        {
            icon: Globe,
            title: 'International Users',
            content: 'Jinda POS is built in Bhutan, for Bhutanese businesses. Our servers and infrastructure are hosted outside Bhutan (MongoDB Atlas, Vercel, Cloudflare). If you are using Jinda from outside Bhutan, your data may be processed in countries with different data protection laws. By using Jinda, you consent to this transfer of data.',
        },
        {
            icon: Bell,
            title: 'Changes to This Policy',
            content: 'We may update this privacy policy from time to time to reflect changes in our practices, legal requirements, or the features we offer. When we make material changes, we will update the "Last Updated" date at the bottom of this page. We encourage you to review this page periodically to stay informed.',
            points: [
                'Material changes will be posted on this page with an updated date.',
                'For significant changes affecting your data, we will notify you by email if possible.',
                'Continued use of the software after changes constitutes acceptance of the updated policy.',
            ],
        },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Hero Header */}
            <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-bhutan-maroon-dark py-20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-bhutan-gold/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <Badge className="bg-bhutan-gold text-bhutan-maroon-dark border-none px-4 py-1.5 rounded-full font-black tracking-widest uppercase text-[10px]">Your Privacy Matters</Badge>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Privacy Policy</h1>
                        <p className="text-sm md:text-lg text-white/60 font-medium leading-relaxed">
                            Your business data belongs to you. Here is exactly how we handle your information — transparently and with respect for your privacy.
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
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Need More Information?</h2>
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
                                <p>
                                    By using Jinda, you agree to this privacy policy. If we make material changes, we will update this page and notify you where possible.
                                </p>
                                <p>
                                    If you have any questions about this policy, your data, or your rights, email us at <span className="text-bhutan-maroon font-black">dhisumtseyig@gmail.com</span> and we will respond within 3 business days.
                                </p>
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Last Updated: July 2026
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
