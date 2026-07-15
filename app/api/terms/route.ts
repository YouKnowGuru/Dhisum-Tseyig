import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const termsOfService = {
    title: 'Terms of Service',
    effectiveDate: 'July 2026',
    contactEmail: 'dhisumtseyig@gmail.com',
    sections: [
      {
        title: 'Acceptance of Terms',
        content: 'By downloading, installing, or using Jinda POS ("the Software"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not download, install, or use the Software. These terms form a legally binding agreement between you ("the User") and Jinda POS ("the Company", "we", "us"), the company behind Jinda POS.',
        points: [
          'These terms apply to all versions of the Software, including the free trial and paid licenses.',
          'If you are using the Software on behalf of a business, you confirm you have authority to accept these terms on its behalf.',
          'If you do not agree, uninstall the Software and delete all copies from your computer.',
        ],
      },
      {
        title: 'License Grant',
        content: 'We grant you a personal, non-exclusive, non-transferable, revocable license to install and use Jinda POS on your computer for the duration of your active license or free trial. This license is subject to the restrictions in these terms and the plan you have purchased.',
        points: [
          'The free trial license is valid for 7 days from first activation, with full features.',
          'Paid licenses are valid for the term you purchased (1, 2, or 3 years) from the activation date.',
          'The number of user accounts depends on your plan: Starter (1 user), Growth (2 users), Enterprise (5 users).',
          'This license is for your use only — it cannot be shared, sold, or transferred to another party without our written consent.',
        ],
      },
      {
        title: 'Your Account',
        content: 'When you activate a license, you create an account with a username and password. You are responsible for safeguarding your account credentials and for all activity that occurs under your account.',
        points: [
          'Keep your username and password secure — do not share them with anyone.',
          'You are responsible for all actions taken under your account, including by employees or agents you grant access to.',
          'If you suspect unauthorized access, contact us immediately so we can secure your account.',
          'Each user account should be used by one person only — do not share login credentials between staff.',
          'We may suspend or terminate accounts that show suspicious or fraudulent activity.',
        ],
      },
      {
        title: 'Service Availability',
        content: 'Jinda POS is a desktop application that runs entirely on your computer. Unlike cloud-based software, it does not require an internet connection to function. However, certain features (license activation, software updates, cloud backups) do require internet access.',
        points: [
          'Core features (sales, inventory, invoicing, accounting, printing) work fully offline.',
          'License activation and re-activation require a one-time internet connection.',
          'Software updates require internet access to download.',
          'Cloud backups to Google Drive or MEGA require internet and your configured credentials.',
          'We do not guarantee uninterrupted access to our licensing servers, but downtime does not affect your ability to use the Software offline.',
        ],
      },
      {
        title: 'Acceptable Use & Prohibited Actions',
        content: 'You may not engage in any activity that violates these terms, applicable laws, or the rights of others. The following actions are strictly prohibited:',
        points: [
          'Copying, duplicating, or redistributing the Software or any part of it.',
          'Reverse engineering, decompiling, or disassembling the Software.',
          'Modifying, adapting, or creating derivative works of the Software.',
          'Attempting to bypass, crack, or circumvent the license activation system.',
          'Sharing, leasing, or renting your license key to third parties.',
          'Using the Software for any illegal activity, including fraud or money laundering.',
          'Using the Software to process transactions that violate Bhutanese law.',
          'Removing or altering any copyright, trademark, or proprietary notices.',
        ],
      },
      {
        title: 'Intellectual Property',
        content: 'Jinda POS, including its source code, design, logos, icons, documentation, and all associated materials, is the intellectual property of Jinda POS and its founder, Mr. Keshab Baral. The Software is licensed to you, not sold.',
        points: [
          'All copyrights, trademarks, and trade secrets in the Software are owned by us.',
          'You receive a limited right to use the Software — you do not own it.',
          'The "Jinda" name and logo are trademarks of Jinda POS.',
          'No part of these terms grants you any right to use our trademarks, logos, or branding.',
        ],
      },
      {
        title: 'Payment and Billing',
        content: 'Paid licenses are purchased through our website or by contacting us directly. All fees are quoted in Bhutanese Ngultrum (BTN) or USD, as displayed at the time of purchase. By purchasing a license, you agree to pay the listed price.',
        points: [
          'The 7-day free trial requires no payment and no credit card.',
          'License fees are payable upfront for the full term (1, 2, or 3 years).',
          'Prices may change at any time — existing licenses are not affected until renewal.',
          'Renewal fees are based on the then-current price of your plan.',
          'All taxes, including GST where applicable, are included in the displayed price.',
        ],
      },
      {
        title: 'Software Updates',
        content: 'We continuously improve Jinda POS with new features, bug fixes, and security patches. All active licenses include free software updates for the duration of the license term.',
        points: [
          'Updates are delivered through the in-app update checker or via download from our website.',
          'You are encouraged to install updates promptly for security and stability.',
          'We are not liable for issues caused by failing to install recommended updates.',
          'Major version upgrades may require a new license at our discretion (existing licenses will always be honored for the purchased term).',
        ],
      },
      {
        title: 'Disclaimer of Warranties',
        content: 'Jinda POS is provided "as is" and "as available" without warranties of any kind, either express or implied. While we strive to deliver a high-quality, reliable product, we cannot guarantee it will meet all your requirements or operate completely error-free.',
        points: [
          'We do not warrant that the Software will be uninterrupted, error-free, or virus-free.',
          'We do not warrant that the Software will be compatible with all hardware or operating systems.',
          'We do not provide accounting, tax, or legal advice — the Software is a tool, and you are responsible for the accuracy of your financial records.',
          'GST calculations are based on Bhutanese tax law as we understand it — consult a tax professional for filing advice.',
          'Any reliance on the Software for critical business decisions is at your own risk.',
        ],
      },
      {
        title: 'Limitation of Liability',
        content: 'To the fullest extent permitted by law, Jinda POS and its founder shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Software.',
        points: [
          'We are not liable for loss of data — you are responsible for maintaining your own backups.',
          'We are not liable for lost revenue, profits, or business opportunities.',
          'We are not liable for any tax penalties or compliance issues resulting from incorrect data entry.',
          'Our total liability shall not exceed the amount you paid for your license in the 12 months preceding the claim.',
          'We are not liable for damages caused by third-party service providers (MongoDB, Cloudflare, Google, etc.).',
        ],
      },
      {
        title: 'Indemnification',
        content: 'You agree to indemnify and hold harmless Jinda POS, its founder, and its affiliates from any claims, damages, losses, or expenses (including legal fees) arising from your misuse of the Software, violation of these terms, or infringement of any third-party rights.',
      },
      {
        title: 'Governing Law & Dispute Resolution',
        content: 'These terms are governed by and construed in accordance with the laws of the Kingdom of Bhutan. Any disputes arising from or relating to these terms or the Software shall be resolved amicably through good-faith negotiation first.',
        points: [
          'If negotiation fails, disputes will be handled within Bhutanese jurisdiction.',
          'The courts of Bhutan shall have exclusive jurisdiction over any legal proceedings.',
          'You agree not to initiate class action proceedings against us.',
          'If any part of these terms is found unenforceable, the remaining parts remain in full effect.',
        ],
      },
      {
        title: 'Changes to These Terms',
        content: 'We may update these Terms of Service from time to time to reflect changes in our product, legal requirements, or business practices. When we make changes, we will update the "Effective Date" at the bottom of this page.',
        points: [
          'Material changes will be posted on this page with an updated effective date.',
          'For significant changes, we will attempt to notify active license holders by email.',
          'Continued use of the Software after changes take effect means you accept the updated terms.',
          'If you disagree with updated terms, you may stop using the Software and request a refund per our Refund Policy (if within the eligible period).',
        ],
      },
    ],
    changesNotice: 'We may update these terms from time to time. Continued use of the software after changes means you accept the new terms.',
  }

  return NextResponse.json(termsOfService)
}
