import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/toaster'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GKICKS - Premium Shoe Store',
  description: 'Discover the latest collection of premium shoes for men, women, and kids at GKICKS. Quality footwear with style and comfort.',
  keywords: 'shoes, sneakers, footwear, men shoes, women shoes, kids shoes, premium shoes',
  authors: [{ name: 'GKICKS Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}