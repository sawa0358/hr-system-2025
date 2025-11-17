'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Worker, TimeEntry } from '@/lib/types'
import { getMonthlyTotal, formatDuration } from '@/lib/time-utils'
import { ExternalLink, FileText } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface WorkerTableProps {
  workers: Worker[]
  allEntries: TimeEntry[]
  onExportPDF: (workerId: string) => void
}

// PDFと同じロジックで、ワーカー単位の月間コストを算出
function calculateWorkerMonthlyCost(worker: Worker, entries: TimeEntry[]): number {
  const w: any = worker
  if (!entries || entries.length === 0) return typeof w.monthlyFixedAmount === 'number' ? w.monthlyFixedAmount || 0 : 0

  const entriesByPattern = entries.reduce((acc, entry: any) => {
    const pattern = entry.wagePattern || 'A'
    if (!acc[pattern]) acc[pattern] = []
    acc[pattern].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  const patternTotals: Record<'A' | 'B' | 'C', { hours: number; minutes: number; amount: number }> = {
    A: { hours: 0, minutes: 0, amount: 0 },
    B: { hours: 0, minutes: 0, amount: 0 },
    C: { hours: 0, minutes: 0, amount: 0 },
  }

  Object.entries(entriesByPattern).forEach(([pattern, patternEntries]) => {
    const total = getMonthlyTotal(patternEntries as TimeEntry[])
    const hours = total.hours + total.minutes / 60
    const rate =
      pattern === 'A'
        ? w.hourlyRate
        : pattern === 'B'
        ? w.hourlyRateB || w.hourlyRate
        : w.hourlyRateC || w.hourlyRate

    patternTotals[pattern as 'A' | 'B' | 'C'] = {
      hours: total.hours,
      minutes: total.minutes,
      amount: hours * rate,
    }
  })

  const monthlyFixedAmount =
    typeof w.monthlyFixedAmount === 'number' && w.monthlyFixedAmount > 0 ? w.monthlyFixedAmount : 0

  return patternTotals.A.amount + patternTotals.B.amount + patternTotals.C.amount + monthlyFixedAmount
}

export function WorkerTable({ workers, allEntries, onExportPDF }: WorkerTableProps) {
  const [filterTeam, setFilterTeam] = useState<string>('all')
  
  const activeWorkers = workers.filter((w) => w.role === 'worker')
  const teams = Array.from(
    new Set(
      activeWorkers.flatMap((w: any) => w.teams || [])
    )
  ) as string[]

  const filteredWorkers = filterTeam === 'all' 
    ? activeWorkers 
    : activeWorkers.filter((w: any) => (w.teams || []).includes(filterTeam))

  const workerStats = filteredWorkers.map((worker) => {
    const workerEntries = allEntries.filter((e) => e.workerId === worker.id)
    const total = getMonthlyTotal(workerEntries)
    const totalAmount = calculateWorkerMonthlyCost(worker, workerEntries)

    return {
      ...worker,
      totalHours: total.hours,
      totalMinutes: total.minutes,
      totalAmount,
      entryCount: workerEntries.length,
    }
  })

  // Calculate team totals
  const teamTotals = teams.map((team) => {
    const teamWorkers = activeWorkers.filter((w: any) => (w.teams || []).includes(team))
    const teamEntries = allEntries.filter((e) => 
      teamWorkers.some((w) => w.id === e.workerId)
    )
    const total = getMonthlyTotal(teamEntries)
    
    const teamCost = teamWorkers.reduce((sum, worker) => {
      const workerEntries = teamEntries.filter((e) => e.workerId === worker.id)
      return sum + calculateWorkerMonthlyCost(worker, workerEntries)
    }, 0)

    return {
      team,
      totalHours: total.hours,
      totalMinutes: total.minutes,
      totalCost: teamCost,
      workerCount: teamWorkers.length,
    }
  })

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      {teams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">チーム別サマリー</h2>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="チームで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのチーム</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {teamTotals.map((teamTotal) => (
              <Card key={teamTotal.team}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{teamTotal.team}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">メンバー</span>
                    <span className="font-medium">{teamTotal.workerCount}人</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">合計時間</span>
                    <span className="font-medium">
                      {formatDuration(teamTotal.totalHours, teamTotal.totalMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">合計コスト</span>
                    <span className="font-semibold text-primary">
                      ¥{Math.floor(teamTotal.totalCost).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Worker Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>個人別詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ワーカー名</TableHead>
                <TableHead>チーム</TableHead>
                <TableHead className="text-right">時給</TableHead>
                <TableHead className="text-right">勤務日数</TableHead>
                <TableHead className="text-right">勤務時間</TableHead>
                <TableHead className="text-right">報酬見込</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workerStats.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>
                    {worker.team ? (
                      <Badge variant="secondary">{worker.team}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">未所属</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ¥{worker.hourlyRate.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{worker.entryCount}日</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatDuration(worker.totalHours, worker.totalMinutes)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ¥{Math.floor(worker.totalAmount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExportPDF(worker.id)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                      <Link href={`/worker/${worker.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          詳細
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {workerStats.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              勤務記録がありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
