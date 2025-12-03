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
import { ChevronLeft, ChevronRight, Users, LayoutDashboard, Settings, X } from 'lucide-react'

const SIDEBAR_FILTER_KEY = 'workclock_sidebar_filters'

interface SidebarFilters {
  team: string
  employeeType: string
  role: string
  sortBy: string
}

interface SidebarNavProps {
  workers: Array<{ id: string; name: string; teams?: string[]; role?: 'admin' | 'worker'; employeeType?: string; createdAt?: string }>
  currentRole: 'admin' | 'worker'
}

// localStorageからフィルターを読み込む
function loadFilters(): SidebarFilters {
  if (typeof window === 'undefined') {
    return { team: 'all', employeeType: 'all', role: 'all', sortBy: 'registrationDesc' }
  }
  const saved = localStorage.getItem(SIDEBAR_FILTER_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  return { team: 'all', employeeType: 'all', role: 'all', sortBy: 'registrationDesc' }
}

export function SidebarNav({ workers, currentRole }: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('registrationDesc')
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // 初回マウント時にlocalStorageからフィルターを復元
  useEffect(() => {
    const filters = loadFilters()
    setSelectedTeam(filters.team)
    setSelectedEmployeeType(filters.employeeType)
    setSelectedRole(filters.role)
    setSortBy(filters.sortBy)
    setIsInitialized(true)
  }, [])

  // フィルター変更時にlocalStorageに保存
  useEffect(() => {
    if (!isInitialized) return
    const filters: SidebarFilters = {
      team: selectedTeam,
      employeeType: selectedEmployeeType,
      role: selectedRole,
      sortBy: sortBy
    }
    localStorage.setItem(SIDEBAR_FILTER_KEY, JSON.stringify(filters))
  }, [selectedTeam, selectedEmployeeType, selectedRole, sortBy, isInitialized])

  // フィルターをクリア
  const handleClearFilters = () => {
    setSelectedTeam('all')
    setSelectedEmployeeType('all')
    setSelectedRole('all')
    setSortBy('registrationDesc')
  }

  const currentWorkerId = pathname.includes('/worker/') 
    ? pathname.split('/worker/')[1] 
    : ''

  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(workers.flatMap(w => w.teams || [])))
    return uniqueTeams as string[]
  }, [workers])

  const employeeTypes = useMemo(() => {
    const uniqueTypes = Array.from(new Set(workers.map(w => w.employeeType).filter(Boolean)))
    return uniqueTypes as string[]
  }, [workers])

  const filteredWorkers = useMemo(() => {
    let filtered = workers
    
    // チームフィルター
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(w => w.teams?.includes(selectedTeam))
    }

    // 雇用形態フィルター
    if (selectedEmployeeType !== 'all') {
      filtered = filtered.filter(w => w.employeeType === selectedEmployeeType)
    }
    
    // 権限フィルター
    if (selectedRole !== 'all') {
      filtered = filtered.filter(w => w.role === selectedRole)
    }

    // 並び順
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'registrationDesc':
          return b.id.localeCompare(a.id)
        case 'registrationAsc':
          return a.id.localeCompare(b.id)
        case 'nameAsc':
          return a.name.localeCompare(b.name, 'ja')
        case 'nameDesc':
          return b.name.localeCompare(a.name, 'ja')
        default:
          return 0
      }
    })
    
    return filtered
  }, [workers, selectedTeam, selectedEmployeeType, selectedRole, sortBy])

  const handleWorkerChange = (workerId: string) => {
    router.push(`/worker/${workerId}`)
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
          {currentRole === 'admin' && (
            <Link href="/admin">
              <Button
                variant={pathname === '/admin' ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start', isCollapsed && 'justify-center px-2')}
              >
                <LayoutDashboard className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">管理者ダッシュボード</span>}
              </Button>
            </Link>
          )}

          <Link href="/settings">
            <Button
              variant={pathname === '/settings' ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start', isCollapsed && 'justify-center px-2')}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">設定</span>}
            </Button>
          </Link>

          {!isCollapsed && (
            <div className="mt-4 space-y-3 px-2 py-2">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center text-xs font-medium text-muted-foreground">
                  <Users className="mr-2 h-3 w-3" />
                  ワーカー選択
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  クリア
                </Button>
              </div>
              
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
                  <Select value={selectedEmployeeType} onValueChange={setSelectedEmployeeType}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {employeeTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="admin">管理者</SelectItem>
                      <SelectItem value="worker">ワーカー</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">並び順</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registrationDesc">登録日時（新しい順）</SelectItem>
                      <SelectItem value="registrationAsc">登録日時（古い順）</SelectItem>
                      <SelectItem value="nameAsc">名前（あいうえお順）</SelectItem>
                      <SelectItem value="nameDesc">名前（逆順）</SelectItem>
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
              </div>
            </div>
          )}
          
          {isCollapsed && workers.length > 0 && (
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
