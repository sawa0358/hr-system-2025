'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import { getMonthlyTotal } from '@/lib/workclock/time-utils'
import { calculateWorkerMonthlyCost } from '@/lib/workclock/cost-calculation'
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react'

interface AdminOverviewProps {
  workers: Worker[]
  allEntries: TimeEntry[]
  allRewards: Reward[]
  selectedMonth: Date
}

export function AdminOverview({ workers, allEntries, allRewards, selectedMonth }: AdminOverviewProps) {
  const activeWorkers = workers.filter((w) => w.role === 'worker')
  
  const totalHoursAndMinutes = getMonthlyTotal(allEntries)
  const totalHours = totalHoursAndMinutes.hours + totalHoursAndMinutes.minutes / 60

  const totalCost = activeWorkers.reduce((sum, worker) => {
    const workerEntries = allEntries.filter((e) => e.workerId === worker.id)
    const workerRewards = allRewards.filter((r) => r.workerId === worker.id)
    return sum + calculateWorkerMonthlyCost(worker, workerEntries, workerRewards)
  }, 0)

  const avgHoursPerWorker = activeWorkers.length > 0 ? totalHours / activeWorkers.length : 0

  const monthName = selectedMonth.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">{monthName}の勤務状況</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">登録ワーカー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers.length}人</div>
            <p className="text-xs text-muted-foreground">アクティブなワーカー</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総勤務時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}時間</div>
            <p className="text-xs text-muted-foreground">{monthName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均勤務時間</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHoursPerWorker.toFixed(1)}時間</div>
            <p className="text-xs text-muted-foreground">1人あたり</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総人件費</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{Math.floor(totalCost).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthName}見込</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
