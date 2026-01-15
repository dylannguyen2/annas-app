import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AppThemeProvider } from '@/lib/themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Anna's World 🌏",
  description: 'Track your habits, mood, and health data',
  icons: {
    icon: '/anna.png',
    apple: '/anna.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('annas-app-theme');
                  if (theme && ['default', 'cute', 'lavender', 'mint', 'devil'].includes(theme)) {
                    document.documentElement.classList.add('theme-' + theme);
                  } else {
                    document.documentElement.classList.add('theme-default');
                  }
                } catch (e) {
                  document.documentElement.classList.add('theme-default');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppThemeProvider>
            {children}
            <Toaster />
          </AppThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
