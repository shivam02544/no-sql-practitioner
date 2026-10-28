import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MongoDB Learning Platform',
  description: 'Interactive visual learning and development platform for MongoDB and NoSQL databases',
  keywords: ['MongoDB', 'NoSQL', 'database', 'learning', 'aggregation', 'indexing', 'data modeling'],
  authors: [{ name: 'MongoDB Learning Platform' }],
  creator: 'MongoDB Learning Platform',
  publisher: 'MongoDB Learning Platform',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mongodb-learning-platform.vercel.app',
    title: 'MongoDB Learning Platform',
    description: 'Interactive visual learning and development platform for MongoDB and NoSQL databases',
    siteName: 'MongoDB Learning Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MongoDB Learning Platform',
    description: 'Interactive visual learning and development platform for MongoDB and NoSQL databases',
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}