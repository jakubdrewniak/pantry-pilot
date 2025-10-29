import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/layout/Navigation'
import { SkipLink } from '@/components/layout/SkipLink'

export const metadata: Metadata = {
  title: 'Pantry Pilot',
  description: 'Streamline meal planning with AI-powered recipe generation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <SkipLink />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          <main id="main-content">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
