"use client"

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import { getWorkers, getTimeEntries, getRewardsByWorkerAndMonth } from '@/lib/workclock/api-storage'
import { useAuth } from '@/lib/auth-context'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { AdminOverview } from '@/components/workclock/admin-overview'
import { WorkerTable } from '@/components/workclock/worker-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { downloadPDF, downloadCombinedPDF } from '@/lib/workclock/pdf-export'
import { useIsMobile } from '@/hooks/use-mobile'

export default function AdminPage() {
  const { currentUser } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([])
  const [allRewards, setAllRewards] = useState<Reward[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  // 現在ログイン中ユーザーのWorkClockWorkerレコードとリーダー判定
  const ownWorker = useMemo(
    () => workers.find((w) => w.employeeId === currentUser?.id) || null,
    [workers, currentUser?.id],
  )
  const isLeader = ownWorker?.role === 'admin'

  useEffect(() => {
    if (currentUser?.id) {
      loadData()
    }
  }, [currentDate, currentUser])

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

      const loadedWorkers = await getWorkers(currentUser.id)
      setWorkers(loadedWorkers)

      const year = currentDate.getFullYear()
      const monthIndex = currentDate.getMonth()
      const apiMonth = monthIndex + 1
      const allEntries = await getTimeEntries(currentUser.id)
      const entries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex
      })
      
      setAllEntries(entries)

      // 全ワーカーの特別報酬を取得
      const rewardsPromises = loadedWorkers.map(worker => 
        getRewardsByWorkerAndMonth(worker.id, year, apiMonth, currentUser.id)
      )
      const rewardsArrays = await Promise.all(rewardsPromises)
      const allRewards = rewardsArrays.flat()
      setAllRewards(allRewards)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    }
  }

  const goToPreviousMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleExportPDF = (workerId: string) => {
    try {
      const worker = workers.find((w) => w.id === workerId)
      if (!worker) {
        alert('ワーカー情報が見つかりません')
        return
      }

      const workerEntries = allEntries.filter((e) => e.workerId === workerId)
      const workerRewards = allRewards.filter((r) => r.workerId === workerId)

      downloadPDF(worker, workerEntries, currentDate, workerRewards)
    } catch (error) {
      console.error('PDFエクスポートエラー:', error)
      alert('PDFエクスポートに失敗しました')
    }
  }

  const handleExportAllPDF = (workerIds: string[]) => {
    try {
      const items = workerIds
        .map((id) => {
          const worker = workers.find((w) => w.id === id)
          if (!worker) return null
          const entries = allEntries.filter((e) => e.workerId === id)
          const rewards = allRewards.filter((r) => r.workerId === id)
          return { worker, entries, rewards }
        })
        .filter((item): item is { worker: Worker; entries: TimeEntry[]; rewards: Reward[] } => item !== null)

      if (items.length === 0) {
        alert('PDF出力対象のワーカーが見つかりません')
        return
      }

      downloadCombinedPDF(items, currentDate)
    } catch (error) {
      console.error('一括PDFエクスポートエラー:', error)
      alert('一括PDFエクスポートに失敗しました')
    }
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }}>
      {isMobile ? (
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
                currentRole="admin" 
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
            className={`h-full overflow-hidden border-r border-slate-200 bg-sidebar transition-all duration-300 ${
              isMenuOpen ? 'w-72' : 'w-0'
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
                  currentRole="admin"
                  showHeader={false}
                  collapsible={false}
                />
              </>
            )}
          </div>
        </>
      )}
      
      <main
        className={`flex-1 overflow-y-auto ${isMobile ? 'pt-20' : 'pt-16'}`}
        style={{ backgroundColor: '#bddcd9' }}
      >
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                今月
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AdminOverview
            workers={workers}
            allEntries={allEntries}
            allRewards={allRewards}
            selectedMonth={currentDate}
          />

          <WorkerTable
            workers={workers}
            allEntries={allEntries}
            allRewards={allRewards}
            onExportPDF={handleExportPDF}
            onExportAllPDF={handleExportAllPDF}
          />
        </div>
      </main>
    </div>
  )
}
