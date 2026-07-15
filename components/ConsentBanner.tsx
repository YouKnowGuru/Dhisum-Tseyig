'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Check, ChevronDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CONSENT_KEY = 'jinda_terms_accepted_v1'
const CONSENT_VERSION = '2'

const TERMS_SUMMARY = [
  {
    heading: '1. Acceptance of Terms',
    text: 'By downloading, installing, or using Jinda POS, you agree to be bound by these Terms of Service and the License Agreement. If you do not agree, do not use the Software.',
  },
  {
    heading: '2. License Grant',
    text: 'You receive a personal, non-exclusive, non-transferable license to use Jinda POS on one computer. The Software is licensed to you, not sold. Sharing, leasing, or renting your license key is prohibited.',
  },
  {
    heading: '3. Your Data & Privacy',
    text: 'Your business data (sales, inventory, customers, accounting) is stored entirely on your own computer in a local SQLite database. We do not collect, transmit, or store your business transactions. We only collect your name, email, and a hardware ID for license activation.',
  },
  {
    heading: '4. Prohibited Actions',
    text: 'You may not copy, redistribute, reverse engineer, decompile, modify, or crack the Software. You may not use the Software for any illegal activity or to process transactions that violate Bhutanese law.',
  },
  {
    heading: '5. Intellectual Property',
    text: 'Jinda POS, including its source code, design, logos, and documentation, is the intellectual property of Jinda POS and its founder, Mr. Keshab Baral. The "Jinda" name and logo are trademarks of Jinda POS.',
  },
  {
    heading: '6. Disclaimer & Limitation of Liability',
    text: 'Jinda POS is provided "as is" without warranties of any kind. We are not liable for loss of data, lost revenue, or tax penalties resulting from incorrect data entry. You are responsible for maintaining your own backups.',
  },
  {
    heading: '7. Refund Policy',
    text: 'A 7-day free trial is available with no credit card required. Paid licenses may be refunded within 14 days of purchase if the Software does not work as described and our support team cannot resolve the issue.',
  },
  {
    heading: '8. Governing Law',
    text: 'These terms are governed by the laws of the Kingdom of Bhutan. Any disputes will be resolved amicably through negotiation, and failing that, within Bhutanese jurisdiction.',
  },
]

export default function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [declined, setDeclined] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored !== CONSENT_VERSION) {
        setShow(true)
      }
    } catch {
      setShow(true)
    }
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const reachedBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8
    if (reachedBottom && !scrolledToBottom) {
      setScrolledToBottom(true)
    }
  }

  const accept = () => {
    if (!scrolledToBottom || !agreed) return
    setClosing(true)
    try {
      localStorage.setItem(CONSENT_KEY, CONSENT_VERSION)
    } catch {
      /* storage unavailable */
    }
    setTimeout(() => setShow(false), 350)
  }

  const handleDecline = () => {
    setDeclined(true)
  }

  const confirmDecline = () => {
    setClosing(true)
    setTimeout(() => {
      setShow(false)
      router.push('https://www.google.com')
    }, 350)
  }

  const cancelDecline = () => {
    setDeclined(false)
  }

  if (!mounted || !show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300',
          closing ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden',
            'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
            'shadow-2xl shadow-bhutan-maroon/30',
            'transition-all duration-300',
            closing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          )}
        >
          {/* Header */}
          <div className="relative flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-bhutan-maroon to-bhutan-maroon-dark text-white flex-shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bhutan-gold/20 ring-1 ring-bhutan-gold/40">
              <Shield className="h-5 w-5 text-bhutan-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-black tracking-tight leading-none">
                {declined ? 'Are you sure?' : 'Welcome to Jinda POS'}
              </h2>
              <p className="text-[11px] font-bold text-bhutan-gold/90 mt-1 tracking-wide">
                {declined
                  ? 'You need to accept the terms to use this website'
                  : 'Please read our terms before continuing'}
              </p>
            </div>
          </div>

          {declined ? (
            /* Decline confirmation screen */
            <div className="px-6 py-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
                  Without accepting our Terms of Service and Privacy Policy, you cannot use the Jinda POS website or software. You will be redirected away from this site.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  We respect your choice. You can always come back when you are ready.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  onClick={confirmDecline}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest"
                >
                  Leave Website
                </Button>
                <Button
                  onClick={cancelDecline}
                  className="flex-1 h-11 rounded-xl bg-bhutan-maroon hover:bg-bhutan-maroon-dark text-white font-black text-xs uppercase tracking-widest shadow-lg"
                >
                  Go Back & Accept
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Terms */}
              <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ChevronDown className="h-3 w-3 animate-bounce" />
                  Scroll down to read all terms
                </p>
              </div>

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[180px] max-h-[40vh]"
              >
                {TERMS_SUMMARY.map((section, i) => (
                  <div key={i} className="space-y-1.5">
                    <h3 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                      {section.heading}
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {section.text}
                    </p>
                  </div>
                ))}

                {/* Full policy links */}
                <div className="pt-3 pb-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    Read the full documents:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-[12px] font-black text-bhutan-maroon dark:text-bhutan-gold underline underline-offset-2 hover:opacity-80"
                    >
                      Full Terms of Service &rarr;
                    </Link>
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-[12px] font-black text-bhutan-maroon dark:text-bhutan-gold underline underline-offset-2 hover:opacity-80"
                    >
                      Full Privacy Policy &rarr;
                    </Link>
                    <Link
                      href="/license"
                      target="_blank"
                      className="text-[12px] font-black text-bhutan-maroon dark:text-bhutan-gold underline underline-offset-2 hover:opacity-80"
                    >
                      License Agreement &rarr;
                    </Link>
                    <Link
                      href="/refund"
                      target="_blank"
                      className="text-[12px] font-black text-bhutan-maroon dark:text-bhutan-gold underline underline-offset-2 hover:opacity-80"
                    >
                      Refund Policy &rarr;
                    </Link>
                  </div>
                </div>

                {/* Scroll complete confirmation */}
                {scrolledToBottom && (
                  <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest pt-1">
                    <Check className="h-3.5 w-3.5" />
                    You have read all terms
                  </div>
                )}
              </div>

              {/* Footer — checkbox + buttons */}
              <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                {/* Checkbox */}
                <button
                  onClick={() => setAgreed(!agreed)}
                  disabled={!scrolledToBottom}
                  className={cn(
                    'flex items-start gap-3 w-full text-left rounded-xl p-3 transition-all',
                    scrolledToBottom
                      ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all',
                      agreed
                        ? 'bg-bhutan-maroon border-bhutan-maroon'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
                      !scrolledToBottom && 'border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {agreed && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    I have read and agree to the Terms of Service, Privacy Policy, and License Agreement. I understand my business data is stored locally on my computer.
                  </span>
                </button>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    onClick={accept}
                    disabled={!scrolledToBottom || !agreed}
                    className={cn(
                      'flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all',
                      scrolledToBottom && agreed
                        ? 'bg-bhutan-maroon hover:bg-bhutan-maroon-dark text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-none cursor-not-allowed'
                    )}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept & Continue
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="ghost"
                    className="h-11 rounded-xl text-slate-400 dark:text-slate-500 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Decline
                  </Button>
                </div>

                {!scrolledToBottom && (
                  <p className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    Scroll to the bottom of the terms to enable the checkbox
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
