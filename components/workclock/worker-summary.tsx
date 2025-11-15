'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Worker, TimeEntry } from '@/lib/workclock/types'
import { getMonthlyTotal, formatDuration } from '@/lib/workclock/time-utils'
import { Calendar, Clock, TrendingUp, DollarSign } from 'lucide-react'

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

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{worker.name}</h1>
        {worker.team && <p className="text-muted-foreground">{worker.team}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">時給</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{worker.hourlyRate.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">1時間あたり</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の勤務時間</CardTitle>
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
