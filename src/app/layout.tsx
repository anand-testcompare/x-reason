import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'X-Reason - AI-Driven State Machine Generation',
  description: 'Dynamic AI-generated software flows using XState state machines',
  icons: {
    icon: '/icon_cherry_blossom.png',
    shortcut: '/icon_cherry_blossom.png',
    apple: '/icon_cherry_blossom.png',
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
        <Navigation />
        <main className="ml-64">
          {children}
        </main>
      </body>
    </html>
  )
}
