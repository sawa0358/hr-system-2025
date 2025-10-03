"use client"

import { type UserRole, getPermissions, type Permission } from "@/lib/permissions"
import { useAuth } from "@/lib/auth-context"

export function usePermissions() {
  const { currentUser } = useAuth()
  const userRole: UserRole = currentUser?.role || "viewer"
  const permissions = getPermissions(userRole)

  return {
    role: userRole,
    permissions,
    hasPermission: (permission: keyof Permission) => permissions[permission],
  }
}
