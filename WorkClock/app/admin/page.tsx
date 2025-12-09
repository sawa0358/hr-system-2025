'use client'

import { useEffect, useState } from 'react'
import { Worker, TimeEntry } from '@/lib/types'
import { getWorkers, getTimeEntries, initializeSampleData, getWorkerById, getEntriesByWorkerAndMonth } from '@/lib/storage'
import { SidebarNav } from '@/components/sidebar-nav'
import { AdminOverview } from '@/components/admin-overview'
import { WorkerTable } from '@/components/worker-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { downloadPDF, WithholdingTaxRates, DEFAULT_WITHHOLDING_RATES } from '@/lib/pdf-export'
import { api } from '@/lib/api'

export default function AdminPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const initialize = async () => {
      await initializeSampleData()
      await loadData()
    }
    initialize()
  }, [currentDate])

  const loadData = async () => {
    try {
      const loadedWorkers = await getWorkers()
      setWorkers(loadedWorkers)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      const entries = (await getTimeEntries()).filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate.getFullYear() === year && entryDate.getMonth() === month
      })
      
      setAllEntries(entries)
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error)
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
      
      // 源泉徴収率を取得
      let withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
      try {
        const response: any = await api.withholdingTaxSettings.get()
        if (response?.rateUnder1M !== undefined && response?.rateOver1M !== undefined) {
          withholdingRates = {
            rateUnder1M: response.rateUnder1M,
            rateOver1M: response.rateOver1M,
          }
        }
      } catch (e) {
        console.warn('源泉徴収率の取得に失敗しました。デフォルト値を使用します。', e)
      }
      
      await downloadPDF(worker, workerEntries, currentDate, withholdingRates)
    } catch (error) {
      console.error('PDFエクスポートに失敗しました:', error)
      alert('PDFエクスポートに失敗しました。もう一度お試しください。')
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
    <div className="flex h-screen">
      <SidebarNav workers={workers} currentRole="admin" />
      
      <main className="flex-1 overflow-y-auto">
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
