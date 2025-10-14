"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Sigma as Sitemap,
  KanbanSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  Clock,
  Calendar,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"

const menuItems = [
  { icon: LayoutDashboard, label: "ダッシュボード", href: "/", permission: "viewDashboard" as const },
  { icon: KanbanSquare, label: "タスク管理", href: "/tasks", permission: "viewOwnTasks" as const },
  { icon: Sitemap, label: "組織図", href: "/organization", permission: "viewOrgChart" as const },
]

const dropdownMenuItems = [
  { icon: Users, label: "社員情報", href: "/employees", permission: "viewOwnProfile" as const },
  { icon: Clock, label: "勤怠管理", href: "/attendance", permission: "viewOwnAttendance" as const },
  { icon: Calendar, label: "有給管理", href: "/leave", permission: "viewLeaveManagement" as const },
  { icon: DollarSign, label: "給与管理", href: "/payroll", permission: "viewOwnPayroll" as const },
]

const adminMenuItems = [{ icon: FileText, label: "ログを表示", href: "/logs", permission: "viewLogs" as const }]

const roleLabels: Record<string, string> = {
  viewer: "閲覧",
  general: "一般",
  "sub-manager": "サブマネ",
  manager: "マネージャー",
  hr: "総務",
  admin: "管理者",
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { role, hasPermission } = usePermissions()
  const { currentUser, isAuthenticated, login, logout } = useAuth()

  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.permission))
  const visibleDropdownItems = dropdownMenuItems.filter((item) => hasPermission(item.permission))
  const visibleAdminMenuItems = adminMenuItems.filter((item) => hasPermission(item.permission))

  return (
    <>
      <LoginModal open={!isAuthenticated} onLoginSuccess={login} />

      <aside
        className={cn(
          "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900">HR System</span>
                <span className="text-xs text-slate-500 font-medium">v1.3.4</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      "hover:bg-blue-50 hover:text-blue-600",
                      isActive ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-slate-700",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              )
            })}

            {/* プルダウンメニュー */}
            {visibleDropdownItems.length > 0 && (
              <li>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-blue-50 hover:text-blue-600 text-slate-700",
                  )}
                  title={collapsed ? "人事管理" : undefined}
                >
                  <Users className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">人事管理</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          dropdownOpen && "transform rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>
                
                {/* サブメニュー */}
                {!collapsed && dropdownOpen && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {visibleDropdownItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                              "hover:bg-blue-50 hover:text-blue-600",
                              isActive ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-slate-600",
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )}
          </ul>

          {visibleAdminMenuItems.length > 0 && !collapsed && (
            <div className="mt-6">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase mb-2">管理者メニュー</p>
              <ul className="space-y-1">
                {visibleAdminMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          "hover:bg-blue-50 hover:text-blue-600",
                          isActive ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-slate-700",
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* User Info */}
        {!collapsed && currentUser && (
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {currentUser.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-slate-700 hover:text-red-600 hover:border-red-300 bg-transparent"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        )}
      </aside>
    </>
  )
}
