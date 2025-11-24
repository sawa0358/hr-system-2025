'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import { getMonthlyTotal, formatDuration } from '@/lib/workclock/time-utils'
import { calculateWorkerMonthlyCost } from '@/lib/workclock/cost-calculation'
import { Calendar, Clock, TrendingUp, DollarSign, ToggleRight, Coins, Settings } from 'lucide-react'
import { getWagePatternLabels } from '@/lib/workclock/wage-patterns'

interface WorkerSummaryProps {
  worker: Worker
  monthlyEntries: TimeEntry[]
  todayEntries: TimeEntry[]
  selectedMonth: Date
  rewards?: Reward[]
  onRewardClick?: () => void
}

export function WorkerSummary({
  worker,
  monthlyEntries,
  todayEntries,
  selectedMonth,
  rewards = [],
  onRewardClick,
}: WorkerSummaryProps) {
  const monthlyTotal = getMonthlyTotal(monthlyEntries)
  const todayTotal = getMonthlyTotal(todayEntries)
  
  // 共通の計算関数を使用（時給パターン + 回数パターン + 月額固定 + 特別報酬・経費）
  const monthlyAmount = calculateWorkerMonthlyCost(worker, monthlyEntries, rewards)
  
  // 月額固定を取得（表示用）
  const monthlyFixedAmount =
    typeof worker.monthlyFixedAmount === 'number' && worker.monthlyFixedAmount > 0
      ? worker.monthlyFixedAmount
      : (worker as any).monthlyFixedAmount && Number((worker as any).monthlyFixedAmount) > 0
        ? Number((worker as any).monthlyFixedAmount)
        : null
  
  // 特別報酬を取得（表示用）
  const rewardAmount = rewards.reduce((acc, r) => acc + r.amount, 0)

  const monthName = selectedMonth.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const scopeKey = worker.employeeId || (worker as any).employeeId || worker.id
  const baseLabels = getWagePatternLabels(scopeKey)
  const wageLabels = {
    A: worker.wagePatternLabelA || baseLabels.A,
    B: worker.wagePatternLabelB || baseLabels.B,
    C: worker.wagePatternLabelC || baseLabels.C,
  }
  
  // 5つ目のカードは廃止し、4つに戻す
  const gridColsClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{worker.name}</h1>
        {worker.team && <p className="text-muted-foreground">{worker.team}</p>}
      </div>

      <div className={gridColsClass}>
        <Card className="w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">報酬設定</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {wageLabels.A}
                </span>
                <span className="text-xl font-bold whitespace-nowrap">
                  ¥{worker.hourlyRate.toLocaleString()}
                </span>
              </div>
              {worker.hourlyRateB && (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {wageLabels.B}
                  </span>
                  <span className="text-lg font-bold whitespace-nowrap">
                    ¥{worker.hourlyRateB.toLocaleString()}
                  </span>
                </div>
              )}
              {worker.hourlyRateC && (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {wageLabels.C}
                  </span>
                  <span className="text-lg font-bold whitespace-nowrap">
                    ¥{worker.hourlyRateC.toLocaleString()}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground break-words">
                勤務記録のパターン選択に応じて、それぞれの時給で計算されます。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">今月の勤務時間</CardTitle>
              {monthlyFixedAmount && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 whitespace-nowrap">
                    <ToggleRight className="h-3 w-3 text-primary" />
                    月額固定 ON
                  </span>
                  <span className="whitespace-nowrap">¥{monthlyFixedAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">
              {formatDuration(monthlyTotal.hours, monthlyTotal.minutes)}
            </div>
            <p className="text-xs text-muted-foreground truncate">{monthName}</p>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">本日の勤務時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">
              {formatDuration(todayTotal.hours, todayTotal.minutes)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {new Date().toLocaleDateString('ja-JP')}
            </p>
          </CardContent>
        </Card>

        {/* 報酬見込カードをクリック可能にする */}
        <Card 
          className={`w-full min-w-0 ${onRewardClick ? 'cursor-pointer hover:border-primary transition-colors relative group' : ''}`}
          onClick={onRewardClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                今月の報酬見込
                {onRewardClick && <Settings className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">¥{Math.floor(monthlyAmount).toLocaleString()}</div>
            <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground truncate">{monthlyEntries.length}日勤務</p>
                {monthlyFixedAmount && (
                    <p className="text-xs text-primary font-medium truncate">
                        + 月額固定 ¥{monthlyFixedAmount.toLocaleString()}
                    </p>
                )}
                {rewardAmount > 0 && (
                    <p className="text-xs text-primary font-medium truncate">
                        + 特別報酬・経費 ¥{rewardAmount.toLocaleString()}
                    </p>
                )}
            </div>
          </CardContent>
          {onRewardClick && (
             <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
          )}
        </Card>
      </div>
    </div>
  )
}
