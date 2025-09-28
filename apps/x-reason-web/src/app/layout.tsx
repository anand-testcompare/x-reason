import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation, NavigationProvider, MainContent, InspectorInitializer, CredentialsWrapper } from './components'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'X-Reason - AI-Driven State Machine Generation',
  description: 'Dynamic AI-generated software flows using XState state machines. Showcase innovative AI-driven software composition patterns with real-time streaming responses.',
  keywords: ['AI', 'XState', 'state machines', 'dynamic programming', 'software composition', 'Next.js', 'TypeScript'],
  authors: [{ name: 'X-Reason Team' }],
  creator: 'X-Reason',
  publisher: 'X-Reason',
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon_cherry_blossom_small.png',
    shortcut: '/icon_cherry_blossom_small.png',
    apple: '/icon_cherry_blossom_small.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'X-Reason - AI-Driven State Machine Generation',
    description: 'Dynamic AI-generated software flows using XState state machines. Showcase innovative AI-driven software composition patterns with real-time streaming responses.',
    siteName: 'X-Reason',
    images: [
      {
        url: '/opengraph.png',
        width: 2772,
        height: 1672,
        alt: 'X-Reason - AI-Driven State Machine Generation',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-Reason - AI-Driven State Machine Generation',
    description: 'Dynamic AI-generated software flows using XState state machines. Showcase innovative AI-driven software composition patterns with real-time streaming responses.',
    images: ['/opengraph.png'],
    creator: '@xreason',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ backgroundColor: '#f9fafb', color: '#1f2937' }}>
      <body 
        className={inter.className}
        style={{ 
          backgroundColor: '#f9fafb', 
          color: '#1f2937',
          margin: 0,
          padding: 0 
        }}
      >
        <CredentialsWrapper>
          <NavigationProvider>
            <InspectorInitializer />
            <Navigation />
            <MainContent>
              {children}
            </MainContent>
          </NavigationProvider>
        </CredentialsWrapper>
      </body>
    </html>
  )
}
