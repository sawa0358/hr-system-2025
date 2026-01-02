import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { ClientOnly } from "@/components/client-only"
import { ErrorBoundary } from "@/components/error-boundary"
import { GlobalErrorHandler } from "@/components/global-error-handler"

// サーバー起動時にスケジューラーを初期化
if (typeof window === 'undefined') {
  // サーバーサイドのみで実行
  require('@/lib/init-vacation-scheduler')
  require('@/lib/init-card-reminder-scheduler')
}

export const metadata: Metadata = {
  title: "HR System",
  description: "Human Resources Management System",
  generator: "Next.js",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning translate="no">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <GlobalErrorHandler />
        <ErrorBoundary>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-slate-50 relative">
                  {children}
                </main>
              </div>
            </Suspense>
          </AuthProvider>
        </ErrorBoundary>
        <ClientOnly>
          <Analytics />
        </ClientOnly>
      </body>
    </html>
  )
}
