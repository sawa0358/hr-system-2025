'use client'

import { useState, useEffect } from 'react'
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
import { ExternalLink, FileText, X, ChevronDown, ChevronUp } from 'lucide-react'
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

const FILTER_STORAGE_KEY = 'workclock_worker_filters'

interface WorkerFilters {
  team: string
  employeeType: string
  role: string
  sortBy: string
}

export function WorkerTable({ workers, allEntries, onExportPDF }: WorkerTableProps) {
  // チーム別サマリーの開閉状態（デフォルトは閉じた状態）
  const [isTeamSummaryOpen, setIsTeamSummaryOpen] = useState(false)
  
  // フィルター状態をlocalStorageから復元
  const [filterTeam, setFilterTeam] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        const filters: WorkerFilters = JSON.parse(saved)
        return filters.team || 'all'
      }
    }
    return 'all'
  })
  
  const [filterEmployeeType, setFilterEmployeeType] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        const filters: WorkerFilters = JSON.parse(saved)
        return filters.employeeType || 'all'
      }
    }
    return 'all'
  })
  
  const [filterRole, setFilterRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        const filters: WorkerFilters = JSON.parse(saved)
        return filters.role || 'all'
      }
    }
    return 'all'
  })
  
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        const filters: WorkerFilters = JSON.parse(saved)
        return filters.sortBy || 'registrationDesc'
      }
    }
    return 'registrationDesc'
  })

  // フィルター変更時にlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const filters: WorkerFilters = {
        team: filterTeam,
        employeeType: filterEmployeeType,
        role: filterRole,
        sortBy: sortBy
      }
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters))
    }
  }, [filterTeam, filterEmployeeType, filterRole, sortBy])

  // フィルターをクリア
  const handleClearFilters = () => {
    setFilterTeam('all')
    setFilterEmployeeType('all')
    setFilterRole('all')
    setSortBy('registrationDesc')
  }
  
  const activeWorkers = workers.filter((w) => w.role === 'worker')
  const teams = Array.from(
    new Set(
      activeWorkers.flatMap((w: any) => w.teams || [])
    )
  ) as string[]

  // 雇用形態の一覧を取得
  const employeeTypes = Array.from(
    new Set(
      activeWorkers.map((w: any) => w.employeeType).filter(Boolean)
    )
  ) as string[]

  let filteredWorkers = activeWorkers

  // チームフィルター
  if (filterTeam !== 'all') {
    filteredWorkers = filteredWorkers.filter((w: any) => 
      (w.teams || []).includes(filterTeam)
    )
  }

  // 雇用形態フィルター
  if (filterEmployeeType !== 'all') {
    filteredWorkers = filteredWorkers.filter((w: any) => 
      w.employeeType === filterEmployeeType
    )
  }

  // 権限フィルター
  if (filterRole !== 'all') {
    filteredWorkers = filteredWorkers.filter((w: any) => 
      w.role === filterRole
    )
  }

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

  // ソート適用
  const sortedWorkerStats = [...workerStats].sort((a, b) => {
    switch (sortBy) {
      case 'registrationDesc':
        // 登録日時（新しい順） - IDが新しいほど後から登録されたと仮定
        return b.id.localeCompare(a.id)
      case 'registrationAsc':
        // 登録日時（古い順）
        return a.id.localeCompare(b.id)
      case 'nameAsc':
        // 名前（あいうえお順）
        return a.name.localeCompare(b.name, 'ja')
      case 'nameDesc':
        // 名前（逆順）
        return b.name.localeCompare(a.name, 'ja')
      case 'hoursDesc':
        // 勤務時間（多い順）
        const totalMinutesA = a.totalHours * 60 + a.totalMinutes
        const totalMinutesB = b.totalHours * 60 + b.totalMinutes
        return totalMinutesB - totalMinutesA
      case 'hoursAsc':
        // 勤務時間（少ない順）
        const totalMinA = a.totalHours * 60 + a.totalMinutes
        const totalMinB = b.totalHours * 60 + b.totalMinutes
        return totalMinA - totalMinB
      default:
        return 0
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
      {/* Worker Selection Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ワーカー選択</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              クリア
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* チームフィルター */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">チーム</label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="チームで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 雇用形態フィルター */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">雇用形態</label>
              <Select value={filterEmployeeType} onValueChange={setFilterEmployeeType}>
                <SelectTrigger>
                  <SelectValue placeholder="雇用形態で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {employeeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 権限フィルター */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">権限</label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="権限で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="worker">ワーカー</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 並び順 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">並び順</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="並び順を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registrationDesc">登録日時（新しい順）</SelectItem>
                  <SelectItem value="registrationAsc">登録日時（古い順）</SelectItem>
                  <SelectItem value="nameAsc">名前（あいうえお順）</SelectItem>
                  <SelectItem value="nameDesc">名前（逆順）</SelectItem>
                  <SelectItem value="hoursDesc">勤務時間（多い順）</SelectItem>
                  <SelectItem value="hoursAsc">勤務時間（少ない順）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Summary Cards */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>チーム別サマリー</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsTeamSummaryOpen(!isTeamSummaryOpen)}
                className="gap-2"
              >
                {isTeamSummaryOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    開く
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {isTeamSummaryOpen && (
            <CardContent>
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
            </CardContent>
          )}
        </Card>
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
              {sortedWorkerStats.map((worker) => (
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

          {sortedWorkerStats.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              {filteredWorkers.length === 0 ? '条件に一致するワーカーがいません' : '勤務記録がありません'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
