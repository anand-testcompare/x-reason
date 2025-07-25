import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation, NavigationProvider, MainContent } from './components'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'X-Reason - AI-Driven State Machine Generation',
  description: 'Dynamic AI-generated software flows using XState state machines',
  icons: {
    icon: '/icon_cherry_blossom_small.png',
    shortcut: '/icon_cherry_blossom_small.png',
    apple: '/icon_cherry_blossom_small.png',
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
        <NavigationProvider>
          <Navigation />
          <MainContent>
            {children}
          </MainContent>
        </NavigationProvider>
      </body>
    </html>
  )
}
