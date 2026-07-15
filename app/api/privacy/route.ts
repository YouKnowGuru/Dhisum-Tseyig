import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const privacyPolicy = {
    title: 'Privacy Policy',
    lastUpdated: 'July 2026',
    contactEmail: 'dhisumtseyig@gmail.com',
    sections: [
      {
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
        title: 'We Do Not Share or Sell Your Data',
        content: 'We never sell, trade, rent, or share your personal information with third parties for marketing or commercial purposes. The only exception is trusted service providers who help us operate the platform, and they are contractually required to keep your information confidential.',
        points: [
          'We do not sell your email address or phone number to anyone.',
          'We do not share your data for advertising purposes.',
          'We do not use your data to train AI models.',
          'We will only disclose information if legally required by Bhutanese law or a court order.',
        ],
      },
      {
        title: 'Your Rights',
        content: 'You have full control over your personal information. Since your business data is stored locally on your computer, you can delete it at any time. For your account information stored on our servers, you have the right to access, correct, delete, and export your data.',
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
        title: "Children's Privacy",
        content: 'Jinda POS is a business application designed for shop owners, retailers, and business operators. It is not directed at children under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.',
      },
      {
        title: 'Changes to This Policy',
        content: 'We may update this privacy policy from time to time to reflect changes in our practices, legal requirements, or the features we offer. When we make material changes, we will update the "Last Updated" date at the bottom of this page.',
        points: [
          'Material changes will be posted on this page with an updated date.',
          'For significant changes affecting your data, we will notify you by email if possible.',
          'Continued use of the software after changes constitutes acceptance of the updated policy.',
        ],
      },
    ],
  }

  return NextResponse.json(privacyPolicy)
}
