'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Worker, TimeEntry } from '@/lib/workclock/types'
import { getMonthlyTotal, formatDuration } from '@/lib/workclock/time-utils'
import { Calendar, Clock, TrendingUp, DollarSign, ToggleRight } from 'lucide-react'
import { getWagePatternLabels } from '@/lib/workclock/wage-patterns'

interface WorkerSummaryProps {
  worker: Worker
  monthlyEntries: TimeEntry[]
  todayEntries: TimeEntry[]
  selectedMonth: Date
}

export function WorkerSummary({
  worker,
  monthlyEntries,
  todayEntries,
  selectedMonth,
}: WorkerSummaryProps) {
  const monthlyTotal = getMonthlyTotal(monthlyEntries)
  const todayTotal = getMonthlyTotal(todayEntries)
  const monthlyAmount = (monthlyTotal.hours + monthlyTotal.minutes / 60) * worker.hourlyRate

  const monthName = selectedMonth.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const wageLabels = getWagePatternLabels((worker as any).employeeId || worker.id)

  // 月額固定が将来的にDBに追加される前提のUI。現時点ではworkClockWorkerにカラムがないため、
  // Worker型には含まれていませんが、拡張プロパティとして存在する場合のみ表示を変える想定です。
  const monthlyFixedAmount =
    (worker as any).monthlyFixedAmount && Number((worker as any).monthlyFixedAmount) > 0
      ? Number((worker as any).monthlyFixedAmount)
      : null

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{worker.name}</h1>
        {worker.team && <p className="text-muted-foreground">{worker.team}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">報酬設定</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {wageLabels.A}
                </span>
                <span className="text-2xl font-bold">
                  ¥{worker.hourlyRate.toLocaleString()}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  デフォルト
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                現在の勤務時間集計・PDF出力はAパターンの金額をベースに計算されています。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm font-medium">今月の勤務時間</CardTitle>
              {monthlyFixedAmount && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5">
                    <ToggleRight className="h-3 w-3 text-primary" />
                    月額固定 ON
                  </span>
                  <span>¥{monthlyFixedAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(monthlyTotal.hours, monthlyTotal.minutes)}
            </div>
            <p className="text-xs text-muted-foreground">{monthName}</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の勤務時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(todayTotal.hours, todayTotal.minutes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('ja-JP')}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の報酬見込</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{Math.floor(monthlyAmount).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthlyEntries.length}日勤務</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
