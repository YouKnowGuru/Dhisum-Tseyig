import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import ThemeToggle from '@/components/ThemeToggle'
import ChatWidget from '@/components/chatbot/ChatWidget'
import ConsentBanner from '@/components/ConsentBanner'
import { OrganizationJsonLd, WebSiteJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { createMetadata } from '@/lib/seo-config'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Improves Core Web Vitals (CLS)
  preload: true,
})

export const metadata: Metadata = createMetadata()

export const viewport: Viewport = {
  themeColor: '#7B1F3A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for third-party resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Global JSON-LD Structured Data */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SoftwareApplicationJsonLd />

        <div className="flex min-h-screen flex-col" suppressHydrationWarning>
          <Navbar />
          <main className="flex-1" suppressHydrationWarning>{children}</main>
          <Footer />
          <ScrollToTop />
          <ChatWidget />
          <ConsentBanner />
        </div>
      </body>
    </html>
  )
}
