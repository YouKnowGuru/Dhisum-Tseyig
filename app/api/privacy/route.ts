import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const privacyPolicy = {
    title: 'Privacy Policy',
    lastUpdated: 'April 2026',
    sections: [
      {
        title: 'Where Your Data Is Stored',
        content: 'Your business data — sales, inventory, customers — is stored on your own computer in a local SQLite database. We do not collect or store your daily business transactions on our servers.',
      },
      {
        title: 'What Information We Collect',
        content: 'We only collect basic account information needed for license activation: your name, email, phone number, and a unique hardware ID from your computer. We do not track your location, browsing habits, or business activities.',
      },
      {
        title: 'How We Protect Your Data',
        content: 'Account information is encrypted and stored securely. Your business data on your computer is under your control — we recommend regular backups to external drives or cloud storage.',
      },
      {
        title: 'We Do Not Share Your Data',
        content: 'We never sell, trade, or share your personal information with third parties. The only exception is trusted service providers who help us operate the platform, and they are required to keep your information confidential.',
      },
      {
        title: 'Changes to This Policy',
        content: 'We may update this policy from time to time. Any changes will be posted on this page with an updated date. We encourage you to review this page periodically.',
      },
      {
        title: 'Your Rights',
        content: 'You can request to see, correct, or delete your personal account information at any time by emailing us at dhisumtseyig@gmail.com.',
      },
    ],
    contactEmail: 'dhisumtseyig@gmail.com',
  }

  return NextResponse.json(privacyPolicy)
}
