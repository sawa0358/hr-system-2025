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
import { Worker, TimeEntry, Reward } from '@/lib/workclock/types'
import { getMonthlyTotal, formatDuration } from '@/lib/workclock/time-utils'
import { calculateWorkerMonthlyCost } from '@/lib/workclock/cost-calculation'
import { ExternalLink, FileText, ChevronDown, ChevronRight, FolderDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface WorkerTableProps {
  workers: Worker[]
  allEntries: TimeEntry[]
  allRewards: Reward[]
  onExportPDF: (workerId: string) => void
  onExportAllPDF: (workerIds: string[]) => void
  onSaveAllPDF?: (workerIds: string[]) => void // フォルダに保存
  currentUserWorker?: Worker | null // リーダー判定用に追加
  selectedMonth: Date // 表示年月
  onMonthChange: (date: Date) => void // 年月変更ハンドラー
  canSavePDF?: boolean // [hr][admin]のみtrue
}

export function WorkerTable({ workers, allEntries, allRewards, onExportPDF, onExportAllPDF, onSaveAllPDF, currentUserWorker, selectedMonth, onMonthChange, canSavePDF }: WorkerTableProps) {
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [isTeamSummaryOpen, setIsTeamSummaryOpen] = useState<boolean>(true)
  
  // リーダー（role='admin'）も含めて表示
  const activeWorkers = workers
  
  // リーダーの場合は自分の所属チームのみ表示、それ以外（HR/admin等）は全チーム表示
  const isLeader = currentUserWorker?.role === 'admin'
  const leaderTeams = isLeader && currentUserWorker ? (currentUserWorker.teams || []) : []
  
  const teams = Array.from(
    new Set(
      isLeader && leaderTeams.length > 0
        ? activeWorkers.flatMap((w) => (w.teams || []).filter(t => leaderTeams.includes(t)))
        : activeWorkers.flatMap((w) => w.teams || [])
    )
  ) as string[]

  const filteredWorkers =
    filterTeam === 'all'
      ? activeWorkers
      : activeWorkers.filter((w) => (w.teams || []).includes(filterTeam))

  const workerStats = filteredWorkers.map((worker) => {
    const workerEntries = allEntries.filter((e) => e.workerId === worker.id)
    const workerRewards = allRewards.filter((r) => r.workerId === worker.id)
    const total = getMonthlyTotal(workerEntries)
    const totalAmount = calculateWorkerMonthlyCost(worker, workerEntries, workerRewards)

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
    const teamWorkers = activeWorkers.filter((w) => (w.teams || []).includes(team))
    const teamEntries = allEntries.filter((e) => 
      teamWorkers.some((w) => w.id === e.workerId)
    )
    const total = getMonthlyTotal(teamEntries)
    
    const teamCost = teamWorkers.reduce((sum, worker) => {
      const workerEntries = teamEntries.filter((e) => e.workerId === worker.id)
      const workerRewards = allRewards.filter((r) => r.workerId === worker.id)
      return sum + calculateWorkerMonthlyCost(worker, workerEntries, workerRewards)
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
      {/* Team Summary - Collapsible */}
      <Collapsible open={isTeamSummaryOpen} onOpenChange={setIsTeamSummaryOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
            {isTeamSummaryOpen ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            <h2 className="text-xl font-bold">チーム別サマリー</h2>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          {teams.length > 0 ? (
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
          ) : (
            <div className="text-sm text-muted-foreground">
              チームが登録されていないため、サマリーは表示されません。
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Worker Details Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>個人別詳細</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ids = workerStats.map((worker) => worker.id)
                  onExportAllPDF(ids)
                }}
                disabled={workerStats.length === 0}
              >
                <FileText className="mr-1 h-3 w-3" />
                表示中全員をPDF出力
              </Button>
              {canSavePDF && onSaveAllPDF && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const ids = workerStats.map((worker) => worker.id)
                    onSaveAllPDF(ids)
                  }}
                  disabled={workerStats.length === 0}
                >
                  <FolderDown className="mr-1 h-3 w-3" />
                  フォルダに保存
                </Button>
              )}
            </div>
          </div>
          {/* チームフィルター */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700">チーム:</span>
              <Select
                value={filterTeam}
                onValueChange={setFilterTeam}
                disabled={teams.length === 0}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue
                    placeholder={teams.length === 0 ? 'チームは未登録です' : 'チームで絞り込み'}
                  />
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
          </div>
          {/* 年月フィルター */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700">表示年月:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  className="w-24 h-8"
                  value={selectedMonth.getFullYear()}
                  onChange={(e) => {
                    const year = Number(e.target.value) || selectedMonth.getFullYear()
                    const next = new Date(year, selectedMonth.getMonth(), 1)
                    onMonthChange(next)
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
                  value={selectedMonth.getMonth() + 1}
                  onChange={(e) => {
                    let month = Number(e.target.value) || selectedMonth.getMonth() + 1
                    if (month < 1) month = 1
                    if (month > 12) month = 12
                    const next = new Date(selectedMonth.getFullYear(), month - 1, 1)
                    onMonthChange(next)
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
                  onMonthChange(next)
                }}
              >
                今月へ
              </Button>
            </div>
          </div>
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
                    {worker.teams && worker.teams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {worker.teams.map((team) => (
                          <Badge key={team} variant="secondary">
                            {team}
                          </Badge>
                        ))}
                      </div>
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
                      <Button variant="ghost" size="sm" onClick={() => onExportPDF(worker.id)}>
                        <FileText className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                      <Link href={`/workclock/worker/${worker.id}`}>
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
