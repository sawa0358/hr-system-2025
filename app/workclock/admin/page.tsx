'use client'

import { useEffect, useState } from 'react'
import { Worker, TimeEntry } from '@/lib/workclock/types'
import { getWorkers, getTimeEntries, getWorkerById, getEntriesByWorkerAndMonth } from '@/lib/workclock/api-storage'
import { useAuth } from '@/lib/auth-context'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { AdminOverview } from '@/components/workclock/admin-overview'
import { WorkerTable } from '@/components/workclock/worker-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { downloadPDF } from '@/lib/workclock/pdf-export'

export default function AdminPage() {
  const { currentUser } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (currentUser?.id) {
      loadData()
    }
  }, [currentDate, currentUser])

  const loadData = async () => {
    try {
      if (!currentUser?.id) {
        console.error('WorkClock: currentUser.idが取得できません')
        return
      }

      const loadedWorkers = await getWorkers(currentUser.id)
      setWorkers(loadedWorkers)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      const allEntries = await getTimeEntries(currentUser.id)
      const entries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getFullYear() === year && entryDate.getMonth() === month
      })
      
      setAllEntries(entries)
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

  const handleExportPDF = async (workerId: string) => {
    try {
      const worker = await getWorkerById(workerId)
      if (!worker) {
        alert('ワーカー情報が見つかりません')
        return
      }

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const workerEntries = await getEntriesByWorkerAndMonth(workerId, year, month)
      
      downloadPDF(worker, workerEntries, currentDate)
    } catch (error) {
      console.error('PDFエクスポートエラー:', error)
      alert('PDFエクスポートに失敗しました')
    }
  }

  const adminWorker = workers.find((w) => w.role === 'admin') || {
    id: 'admin',
    name: '管理者',
    email: 'admin@example.com',
    hourlyRate: 0,
    role: 'admin' as const,
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }}>
      <SidebarNav workers={workers} currentRole="admin" />
      
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#bddcd9' }}>
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
            selectedMonth={currentDate}
          />

          <WorkerTable
            workers={workers}
            allEntries={allEntries}
            onExportPDF={handleExportPDF}
          />
        </div>
      </main>
    </div>
  )
}
