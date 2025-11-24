'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import { getMonthlyTotal } from '@/lib/workclock/time-utils'
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react'

interface AdminOverviewProps {
  workers: Worker[]
  allEntries: TimeEntry[]
  allRewards: Reward[]
  selectedMonth: Date
}

// PDF出力と同じロジックで、ワーカー単位の月間コストを算出
function calculateWorkerMonthlyCost(worker: Worker, entries: TimeEntry[]): number {
  if (!entries || entries.length === 0) {
    return typeof worker.monthlyFixedAmount === 'number'
      ? worker.monthlyFixedAmount || 0
      : 0
  }

  // 時給パターンの計算（wagePattern が設定されているエントリのみ対象）
  const entriesByPattern = entries.reduce((acc, entry) => {
    const pattern = entry.wagePattern
    if (!pattern) {
      return acc
    }
    if (!acc[pattern]) acc[pattern] = []
    acc[pattern].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  const patternTotals: Record<'A' | 'B' | 'C', { hours: number; minutes: number; amount: number }> =
    {
      A: { hours: 0, minutes: 0, amount: 0 },
      B: { hours: 0, minutes: 0, amount: 0 },
      C: { hours: 0, minutes: 0, amount: 0 },
    }

  Object.entries(entriesByPattern).forEach(([pattern, patternEntries]) => {
    const total = getMonthlyTotal(patternEntries)
    const hours = total.hours + total.minutes / 60
    const rate =
      pattern === 'A'
        ? worker.hourlyRate
        : pattern === 'B'
        ? worker.hourlyRateB || worker.hourlyRate
        : worker.hourlyRateC || worker.hourlyRate

    patternTotals[pattern as 'A' | 'B' | 'C'] = {
      hours: total.hours,
      minutes: total.minutes,
      amount: hours * rate,
    }
  })

  // 回数パターンの計算（countPatternが設定されているエントリから計算）
  let countAmount = 0
  entries.forEach((entry) => {
    if (entry.countPattern) {
      const pattern = entry.countPattern
      const count = entry.count || 1
      const rate =
        pattern === 'A'
          ? worker.countRateA || 0
          : pattern === 'B'
          ? worker.countRateB || 0
          : worker.countRateC || 0
      countAmount += count * rate
    }
  })

  const monthlyFixedAmount =
    typeof worker.monthlyFixedAmount === 'number' && worker.monthlyFixedAmount > 0
      ? worker.monthlyFixedAmount
      : 0

  return (
    patternTotals.A.amount +
    patternTotals.B.amount +
    patternTotals.C.amount +
    countAmount +
    monthlyFixedAmount
  )
}

export function AdminOverview({ workers, allEntries, allRewards, selectedMonth }: AdminOverviewProps) {
  const activeWorkers = workers.filter((w) => w.role === 'worker')
  
  const totalHoursAndMinutes = getMonthlyTotal(allEntries)
  const totalHours = totalHoursAndMinutes.hours + totalHoursAndMinutes.minutes / 60

  const totalCost = activeWorkers.reduce((sum, worker) => {
    const workerEntries = allEntries.filter((e) => e.workerId === worker.id)
    const workerRewards = allRewards.filter((r) => r.workerId === worker.id)
    const rewardAmount = workerRewards.reduce((acc, r) => acc + r.amount, 0)
    return sum + calculateWorkerMonthlyCost(worker, workerEntries) + rewardAmount
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
