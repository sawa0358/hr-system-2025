"use client"

import { type UserRole, getPermissions, type Permission } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"

export function usePermissions() {
  const { currentUser } = useAuth()
  const userRole: UserRole = currentUser?.role || "viewer"
  const permissions = getPermissions(userRole)

  // 権限が取得できない場合のフォールバック
  if (!permissions) {
    console.error(`権限が見つかりません: ${userRole}`)
    return {
      role: userRole,
      permissions: getPermissions("viewer"), // デフォルトはviewer権限
      hasPermission: () => false,
    }
  }

  return {
    role: userRole,
    permissions,
    hasPermission: (permission: keyof Permission) => permissions[permission],
  }
}
