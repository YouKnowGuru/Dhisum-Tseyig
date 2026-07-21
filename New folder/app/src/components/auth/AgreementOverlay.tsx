import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, ScrollText, CheckCircle2, XCircle, Check, ChevronDown, FileText, Users, Ban, Scale, CreditCard, RefreshCw, AlertTriangle, Baby, Globe, Brain, Database } from 'lucide-react';

interface AgreementOverlayProps {
  onAccept: () => void;
  onDecline: () => void;
}

interface Section {
  icon: typeof Shield;
  heading: string;
  text: string;
  points?: string[];
}

const SECTIONS: Section[] = [
  {
    icon: ScrollText,
    heading: '1. Acceptance of Terms',
    text: 'By installing and using Jinda POS ("the Software"), you agree to be bound by these Terms of Service and the License Agreement. If you do not agree, please do not use the Software. You may click "Decline & Exit" to close the application.',
    points: [
      'These terms apply to all versions of the Software, including the free trial and paid licenses.',
      'If you are using the Software on behalf of a business, you confirm you have authority to accept these terms on its behalf.',
    ],
  },
  {
    icon: Database,
    heading: '2. Your Data & Privacy',
    text: 'Your business data — sales, inventory, customers, suppliers, invoices, and accounting entries — is stored entirely on your own computer in a local SQLite database. We do not collect, transmit, or store your daily business transactions on our servers at any point.',
    points: [
      'All data lives in a local SQLite file on your computer — no internet required.',
      'You can move, copy, or back up your database file at any time — it belongs to you.',
      'Cloud backups to Google Drive or MEGA are optional and must be explicitly enabled by you.',
      'We only collect your name, email, and a hardware ID for license activation.',
    ],
  },
  {
    icon: Lock,
    heading: '3. What We Do NOT Collect',
    text: 'We believe in data minimization. We do not track your business activity, personal browsing habits, or sensitive financial details.',
    points: [
      'We do not track your sales, revenue, inventory levels, or customer data.',
      'We do not collect your bank account numbers, payment credentials, or GST details.',
      'We do not use tracking cookies, advertising pixels, or third-party analytics.',
      'We do not record your screen, keystrokes, or camera at any time.',
    ],
  },
  {
    icon: CheckCircle2,
    heading: '4. License Grant & Restrictions',
    text: 'You receive a personal, non-exclusive, non-transferable license to use Jinda POS on one computer. The Software is licensed to you, not sold. The following actions are strictly prohibited:',
    points: [
      'One license per computer hardware ID — sharing license keys is prohibited.',
      'No reverse engineering, decompiling, cracking, or circumventing the activation system.',
      'No copying, modifying, redistributing, or creating derivative works.',
      'No using the Software for any illegal activity or transactions violating Bhutanese law.',
      'Users are responsible for maintaining their own data backups.',
    ],
  },
  {
    icon: Users,
    heading: '5. User Account Limits',
    text: 'Each license plan includes a specific number of user accounts. Each user account should be used by one person only.',
    points: [
      'Starter Plan: 1 user account — ideal for single-operator shops.',
      'Growth Plan: 2 user accounts — for small teams with a second operator.',
      'Enterprise Plan: 5 user accounts — for larger businesses with multiple staff.',
      'Do not share login credentials between staff — each user should have their own account.',
    ],
  },
  {
    icon: CreditCard,
    heading: '6. Payment & Free Trial',
    text: 'A 7-day free trial is available with full features and no credit card required. Paid licenses are payable upfront for the full term (1, 2, or 3 years). All taxes, including GST where applicable, are included in the displayed price.',
    points: [
      'Trial duration: 7 days from first activation — all features unlocked.',
      'After 7 days, a valid paid license key is required to continue using the Software.',
      'Data created during the trial is preserved when you activate a paid license.',
    ],
  },
  {
    icon: RefreshCw,
    heading: '7. Refund Policy',
    text: 'Paid licenses may be refunded within 14 days of purchase if the Software does not work as described and our support team cannot resolve the issue. Renewals are non-refundable except in cases of billing errors.',
    points: [
      'Refund window: 14 days from the date of purchase.',
      'Remote setup and installation services are non-refundable once completed.',
      'Contact dhisumtseyig@gmail.com with your Order ID and License Key to request a refund.',
    ],
  },
  {
    icon: AlertTriangle,
    heading: '8. Disclaimer of Warranties',
    text: 'Jinda POS is provided "as is" and "as available" without warranties of any kind. We do not guarantee the Software will be error-free or compatible with all hardware.',
    points: [
      'We do not provide accounting, tax, or legal advice — the Software is a tool.',
      'GST calculations are based on Bhutanese tax law as we understand it — consult a tax professional for filing.',
      'Any reliance on the Software for critical business decisions is at your own risk.',
    ],
  },
  {
    icon: Scale,
    heading: '9. Limitation of Liability',
    text: 'To the fullest extent permitted by law, Jinda POS and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Software.',
    points: [
      'We are not liable for loss of data — you are responsible for maintaining backups.',
      'We are not liable for lost revenue, profits, or business opportunities.',
      'We are not liable for tax penalties resulting from incorrect data entry.',
      'Our total liability shall not exceed the amount you paid for your license.',
    ],
  },
  {
    icon: Brain,
    heading: '10. AI Assistant Data Handling',
    text: 'If you use the Jinda AI chatbot on our website, your conversation messages are sent to OpenRouter to generate a response. We do not store your chat conversations on our servers. Do not share sensitive information (passwords, license keys, bank details) with the chatbot.',
  },
  {
    icon: Baby,
    heading: "11. Children's Privacy",
    text: 'Jinda POS is a business application designed for shop owners and business operators. It is not directed at children under 18. We do not knowingly collect personal information from children.',
  },
  {
    icon: Globe,
    heading: '12. Governing Law',
    text: 'These terms are governed by and construed in accordance with the laws of the Kingdom of Bhutan. Any disputes will be resolved amicably through negotiation, and failing that, within Bhutanese jurisdiction.',
  },
];

export const AgreementOverlay: React.FC<AgreementOverlayProps> = ({ onAccept, onDecline }) => {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasReachedBottom(true);
      }
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      if (el.scrollHeight <= el.clientHeight) {
        setHasReachedBottom(true);
      }
    }
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const canAccept = hasReachedBottom && agreed;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-bhutan-gold/10 blur-3xl rounded-full" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-bhutan-gold/20 p-3 rounded-2xl">
              <Shield className="w-8 h-8 text-bhutan-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {showDeclineConfirm ? 'Are you sure?' : 'Legal Agreement'}
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                {showDeclineConfirm
                  ? 'You need to accept the terms to use Jinda POS'
                  : 'Please review the terms of use for Jinda POS'}
              </p>
            </div>
          </div>
        </div>

        {showDeclineConfirm ? (
          /* Decline confirmation screen */
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                Without accepting our Terms of Service, Privacy Policy, and License Agreement, you cannot use Jinda POS. The application will close.
              </p>
              <p className="text-xs text-slate-400 font-medium">
                We respect your choice. You can always come back when you are ready.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.electronSecureAPI?.app?.quit?.()}
                className="flex-1 px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Close Application
              </button>
              <button
                onClick={() => setShowDeclineConfirm(false)}
                className="flex-1 px-6 py-3 rounded-2xl bg-slate-950 text-white hover:scale-105 active:scale-95 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Go Back & Accept
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scroll hint */}
            <div className="flex-shrink-0 px-8 pt-3 pb-1 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ChevronDown className="w-3 h-3 animate-bounce" />
                Scroll down to read all terms
              </p>
            </div>

            {/* Scrollable Content */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-5 max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-200"
            >
              {SECTIONS.map((section, i) => (
                <section key={i} className="space-y-2">
                  <h2 className="flex items-center gap-2 text-slate-900 font-black tracking-tight text-sm">
                    <section.icon className="w-4 h-4 text-bhutan-maroon flex-shrink-0" />
                    {section.heading}
                  </h2>
                  <p className="text-sm leading-relaxed font-medium text-slate-700">
                    {section.text}
                  </p>
                  {section.points && (
                    <ul className="text-sm leading-relaxed font-medium list-disc pl-5 space-y-1 text-slate-600">
                      {section.points.map((point, j) => (
                        <li key={j}>{point}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              {/* Developer Recognition */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="bg-bhutan-maroon/5 p-4 rounded-2xl border border-bhutan-maroon/10">
                  <h3 className="text-slate-900 font-black text-xs uppercase tracking-wider mb-2">Developer Recognition</h3>
                  <p className="text-xs leading-relaxed font-medium text-slate-600">
                    This Software is the result of extensive research, expert engineering, and the dedicated craftsmanship of{' '}
                    <span className="text-bhutan-maroon font-bold">Keshab Baral</span>.
                    Built with a commitment to empowering Bhutanese businesses through high-performance technology and intuitive design.
                  </p>
                  <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Developer: Keshab Baral | Tsirang, Bhutan
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                    Governing Law: Kingdom of Bhutan
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                    Updated: July 2026
                  </p>
                </div>
              </div>

              {/* Scroll complete confirmation */}
              {hasReachedBottom && (
                <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-widest pt-1">
                  <Check className="w-3.5 h-3.5" />
                  You have read all terms
                </div>
              )}
            </div>

            {/* Footer — checkbox + buttons */}
            <div className="flex-shrink-0 p-6 bg-white border-t border-slate-100 space-y-4">
              {/* Checkbox */}
              <button
                onClick={() => setAgreed(!agreed)}
                disabled={!hasReachedBottom}
                className={`flex items-start gap-3 w-full text-left rounded-xl p-3 transition-all ${
                  hasReachedBottom
                    ? 'cursor-pointer hover:bg-slate-50'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    agreed
                      ? 'bg-bhutan-maroon border-bhutan-maroon'
                      : 'border-slate-300 bg-white',
                    !hasReachedBottom && 'border-slate-200'
                  }`}
                >
                  {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs text-slate-600 font-medium leading-relaxed">
                  I have read and agree to the Terms of Service, Privacy Policy, and License Agreement. I understand my business data is stored locally on my computer and I am responsible for my own backups.
                </span>
              </button>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeclineConfirm(true)}
                  className="px-5 py-3 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
                <button
                  disabled={!canAccept}
                  onClick={onAccept}
                  className={`flex-1 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                    canAccept
                      ? 'bg-slate-950 text-white hover:scale-[1.02] active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept & Continue
                </button>
              </div>

              {!hasReachedBottom && (
                <p className="text-center text-[10px] font-bold text-bhutan-maroon-dark uppercase tracking-widest animate-pulse">
                  Scroll to the bottom of the terms to enable the checkbox
                </p>
              )}
              {hasReachedBottom && !agreed && (
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tick the checkbox above to enable the accept button
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
