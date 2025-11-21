'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Users, LayoutDashboard, Settings, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'

interface SidebarNavProps {
  workers: Array<{ id: string; name: string; teams?: string[]; role?: 'admin' | 'worker'; employeeType?: string | null; employeeId?: string }>
  currentRole: 'admin' | 'worker'
  /**
   * ヘッダー（タイトル＋ハンバーガー）を表示するかどうか
   * - モバイルのSheet内: true（従来通り）
   * - デスクトップの左固定メニュー内: false
   */
  showHeader?: boolean
  /**
   * 内部でサイドバー自体を折りたたみ可能にするかどうか
   * - モバイルのSheet内: true（従来通り）
   * - デスクトップの左固定メニュー内: false（親の開閉のみ）
   */
  collapsible?: boolean
}

interface Employee {
  id: string
  name: string
  employeeType?: string | null
}

export function SidebarNav({
  workers,
  currentRole,
  showHeader = true,
  collapsible = true,
}: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedEmployment, setSelectedEmployment] = useState<string>('all') // 業務委託/外注先
  const [selectedRole, setSelectedRole] = useState<string>('all') // WorkClock上の権限（リーダー/ワーカー）
  const [sortOrder, setSortOrder] = useState<string>('newest') // 並び順
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useAuth()
  const isMobile = useIsMobile()

  // 業務委託・外注先の社員を取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const employees = await response.json()
          // 業務委託・外注先の社員のみをフィルタリング
          const filteredEmployees = employees.filter((emp: Employee) => {
            const empType = emp.employeeType || ''
            return empType.includes('業務委託') || empType.includes('外注先')
          })
          setAllEmployees(filteredEmployees)
        }
      } catch (error) {
        console.error('社員データの取得エラー:', error)
      }
    }
    fetchEmployees()
  }, [])

  const currentWorkerId = pathname.includes('/workclock/worker/')
    ? pathname.split('/workclock/worker/')[1]
    : ''

  // HRシステム上のロールから管理者権限を判定
  const hrRole = currentUser?.role
  const allowedAdminRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
  const isHrAdmin = hrRole ? allowedAdminRoles.includes(hrRole) : false

  // WorkClock上のroleか、HRシステム上のroleのどちらかが管理者なら、管理メニュー（ダッシュボードや絞り込みUI）を表示
  const isAdminView = currentRole === 'admin' || isHrAdmin
  // 「設定」メニューはHRシステム上の管理ロールのみ表示（WorkClockリーダー単体では非表示）
  const canViewSettings = isHrAdmin

  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(workers.flatMap(w => w.teams || [])))
    return uniqueTeams as string[]
  }, [workers])

  // 現在のユーザーのWorkClockWorkerレコードを取得（リーダー判定用）
  const currentWorker = useMemo(() => {
    if (!currentUser?.id) return null
    return workers.find(w => w.employeeId === currentUser.id)
  }, [workers, currentUser?.id])

  // リーダーの場合は同じチームのメンバーだけを表示
  const isCurrentUserLeader = currentWorker?.role === 'admin'
  const currentUserTeams = currentWorker?.teams || []

  // WorkClockWorkerとして登録されているワーカーと、登録されていない業務委託・外注先の社員を統合
  const allAvailableWorkers = useMemo(() => {
    // WorkClockWorkerとして登録されているワーカーのemployeeIdを取得
    const registeredEmployeeIds = new Set(workers.map(w => w.employeeId || w.id))
    
    // 登録されていない業務委託・外注先の社員をWorkClockWorker形式に変換
    const unregisteredEmployees = allEmployees
      .filter(emp => !registeredEmployeeIds.has(emp.id))
      .map(emp => ({
        id: emp.id, // 一時的なIDとしてemployee.idを使用
        name: emp.name,
        teams: [],
        role: 'worker' as const,
        employeeType: emp.employeeType || null,
        employeeId: emp.id,
        isUnregistered: true, // 未登録フラグ
      }))
    
    // リーダーの場合は、同じチームに所属するワーカーだけを表示
    if (isCurrentUserLeader && currentUserTeams.length > 0) {
      // 既存のワーカーから同じチームのメンバーだけをフィルタリング
      const filteredWorkers = workers.filter(w => {
        if (w.id === currentWorker?.id) return true // 自分自身は常に表示
        const wTeams = w.teams || []
        return wTeams.some((t) => currentUserTeams.includes(t))
      })
      
      // 未登録の社員は表示しない（リーダーは登録済みのメンバーだけ管理）
      return filteredWorkers
    }
    
    // 既存のワーカーと未登録の社員を統合
    return [...workers, ...unregisteredEmployees]
  }, [workers, allEmployees, isCurrentUserLeader, currentUserTeams, currentWorker?.id])

  const filteredWorkers = useMemo(() => {
    let filtered = allAvailableWorkers
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(w => w.teams?.includes(selectedTeam))
    }
    
    if (selectedEmployment !== 'all') {
      filtered = filtered.filter(w => {
        const et = (w.employeeType || '').toString()
        return et.includes(selectedEmployment)
      })
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(w => {
        const role = w.role || 'worker'
        if (selectedRole === 'admin') {
          return role === 'admin'
        }
        if (selectedRole === 'worker') {
          return role !== 'admin'
        }
        return true
      })
    }
    
    // 並び替え
    const sorted = [...filtered]
    switch (sortOrder) {
      case 'name_asc':
        // 名前順（フリガナ昇順）
        sorted.sort((a, b) => {
          const aFurigana = a.furigana || a.name || ''
          const bFurigana = b.furigana || b.name || ''
          return aFurigana.localeCompare(bFurigana, 'ja')
        })
        break
      case 'team_asc':
        // チーム名順
        sorted.sort((a, b) => {
          const aTeam = a.teams?.[0] || 'zzz' // チーム未設定は最後
          const bTeam = b.teams?.[0] || 'zzz'
          return aTeam.localeCompare(bTeam, 'ja')
        })
        break
      case 'role_desc':
        // 権限順（リーダー→ワーカー）
        sorted.sort((a, b) => {
          const aRole = a.role === 'admin' ? 0 : 1
          const bRole = b.role === 'admin' ? 0 : 1
          return aRole - bRole
        })
        break
      case 'oldest':
        // 登録日時の古い順（デフォルトの逆）
        sorted.reverse()
        break
      case 'newest':
      default:
        // 登録日時の新しい順（デフォルト）
        // すでにAPIから新しい順で取得されているのでそのまま
        break
    }
    
    return sorted
  }, [allAvailableWorkers, selectedTeam, selectedEmployment, selectedRole, sortOrder])

  const closeMenuIfMobile = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const handleWorkerChange = (workerId: string) => {
    // 未登録の社員を選択した場合は、設定画面にリダイレクト
    const selectedWorker = allAvailableWorkers.find(w => w.id === workerId)
    if (selectedWorker && (selectedWorker as any).isUnregistered) {
      router.push(`/workclock/settings?employeeId=${workerId}`)
      closeMenuIfMobile()
    } else {
      router.push(`/workclock/worker/${workerId}`)
      closeMenuIfMobile()
    }
  }

  const effectiveCollapsed = collapsible ? isCollapsed : false

  // モバイル時のみスクロールでメニューを閉じる
  useEffect(() => {
    if (!isMobile || !isMobileMenuOpen) return

    const handleScroll = () => {
      setIsMobileMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, isMobileMenuOpen])

  return (
    <div
      className={cn(
        'relative flex flex-col bg-sidebar',
        collapsible ? (effectiveCollapsed ? 'w-16' : 'w-64') : 'w-full',
        showHeader === false ? 'h-full' : 'h-screen border-r transition-all duration-300'
      )}
      style={{ backgroundColor: '#add1cd' }}
    >
      {showHeader && (
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!effectiveCollapsed && (
            <h2 className="text-lg font-semibold text-sidebar-foreground">時間管理システム</h2>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              {effectiveCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      <ScrollArea className={showHeader === false ? 'h-full' : 'flex-1'}>
        <div className="space-y-2 p-2">
          {isAdminView && (
            <Link href="/workclock/admin">
              <Button
                variant={pathname === '/workclock/admin' ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', effectiveCollapsed && 'justify-center px-2')}
              >
                <LayoutDashboard className="h-4 w-4" />
                {!effectiveCollapsed && <span className="ml-2">管理者ダッシュボード</span>}
              </Button>
            </Link>
          )}

          {canViewSettings && (
            <Link href="/workclock/settings">
              <Button
                variant={pathname === '/workclock/settings' ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', effectiveCollapsed && 'justify-center px-2')}
              >
                <Settings className="h-4 w-4" />
                {!effectiveCollapsed && <span className="ml-2">設定</span>}
              </Button>
            </Link>
          )}

          {!effectiveCollapsed && isAdminView && (
            <div className="mt-4 space-y-3 px-2 py-2">
              <h3 className="flex items-center text-xs font-medium text-muted-foreground">
                <Users className="mr-2 h-3 w-3" />
                ワーカー選択
              </h3>
              
              {/* フィルターは常に表示し、リストに0件でも操作可能にする */}
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">チーム</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">雇用形態</label>
                  <Select value={selectedEmployment} onValueChange={setSelectedEmployment}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="業務委託">業務委託</SelectItem>
                      <SelectItem value="外注先">外注先</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">権限</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="admin">リーダー</SelectItem>
                      <SelectItem value="worker">業務委託・外注先</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">並び順</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">登録日時（新しい順）</SelectItem>
                      <SelectItem value="oldest">登録日時（古い順）</SelectItem>
                      <SelectItem value="name_asc">名前順（フリガナ）</SelectItem>
                      <SelectItem value="team_asc">チーム名順</SelectItem>
                      <SelectItem value="role_desc">権限順（リーダー優先）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">ワーカーを選ぶ</label>
                <Select value={currentWorkerId} onValueChange={handleWorkerChange}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="ワーカーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredWorkers.length > 0 ? (
                      filteredWorkers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          <div className="flex flex-col">
                            <span>{worker.name}</span>
                            {worker.teams && worker.teams.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {worker.teams.join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_results__" disabled>
                        該当するワーカーがありません
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {workers.length === 0 && (
                  <div className="text-xs text-muted-foreground py-1">
                    ワーカーが登録されていません
                  </div>
                )}
              </div>
            </div>
          )}
          
          {effectiveCollapsed && workers.length > 0 && isAdminView && (
            <Select value={currentWorkerId} onValueChange={handleWorkerChange}>
              <SelectTrigger className="w-full border-0 bg-transparent px-2">
                <Users className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                {filteredWorkers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    <div className="flex flex-col">
                      <span>{worker.name}</span>
                      {worker.teams && worker.teams.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {worker.teams.join(', ')}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
