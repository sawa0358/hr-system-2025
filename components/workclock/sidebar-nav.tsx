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
import { ChevronLeft, ChevronRight, Users, LayoutDashboard, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SidebarNavProps {
  workers: Array<{ id: string; name: string; teams?: string[]; role?: 'admin' | 'worker'; employeeType?: string | null; employeeId?: string }>
  currentRole: 'admin' | 'worker'
}

interface Employee {
  id: string
  name: string
  employeeType?: string | null
}

export function SidebarNav({ workers, currentRole }: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedEmployment, setSelectedEmployment] = useState<string>('all') // 業務委託/外注先
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useAuth()

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

  // WorkClock上のroleか、HRシステム上のroleのどちらかが管理者なら、管理メニューを表示
  const isAdminView = currentRole === 'admin' || isHrAdmin

  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(workers.flatMap(w => w.teams || [])))
    return uniqueTeams as string[]
  }, [workers])

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
    
    // 既存のワーカーと未登録の社員を統合
    return [...workers, ...unregisteredEmployees]
  }, [workers, allEmployees])

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
    
    return filtered
  }, [allAvailableWorkers, selectedTeam, selectedEmployment])

  const handleWorkerChange = (workerId: string) => {
    // 未登録の社員を選択した場合は、設定画面にリダイレクト
    const selectedWorker = allAvailableWorkers.find(w => w.id === workerId)
    if (selectedWorker && (selectedWorker as any).isUnregistered) {
      router.push(`/workclock/settings?employeeId=${workerId}`)
    } else {
      router.push(`/workclock/worker/${workerId}`)
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-screen flex-col border-r bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">時間管理システム</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {isAdminView && (
            <Link href="/workclock/admin">
              <Button
                variant={pathname === '/workclock/admin' ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', isCollapsed && 'justify-center px-2')}
              >
                <LayoutDashboard className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">管理者ダッシュボード</span>}
              </Button>
            </Link>
          )}

          {isAdminView && (
            <Link href="/workclock/settings">
              <Button
                variant={pathname === '/workclock/settings' ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', isCollapsed && 'justify-center px-2')}
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">設定</span>}
              </Button>
            </Link>
          )}

          {!isCollapsed && isAdminView && (
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
          
          {isCollapsed && workers.length > 0 && isAdminView && (
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
