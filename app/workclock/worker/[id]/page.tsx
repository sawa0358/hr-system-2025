"use client"

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import {
  getWorkerById,
  getEntriesByWorkerAndMonth,
  getWorkers,
  getRewardsByWorkerAndMonth,
} from '@/lib/workclock/api-storage'
import { api } from '@/lib/workclock/api'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { WorkerSummary } from '@/components/workclock/worker-summary'
import { CalendarView } from '@/components/workclock/calendar-view'
import { ExportPDFButton } from '@/components/workclock/export-pdf-button'
import { RewardManagerModal } from '@/components/workclock/reward-manager-modal'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { Input } from '@/components/ui/input'

export default function WorkerPage() {
  const params = useParams()
  const workerId = params.id as string
  const { currentUser } = useAuth()

  const [worker, setWorker] = useState<Worker | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [checklistReward, setChecklistReward] = useState(0)
  const [checklistDates, setChecklistDates] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const isMobile = useIsMobile()

  // 現在ログイン中ユーザーのWorkClockWorkerレコードとリーダー判定
  const ownWorker = useMemo(
    () => workers.find((w) => w.employeeId === currentUser?.id) || null,
    [workers, currentUser?.id],
  )
  const isLeader = ownWorker?.role === 'admin'

  // HR-systemのroleが一般ユーザー（viewer, general）の場合、
  // かつ WorkClock 上でリーダーでない場合は SidebarNav を非表示（Worker専用画面とする）
  const isWorkerOnly = useMemo(() => {
    if (!currentUser) return true
    const isGeneralHR = currentUser.role === 'viewer' || currentUser.role === 'general'
    return isGeneralHR && !isLeader
  }, [currentUser, isLeader])

  // 「今月の報酬見込」のサマリーをクリックできる権限チェック（店長・マネージャー・総務・管理者のみ）
  const canClickRewardSummary = useMemo(() => {
    if (!currentUser?.role) return false
    const allowedRoles = ['store_manager', 'manager', 'hr', 'admin']
    return allowedRoles.includes(currentUser.role)
  }, [currentUser?.role])

  useEffect(() => {
    // currentUserがまだ読み込まれていない場合は何もしない（初期読み込み待ち）
    if (!currentUser?.id) {
      return
    }
    loadData()
  }, [workerId, currentDate, refreshKey, currentUser?.id])

  // モバイル時のスクロールでメニューを閉じる
  useEffect(() => {
    if (!isMobile || !isMenuOpen) return

    const handleScroll = () => {
      setIsMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [isMobile, isMenuOpen])

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
        const month = currentDate.getMonth() + 1
        const monthEntries = await getEntriesByWorkerAndMonth(workerId, year, month, currentUser.id)
        setEntries(monthEntries)

        const monthRewards = await getRewardsByWorkerAndMonth(workerId, year, month, currentUser.id)
        setRewards(monthRewards)

        // チェックリスト提出から報酬を取得
        try {
          const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
          const lastDay = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
          const submissionRes = await api.checklist.submissions.getAll({
            workerId,
            startDate: firstDay,
            endDate: lastDay,
          }) as { submissions: any[] }

          if (submissionRes.submissions) {
            const totalChecklist = submissionRes.submissions.reduce((total, sub) => {
              if (sub.items) {
                return total + sub.items.reduce((itemTotal: number, item: any) => {
                  // 加算条件: 通常項目のチェック済み、または自由記入欄の入力あり
                  const isEligible = item.isChecked || (item.isFreeText && item.freeTextValue && item.freeTextValue.trim() !== '')
                  return itemTotal + (isEligible ? (item.reward || 0) : 0)
                }, 0)
              }
              return total
            }, 0)
            setChecklistReward(totalChecklist)

            // チェックリストが記録されている日付を抽出
            const dates = submissionRes.submissions.map((sub: any) => {
              const d = new Date(sub.date)
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            })
            setChecklistDates(dates)
          }
        } catch (err) {
          console.error('チェックリスト報酬の取得に失敗:', err)
        }
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    }
  }

  const handleEntriesChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // 本日分のエントリを計算（workerの有無に関わらず毎レンダー同じ順序で呼ぶ）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`
  const todayEntries = entries.filter((e) => e.date === todayStr)

  // 勤務記録の編集可否（3日ロック + 権限 + 自分のページかどうか）をフロント側でも判定
  const canEditEntries = useMemo(() => {
    const role = currentUser?.role
    // マネージャー・総務・管理者は常に編集可能（サーバー側ロジックと合わせる）
    if (role === 'manager' || role === 'hr' || role === 'admin') {
      return true
    }

    // リーダーや一般ユーザーは、自分自身のワーカーページでのみ編集可能
    // workerId（URL上のワーカーID）と自分のワーカーIDを比較
    if (ownWorker && ownWorker.id !== workerId) {
      // 他人のページを見ている場合は編集不可
      return false
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirdOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 3)

    // 表示中の月の1日を対象日とみなしてロック判定
    const entryDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const isLockedMonth = entryDate < firstOfCurrentMonth && now >= thirdOfCurrentMonth

    if (isLockedMonth && worker?.allowPastEntryEdit) {
      return true
    }

    return !isLockedMonth
  }, [currentDate, currentUser?.role, ownWorker, workerId, worker?.allowPastEntryEdit])

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

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }}>
      {!isWorkerOnly && (
        isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50 flex gap-2">
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                  style={{ backgroundColor: '#f5f4cd' }}
                  aria-label="時間管理メニューを開く"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              {isLeader && ownWorker && (
                <Link href={`/workclock/worker/${ownWorker.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                    style={{ backgroundColor: '#f5f4cd' }}
                    aria-label="自分の勤務画面へ移動"
                  >
                    私
                  </Button>
                </Link>
              )}
            </div>
            <SheetContent
              side="top"
              className="p-0 w-full h-auto max-h-[80vh]"
              onInteractOutside={() => setIsMenuOpen(false)}
            >
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle>時間管理システム</SheetTitle>
              </SheetHeader>
              <div className="max-h-[calc(80vh-60px)] overflow-y-auto">
                <SidebarNav
                  workers={workers}
                  currentRole={worker.role}
                  showHeader={false}
                  collapsible={false}
                />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                style={{ backgroundColor: '#f5f4cd' }}
                aria-label="時間管理メニューを開く"
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {isLeader && ownWorker && (
                <Link href={`/workclock/worker/${ownWorker.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                    style={{ backgroundColor: '#f5f4cd' }}
                    aria-label="自分の勤務画面へ移動"
                  >
                    私
                  </Button>
                </Link>
              )}
            </div>
            <div
              className={`h-full overflow-hidden border-r border-slate-200 bg-sidebar transition-all duration-300 ${isMenuOpen ? 'w-72' : 'w-0'
                }`}
              style={{ backgroundColor: '#add1cd' }}
            >
              {isMenuOpen && (
                <>
                  <div className="px-4 py-3 border-b">
                    <h2 className="text-base font-semibold text-sidebar-foreground break-words">
                      時間管理システム
                    </h2>
                  </div>
                  <SidebarNav
                    workers={workers}
                    currentRole={worker.role}
                    showHeader={false}
                    collapsible={false}
                  />
                </>
              )}
            </div>
          </>
        )
      )}

      <main
        className={`flex-1 overflow-y-auto ${!isWorkerOnly && isMobile ? 'pt-20' : !isWorkerOnly ? 'pt-16' : ''}`}
        style={{ backgroundColor: '#bddcd9' }}
      >
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <WorkerSummary
                worker={worker}
                monthlyEntries={entries}
                todayEntries={todayEntries}
                selectedMonth={currentDate}
                rewards={rewards}
                checklistReward={checklistReward}
                onRewardClick={canClickRewardSummary ? () => setIsRewardModalOpen(true) : undefined}
              />
            </div>
            <div className="flex gap-2 mt-2 self-start">
              <ExportPDFButton
                worker={worker}
                entries={entries}
                month={currentDate}
                rewards={rewards}
                checklistReward={checklistReward}
                variant="outline"
              />
              {/* SpecialRewardButton は WorkerSummary に統合されたため削除 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.confirm('時間管理システムからログアウトしますか？')) {
                          // ログアウト処理
                          window.location.href = '/'
                        }
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
            </div>
          </div>

          {/* 年月指定（過去記録遡り用） */}
          <div className="mt-2 mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700">表示年月:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-24 h-8"
                  value={currentDate.getFullYear()}
                  onChange={(e) => {
                    const year = Number(e.target.value) || currentDate.getFullYear()
                    const next = new Date(year, currentDate.getMonth(), 1)
                    setCurrentDate(next)
                  }}
                />
                <span className="text-sm">年</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  className="w-16 h-8"
                  value={currentDate.getMonth() + 1}
                  onChange={(e) => {
                    let month = Number(e.target.value) || currentDate.getMonth() + 1
                    if (month < 1) month = 1
                    if (month > 12) month = 12
                    const next = new Date(currentDate.getFullYear(), month - 1, 1)
                    setCurrentDate(next)
                  }}
                />
                <span className="text-sm">月</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const now = new Date()
                  const next = new Date(now.getFullYear(), now.getMonth(), 1)
                  setCurrentDate(next)
                }}
              >
                今月へ
              </Button>
            </div>
          </div>

          {/* 編集不可の場合の説明テキスト */}
          {!canEditEntries && (
            <p className="mb-2 text-xs text-red-600">
              {ownWorker && ownWorker.id !== workerId
                ? 'このワーカーの勤務記録は閲覧のみ可能です。編集はできません。'
                : '2日前の記録以前の勤務記録は、マネージャー・総務・管理者のみ編集できます。必要な場合は上長に依頼してください。'}
            </p>
          )}

          <CalendarView
            workerId={workerId}
            employeeId={worker?.employeeId || workerId}
            worker={worker}
            entries={entries}
            onEntriesChange={handleEntriesChange}
            selectedMonth={currentDate}
            onMonthChange={(next) => {
              // カレンダー側の月変更を親に反映
              setCurrentDate(next)
            }}
            canEditEntries={canEditEntries}
            checklistDates={checklistDates}
          />
        </div>
      </main>

      {worker && (
        <RewardManagerModal
          worker={worker}
          month={currentDate}
          isOpen={isRewardModalOpen}
          onClose={() => setIsRewardModalOpen(false)}
          onUpdate={handleEntriesChange}
        />
      )}
    </div>
  )
}
