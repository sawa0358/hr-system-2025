"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Network,
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
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"

const menuItems = [
  { icon: LayoutDashboard, label: "ダッシュボード", href: "/", permission: "viewDashboard" as const },
  { icon: KanbanSquare, label: "タスク管理", href: "/tasks", permission: "viewOwnTasks" as const },
  { icon: Network, label: "組織図", href: "/organization", permission: "viewOrgChart" as const },
  // 業務委託時間管理（WorkClock）
  { icon: Clock, label: "業務委託時間管理", href: "/workclock", permission: "viewDashboard" as const },
]

const dropdownMenuItems = [
  { icon: Users, label: "社員情報", href: "/employees", permission: "viewOwnProfile" as const },
  { icon: Clock, label: "勤怠管理", href: "/attendance", permission: "viewOwnAttendance" as const },
  { icon: DollarSign, label: "給与or請求管理", href: "/payroll", permission: "viewOwnPayroll" as const },
  { icon: Calendar, label: "有給管理", href: "/leave", permission: "viewLeaveManagement" as const },
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
  const [pendingCount, setPendingCount] = useState(0)
  const pathname = usePathname()
  
  // フックは通常通り呼び出す（Reactのルールに従う）
  const { role, hasPermission } = usePermissions()
  const { currentUser, isAuthenticated, login, logout } = useAuth()
  const sidebarRef = useRef<HTMLElement>(null)

  // 人事管理プルダウン内のページかどうかを判定
  const isInDropdownMenu = ['/employees', '/attendance', '/payroll', '/leave'].some(path => 
    pathname.startsWith(path)
  )

  // 人事管理プルダウンを自動的に開く（サブメニューページにいる場合）
  useEffect(() => {
    if (isInDropdownMenu && !collapsed) {
      setDropdownOpen(true)
    }
  }, [isInDropdownMenu, collapsed])

  // 有給管理を表示するべき雇用形態
  const allowedEmployeeTypesForLeave = [
    "正社員",
    "契約社員",
    "パートタイム",
    "派遣社員"
  ]

  // 承認待ちの件数を取得（店長・マネージャー・総務・管理者のみ）
  useEffect(() => {
    // 店長・マネージャー・総務・管理者で、ログイン済みの場合のみ取得
    if (!currentUser || (!isAuthenticated)) {
      return
    }

    const canViewBadge = currentUser.role === 'admin' || currentUser.role === 'hr' || 
                         currentUser.role === 'manager' || currentUser.role === 'store_manager'
    if (!canViewBadge) {
      setPendingCount(0)
      return
    }

    // 承認待ちの件数を取得
    const fetchPendingCount = async () => {
      // タイムアウト制御（10秒）
      const controller = new AbortController()
      let timeoutId: NodeJS.Timeout | null = null
      
      try {
        timeoutId = setTimeout(() => {
          controller.abort()
        }, 10000)
        
        // 店長・マネージャーの場合、supervisorIdを指定して自分が見れる申請のみをカウント
        // 総務・管理者の場合は、全申請をカウント
        const isManagerOrStoreManager = currentUser.role === 'manager' || currentUser.role === 'store_manager'
        const url = isManagerOrStoreManager 
          ? `/api/vacation/admin/applicants?view=pending&supervisorId=${currentUser.id}`
          : '/api/vacation/admin/applicants?view=pending'
        
        const res = await fetch(url, {
          signal: controller.signal,
          // ネットワークエラーを適切に処理するための設定
          cache: 'no-store', // 常に最新のデータを取得
        })
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (res.ok) {
          const json = await res.json()
          // 承認待ち画面では各申請ごとにカードが生成されるため、レスポンスのカード数が承認待ちの申請カード数
          const count = json.employees?.length || 0
          setPendingCount(count)
        } else {
          // エラーレスポンスの場合は0件として扱う（サイレントに処理）
          setPendingCount(0)
        }
      } catch (error: any) {
        // タイムアウトをクリーンアップ
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        // AbortErrorは予期された中断（タイムアウトやコンポーネントのアンマウント）なので無視
        if (error?.name === 'AbortError') {
          // サイレントに処理（ログを出力しない）
          return
        }
        
        // その他のネットワークエラーは、開発環境のみログを出力
        // 本番環境ではサイレントに0件として扱う（エラーをユーザーに表示しない）
        if (process.env.NODE_ENV === 'development') {
          console.error('[Sidebar] 承認待ち件数取得エラー:', error)
        }
        setPendingCount(0)
      }
    }

    fetchPendingCount()

    // 定期的に更新（30秒ごと）
    const interval = setInterval(fetchPendingCount, 30000)

    // カスタムイベントで承認状態が変わった時に更新
    const handleVacationUpdate = () => {
      fetchPendingCount()
    }
    window.addEventListener('vacation-request-updated', handleVacationUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('vacation-request-updated', handleVacationUpdate)
    }
  }, [currentUser, isAuthenticated])

  // 展開状態の時にスクロールやクリックで自動的に閉じる
  useEffect(() => {
    if (collapsed) {
      // 折りたたみ状態の時は何もしない
      return
    }

    // ページ遷移直後は自動閉じを無効化（300ms待機）
    let isPageTransition = true
    const transitionTimeout = setTimeout(() => {
      isPageTransition = false
    }, 300)

    // スクロールイベントで閉じる（縦・横両方のスクロールを検知）
    const handleScroll = () => {
      if (isPageTransition) return
      setCollapsed(true)
    }

    // ホイールイベントで横スクロールを明示的に検知
    const handleWheel = (event: WheelEvent) => {
      if (isPageTransition) return
      // 横スクロール（deltaXが0でない）の場合に閉じる
      if (Math.abs(event.deltaX) > 0) {
        // サイドバー内の横スクロールは無視
        const target = event.target as Node
        if (sidebarRef.current && sidebarRef.current.contains(target)) {
          return
        }
        setCollapsed(true)
      }
      // 縦スクロールも検知（deltaYが0でない場合）
      else if (Math.abs(event.deltaY) > 0) {
        // サイドバー内の縦スクロールは無視
        const target = event.target as Node
        if (sidebarRef.current && sidebarRef.current.contains(target)) {
          return
        }
        setCollapsed(true)
      }
    }

    // クリックイベントで閉じる（サイドバー内のクリックは除外）
    const handleClick = (event: MouseEvent) => {
      if (isPageTransition) return
      const target = event.target as Node
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        // サイドバー内のクリックは無視
        return
      }
      // サイドバー外のクリックで閉じる
      setCollapsed(true)
    }

    // 画面全体のスクロールを検知（window、document、bodyなど複数の要素で監視）
    // scrollイベントは縦・横両方のスクロールを検知できる
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    document.documentElement.addEventListener('scroll', handleScroll, { passive: true })
    document.body.addEventListener('scroll', handleScroll, { passive: true })
    
    // ホイールイベントで横スクロールを明示的に検知
    window.addEventListener('wheel', handleWheel, { passive: true })
    document.addEventListener('wheel', handleWheel, { passive: true })
    document.documentElement.addEventListener('wheel', handleWheel, { passive: true })
    document.body.addEventListener('wheel', handleWheel, { passive: true })
    
    // メインコンテンツエリアのスクロールも検知
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true })
      mainElement.addEventListener('wheel', handleWheel, { passive: true })
    }
    
    // すべてのスクロール可能な要素を監視（横スクロール対応）
    const scrollableElements = document.querySelectorAll('[style*="overflow"], [class*="overflow"]')
    scrollableElements.forEach((element) => {
      element.addEventListener('scroll', handleScroll, { passive: true })
      element.addEventListener('wheel', handleWheel, { passive: true })
    })
    
    // 少し遅延させて、展開ボタンのクリックイベントが先に処理されるようにする
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 100)

    return () => {
      clearTimeout(transitionTimeout)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
      document.documentElement.removeEventListener('scroll', handleScroll)
      document.body.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      document.removeEventListener('wheel', handleWheel)
      document.documentElement.removeEventListener('wheel', handleWheel)
      document.body.removeEventListener('wheel', handleWheel)
      // クリーンアップ時に再度取得してイベントリスナーを削除
      const mainElementForCleanup = document.querySelector('main')
      if (mainElementForCleanup) {
        mainElementForCleanup.removeEventListener('scroll', handleScroll)
        mainElementForCleanup.removeEventListener('wheel', handleWheel)
      }
      scrollableElements.forEach((element) => {
        element.removeEventListener('scroll', handleScroll)
        element.removeEventListener('wheel', handleWheel)
      })
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClick)
    }
  }, [collapsed, pathname])

  // メニューアイテムの可視性をメモ化してパフォーマンスを向上
  const visibleMenuItems = React.useMemo(
    () => menuItems.filter((item) => hasPermission(item.permission)),
    [hasPermission]
  )
  const visibleDropdownItems = React.useMemo(() => {
    return dropdownMenuItems.filter((item) => {
      // 権限チェック
      if (!hasPermission(item.permission)) {
        return false
      }
      
      // 有給管理メニューの場合は雇用形態もチェック（全権限者対象）
      if (item.href === "/leave") {
        // ログインしていない場合は表示しない
        if (!currentUser) {
          console.log("[Sidebar] 有給管理メニュー: currentUserが存在しません")
          return false
        }
        
        // 雇用形態をチェック（全権限者が対象）
        const employeeType = currentUser.employeeType?.trim()
        if (!employeeType) {
          console.log("[Sidebar] 有給管理メニュー: employeeTypeが存在しません", currentUser)
          return false
        }
        
        // 許可された雇用形態かチェック（大文字小文字・前後の空白を無視）
        const isAllowed = allowedEmployeeTypesForLeave.some(
          allowed => allowed.trim().toLowerCase() === employeeType.toLowerCase()
        )
        
        if (!isAllowed) {
          console.log("[Sidebar] 有給管理メニュー: 雇用形態が許可されていません", {
            employeeType,
            allowedTypes: allowedEmployeeTypesForLeave
          })
          return false
        }
        
        console.log("[Sidebar] 有給管理メニュー: 表示します", { employeeType })
      }
      
      return true
    })
  }, [hasPermission, currentUser])
  const visibleAdminMenuItems = React.useMemo(() => 
    adminMenuItems.filter((item) => hasPermission(item.permission)), 
    [hasPermission]
  )

  // プルダウンボタン全体の表示制御（雇用形態チェック）
  const canShowDropdown = React.useMemo(() => {
    // ドロップダウンアイテムがある場合のみ表示をチェック
    if (visibleDropdownItems.length === 0) {
      return false
    }
    
    // 雇用形態チェック（正社員・契約社員・パートタイム・派遣社員のみ）
    if (!currentUser) {
      return false
    }
    
    const employeeType = currentUser.employeeType?.trim()
    if (!employeeType) {
      return false
    }
    
    const isAllowed = allowedEmployeeTypesForLeave.some(
      allowed => allowed.trim().toLowerCase() === employeeType.toLowerCase()
    )
    
    return isAllowed
  }, [visibleDropdownItems, currentUser, allowedEmployeeTypesForLeave])

  // 業務委託/外注先かどうか
  const employeeType = currentUser?.employeeType || ""
  const isExternalWorker =
    employeeType.includes("業務委託") || employeeType.includes("外注先")

  // 業務委託/外注先の場合、タスク管理と業務委託時間管理のみ表示
  const primaryMenuItemsForRender = React.useMemo(
    () =>
      isExternalWorker
        ? visibleMenuItems.filter(
            (item) => item.href === "/tasks" || item.href === "/workclock"
          )
        : visibleMenuItems,
    [visibleMenuItems, isExternalWorker]
  )

  return (
    <>
      <LoginModal open={!isAuthenticated} onLoginSuccess={login} />

      <aside
        ref={sidebarRef}
        className={cn(
          "bg-[#f5f4cd] border-r border-slate-200 transition-all duration-300 flex flex-col",
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
              <span className="text-xs text-slate-500 font-medium">v2.8.4</span>
              </div>
              </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(!collapsed)
            }} 
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {primaryMenuItemsForRender.map((item) => {
              const Icon = item.icon
              // 業務委託時間管理は /workclock/ で始まるすべてのパスでアクティブにする
              // ただし、人事管理プルダウン内のページにいる時は、他のメニューは非アクティブにする
              const isActive = !dropdownOpen && !isInDropdownMenu && (
                item.href === "/workclock"
                  ? pathname.startsWith("/workclock")
                  : pathname === item.href
              )

              // 業務委託時間管理メニューの表示制御
              if (item.href === "/workclock") {
                const isGeneral = role === "general"
                const isViewer = role === "viewer"
                // 一般ユーザー以外は表示 / 一般ユーザーでも「業務委託」「外注先」は表示
                const canShowWorkclock =
                  (!isGeneral && !isViewer) || (isGeneral && isExternalWorker)

                if (!canShowWorkclock) {
                  return null
                }
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      try {
                        e.stopPropagation()
                        // 人事管理プルダウンを自動的に閉じる
                        setDropdownOpen(false)
                        // 認証状態を確認（エラーが発生しても再ログインを強制しない）
                        if (!isAuthenticated || !currentUser) {
                          e.preventDefault()
                          console.warn("[Sidebar] 認証されていません。メニュークリックをキャンセルします。")
                          return false
                        }
                        // 認証状態は問題ないので、通常通り遷移
                      } catch (error) {
                        console.error("[Sidebar] メニュークリックエラー:", error)
                        // エラーが発生しても再ログインを強制しない
                        e.preventDefault()
                        return false
                      }
                    }}
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
            {canShowDropdown && !isExternalWorker && (
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDropdownOpen(!dropdownOpen)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    dropdownOpen || isInDropdownMenu
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                      : "bg-[#fdfdea] hover:bg-blue-50 hover:text-blue-600 text-slate-700",
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
                  <ul className="mt-1 ml-4 space-y-1 rounded-md bg-[#fdfdea] p-1">
                    {visibleDropdownItems.map((item) => {
                      const Icon = item.icon
                      // サブパスも含めてアクティブ判定（例: /leave, /leave/admin, /leave/employee なども含む）
                      const isActive = pathname.startsWith(item.href)
                      // 有給管理メニューの場合のみバッジを表示
                      const showBadge = item.href === "/leave" && pendingCount > 0

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={(e) => {
                              e.stopPropagation()
                              // 人事管理サブメニューはプルダウンを開いたまま維持
                              // 認証状態を確認
                              if (!isAuthenticated || !currentUser) {
                                e.preventDefault()
                                console.warn("[Sidebar] 認証されていません。メニュークリックをキャンセルします。")
                                return false
                              }
                              // エラーが発生しても再ログインを強制しない
                              try {
                                // 認証状態は問題ないので、通常通り遷移
                              } catch (error) {
                                console.error("[Sidebar] メニュークリックエラー:", error)
                                e.preventDefault()
                                return false
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm relative",
                              "hover:bg-blue-50 hover:text-blue-600",
                              isActive ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-slate-600",
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium flex-1">{item.label}</span>
                            {showBadge && (
                              <span className={cn(
                                "bg-red-500 text-white text-xs font-bold rounded-full h-5 px-1.5 flex items-center justify-center min-w-[20px]",
                                isActive ? "bg-red-400" : ""
                              )}>
                                {pendingCount > 99 ? '99+' : pendingCount}
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )}

            {!isExternalWorker && (
              <li>
                <Link
                  href="/convenience"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 人事管理プルダウンを自動的に閉じる
                    setDropdownOpen(false)
                    if (!isAuthenticated || !currentUser) {
                      e.preventDefault()
                      console.warn(
                        "[Sidebar] 認証されていません。便利機能ページへの遷移をキャンセルします。"
                      )
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-blue-50 hover:text-blue-600",
                    (pathname === "/convenience" && !isInDropdownMenu) ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-slate-700"
                  )}
                  title={collapsed ? "便利機能" : undefined}
                >
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1 text-left">便利機能</span>
                  )}
                </Link>
              </li>
            )}
          </ul>

          {visibleAdminMenuItems.length > 0 && !collapsed && !isExternalWorker && (
            <div className="mt-6">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase mb-2">管理者メニュー</p>
              <ul className="space-y-1">
                {visibleAdminMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href && !isInDropdownMenu

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          e.stopPropagation()
                          // 人事管理プルダウンを自動的に閉じる
                          setDropdownOpen(false)
                          // 認証状態を確認
                          if (!isAuthenticated || !currentUser) {
                            e.preventDefault()
                            console.warn("[Sidebar] 認証されていません。メニュークリックをキャンセルします。")
                            return false
                          }
                          // エラーが発生しても再ログインを強制しない
                          try {
                            // 認証状態は問題ないので、通常通り遷移
                          } catch (error) {
                            console.error("[Sidebar] メニュークリックエラー:", error)
                            e.preventDefault()
                            return false
                          }
                        }}
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
          <div className="p-4 border-t border-slate-200 bg-[#efefef]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold whitespace-nowrap overflow-hidden">
                {(() => {
                  const text = typeof window !== 'undefined'
                    ? (localStorage.getItem(`employee-avatar-text-${currentUser.id}`) || (currentUser.name || '?').slice(0, 3))
                    : (currentUser.name || '?').slice(0, 3)
                  return text.slice(0, 3)
                })()}
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
              onClick={(e) => {
                e.stopPropagation()
                logout()
              }}
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
