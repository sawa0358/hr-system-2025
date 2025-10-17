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
import { SettingsSyncIndicator } from "@/components/settings-sync-indicator"

export const metadata: Metadata = {
  title: "HR System",
  description: "Human Resources Management System",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundary>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-slate-50 relative">
                  <div className="absolute top-4 right-4 z-10">
                    <SettingsSyncIndicator />
                  </div>
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
