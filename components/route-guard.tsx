"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { checkRouteAccess } from "@/lib/route-access"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, isAuthenticated } = useAuth()
  const { permissions } = usePermissions()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // 未認証時はLoginModalに任せる（ブロックしない）
    if (!isAuthenticated || !currentUser) {
      setAuthorized(true)
      return
    }

    const result = checkRouteAccess(pathname, currentUser, permissions)

    if (result.allowed) {
      setAuthorized(true)
    } else {
      setAuthorized(false)
      router.replace(result.redirectTo || "/")
    }
  }, [pathname, currentUser, isAuthenticated, permissions, router])

  // チェック中・リダイレクト中はコンテンツを表示しない
  if (!authorized) {
    return null
  }

  return <>{children}</>
}
