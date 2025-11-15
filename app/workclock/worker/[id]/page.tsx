'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Worker, TimeEntry } from '@/lib/workclock/types'
import {
  getWorkerById,
  getEntriesByWorkerAndMonth,
  getWorkers,
} from '@/lib/workclock/api-storage'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { WorkerSummary } from '@/components/workclock/worker-summary'
import { CalendarView } from '@/components/workclock/calendar-view'
import { ExportPDFButton } from '@/components/workclock/export-pdf-button'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/lib/auth-context'

export default function WorkerPage() {
  const params = useParams()
  const workerId = params.id as string
  const { currentUser } = useAuth()

  const [worker, setWorker] = useState<Worker | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (currentUser?.id) {
      loadData()
    }
  }, [workerId, currentDate, refreshKey, currentUser?.id])

  const loadData = async () => {
    try {
      if (!currentUser?.id) {
        console.error('WorkClock: currentUser.idが取得できません')
        return
      }

      const foundWorker = await getWorkerById(workerId, currentUser.id)
      setWorker(foundWorker || null)

      const allWorkers = await getWorkers(currentUser.id)
      setWorkers(allWorkers)

      if (foundWorker) {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const monthEntries = await getEntriesByWorkerAndMonth(workerId, year, month, currentUser.id)
        setEntries(monthEntries)
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    }
  }

  const handleEntriesChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (!worker) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">ワーカーが見つかりません</h2>
          <p className="text-muted-foreground">指定されたIDのワーカーは存在しません。</p>
        </div>
      </div>
    )
  }

  // ワーカー権限のユーザーの場合はSidebarNavを非表示
  // HRシステムのユーザーroleが管理者系（admin, hr, manager, store_manager, sub_manager）の場合は常に表示
  // WorkClockのworker.roleが'worker'で、かつHRシステムのroleが一般ユーザー（viewer, general）の場合のみ非表示
  // currentUserが存在しない場合は管理者として扱う（SidebarNavを表示）
  const isAdminUser = currentUser?.role ? ['admin', 'hr', 'manager', 'store_manager', 'sub_manager'].includes(currentUser.role) : true
  const isWorkerOnly = !isAdminUser && worker.role === 'worker'
  
  // デバッグ用ログ
  console.log('WorkClock WorkerPage:', { 
    workerId, 
    workerRole: worker.role,
    currentUser: currentUser ? { id: currentUser.id, role: currentUser.role } : null,
    currentUserRole: currentUser?.role,
    isAdminUser,
    isWorkerOnly,
    shouldShowSidebar: !isWorkerOnly 
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const todayEntries = entries.filter((e) => e.date === todayStr)

  // SidebarNavのcurrentRoleを決定（管理者の場合は'admin'、ワーカーの場合は'worker'）
  const sidebarRole = isAdminUser ? 'admin' : (worker.role || 'admin')
  
  return (
    <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }}>
      {!isWorkerOnly && worker && <SidebarNav workers={workers} currentRole={sidebarRole} />}
      
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#bddcd9' }}>
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          <WorkerSummary
            worker={worker}
            monthlyEntries={entries}
            todayEntries={todayEntries}
            selectedMonth={currentDate}
          />

          <CalendarView
            workerId={workerId}
            entries={entries}
            onEntriesChange={handleEntriesChange}
            actionButtons={
              <>
                <ExportPDFButton
                  worker={worker}
                  entries={entries}
                  month={currentDate}
                  variant="outline"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // ログアウト処理
                          window.location.href = '/'
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ログアウト</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            }
          />
        </div>
      </main>
    </div>
  )
}
