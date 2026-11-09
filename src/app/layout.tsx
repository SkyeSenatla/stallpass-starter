import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@/components/Toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'StallPass',
  description: 'Stall permits for street traders at Warwick Junction, eThekwini.',
}

// Runs before the page paints: dark mode follows the operating system.
const darkModeScript = `if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark')`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
      </body>
    </html>
  )
}
