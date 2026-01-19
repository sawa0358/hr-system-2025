"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Settings,
  Users,
  Download,
  Plus,
  Bot,
  History as HistoryIcon,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react"
import { DateRange } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, subMonths, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Label } from "@/components/ui/label"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"



export default function EvaluationsPage() {
  const { currentUser } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterEmployment, setFilterEmployment] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [sortOrder, setSortOrder] = useState('registration-newest')

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Period Mode States
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date()
  })
  const [aiReports, setAiReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSummary, setEditingSummary] = useState('')

  const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  useEffect(() => {
    if (selectedReport) {
      setEditingSummary(selectedReport.summary)
      setIsEditing(false)
    }
  }, [selectedReport])

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('このレポートを削除してもよろしいですか？')) return

    try {
      const res = await fetch(`/api/evaluations/ai-report?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-employee-id': currentUser?.id || '' }
      })
      if (res.ok) {
        setAiReports(prev => prev.filter(r => r.id !== id))
        if (selectedReport?.id === id) {
          setIsReportModalOpen(false)
          setSelectedReport(null)
        }
      } else {
        alert('削除に失敗しました')
      }
    } catch (e) {
      console.error(e)
      alert('エラーが発生しました')
    }
  }

  const handleUpdateReport = async () => {
    try {
      const res = await fetch('/api/evaluations/ai-report', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          id: selectedReport.id,
          summary: editingSummary
        })
      })
      if (res.ok) {
        const updated = await res.json()
        setAiReports(prev => prev.map(r => r.id === updated.id ? updated : r))
        setSelectedReport(updated)
        setIsEditing(false)
        alert('レポートを更新しました')
      } else {
        alert('更新に失敗しました')
      }
    } catch (e) {
      console.error(e)
      alert('エラーが発生しました')
    }
  }

  useEffect(() => {
    if (viewMode === 'daily') {
      setLoading(true)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      fetch(`/api/evaluations/dashboard?date=${dateStr}`)
        .then(res => res.json())
        .then(d => {
          setData(d)
          setLoading(false)
        })
        .catch(e => {
          console.error(e)
          setLoading(false)
        })
    } else {
      // Period Mode Fetches AI Reports
      if (dateRange?.from && dateRange?.to) {
        setLoadingReports(true)
        const start = format(dateRange.from, 'yyyy-MM-dd')
        const end = format(dateRange.to, 'yyyy-MM-dd')
        fetch(`/api/evaluations/ai-report?startDate=${start}&endDate=${end}`)
          .then(res => res.json())
          .then(d => {
            setAiReports(d.reports || [])
            setLoadingReports(false)
          })
          .catch(e => {
            console.error(e)
            setLoadingReports(false)
          })
      }
    }
  }, [currentDate, viewMode, dateRange])

  const f = (n: any) => Number(n || 0).toLocaleString()

  // Default Stats if data not loaded
  const stats = data?.stats || {
    currentMonth: {
      contract: { target: 0, achieved: 0, rate: '0.0' },
      completion: { target: 0, achieved: 0, rate: '0.0' }
    },
    twoMonthsAgo: { completion: { target: 0, achieved: 0, rate: '0.0' } },
    fiscalYear: { completion: { target: 0, achieved: 0, rate: '0.0' } }
  }

  const tableData = data?.table || []
  const calendarStats = data?.calendar || {}

  // Filter Table Data
  const filteredTable = tableData.filter((item: any) => {
    if (filterTeam !== 'all') {
      // 簡易フィルタ: チーム名にAが含まれるか... 正確にはID管理すべきだが、APIが返すのは teamName
      if (!item.team.includes(filterTeam)) return false
    }
    // Employment/Role info not in API tableData yet. Mocking filter behavior or ignoring relevant filters.
    // Ideally API should return these fields. For now ignoring employment/role filters on client side check.
    return true
  })

  // Sort Table Data
  const sortedTable = [...filteredTable].sort((a: any, b: any) => {
    if (sortOrder === 'registration-newest') {
      // statusDate is 'MM/DD' or '-', hard to sort. relying on original order or ignore?
      // Let's assume original order is mostly correct.
      return 0
    }
    if (sortOrder === 'points-desc') {
      const pA = parseInt(a.fyPt.replace(/,/g, '').replace('pt', ''))
      const pB = parseInt(b.fyPt.replace(/,/g, '').replace('pt', ''))
      return pB - pA
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">人事考課システム</h1>
            <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                className={cn("text-xs px-4", viewMode === 'daily' ? "bg-blue-600 shadow-sm" : "")}
                onClick={() => setViewMode('daily')}
              >
                日次
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                className={cn("text-xs px-4", viewMode === 'monthly' ? "bg-blue-600 shadow-sm" : "")}
                onClick={() => setViewMode('monthly')}
              >
                期間
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-9 justify-start text-left font-normal border-slate-200", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                  {viewMode === 'daily' ? (
                    format(currentDate, "yyyy/MM/dd", { locale: ja })
                  ) : (
                    dateRange?.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}</>
                      ) : (
                        format(dateRange.from, "yyyy/MM/dd")
                      )
                    ) : (
                      <span>期間を選択</span>
                    )
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {viewMode === 'daily' ? (
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                    locale={ja}
                  />
                ) : (
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ja}
                  />
                )}
              </PopoverContent>
            </Popover>

            <Select defaultValue="standard">
              <SelectTrigger className="w-[180px] h-9 border-slate-200">
                <SelectValue placeholder="目標パターン" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">標準的な目標</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700 h-9 p-1 w-9 rounded-full">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={loadingReports}
              onClick={async () => {
                if (viewMode !== 'monthly') {
                  alert('AIレポート生成は「期間」ビューでのみ利用可能です。')
                  return
                }
                if (!dateRange?.from || !dateRange?.to) {
                  alert('期間を選択してください。')
                  return
                }
                setLoadingReports(true)
                try {
                  const res = await fetch('/api/evaluations/ai-report', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-employee-id': currentUser?.id || ''
                    },
                    body: JSON.stringify({
                      startDate: dateRange.from,
                      endDate: dateRange.to
                    })
                  })
                  const json = await res.json()
                  alert(json.message || 'AI Report Generated')

                  // Refresh reports
                  const start = format(dateRange.from, 'yyyy-MM-dd')
                  const end = format(dateRange.to, 'yyyy-MM-dd')
                  const rRes = await fetch(`/api/evaluations/ai-report?startDate=${start}&endDate=${end}`)
                  const rJson = await rRes.json()
                  setAiReports(rJson.reports || [])
                } catch (e) {
                  console.error(e)
                  alert('Error generating report')
                } finally {
                  setLoadingReports(false)
                }
              }}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white gap-2 font-bold h-9">
              {loadingReports ? <Bot className="w-4 h-4 animate-bounce" /> : <Sparkles className="w-4 h-4" />}
              AIレポートを生成
            </Button>
            <Button variant="outline" className="gap-2 h-9 border-slate-200">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>AIに聞く</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Filters Block */}
        <div className="bg-[#f1f5f9] rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold ml-1">チーム</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="bg-white border-0 h-9">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="A">営業Aチーム</SelectItem>
                  <SelectItem value="B">営業Bチーム</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold ml-1">雇用形態</Label>
              <Select value={filterEmployment} onValueChange={setFilterEmployment}>
                <SelectTrigger className="bg-white border-0 h-9">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="full">正社員</SelectItem>
                  <SelectItem value="part">パート</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold ml-1">職種</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="bg-white border-0 h-9">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-500 font-bold ml-1">並び順</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="bg-white border-0 h-9">
                  <SelectValue placeholder="登録日時 (新しい順)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration-newest">登録日時 (新しい順)</SelectItem>
                  <SelectItem value="registration-oldest">登録日時 (古い順)</SelectItem>
                  <SelectItem value="name-asc">社員名 (五十音順)</SelectItem>
                  <SelectItem value="points-desc">獲得pt (多い順)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border rounded-lg overflow-hidden shadow-sm bg-white">
          {/* Card 1: Current Month Contract */}
          <div className="flex flex-col border-r last:border-0 border-slate-100">
            <div className="bg-[#0f172a] text-white text-center py-2 text-sm font-bold">
              {data?.periodLabel || format(currentDate, 'yyyy年M月')}
            </div>
            <div className="grid grid-cols-3 bg-[#1e293b] text-white text-[10px] py-1 px-2 border-b border-slate-700">
              <div className="text-center font-bold">契約達成額</div>
              <div className="text-center font-bold">契約目標額</div>
              <div className="text-center font-bold">達成率</div>
            </div>
            <div className="grid grid-cols-3 p-3 gap-2">
              <div className="text-center font-bold text-lg">¥{f(stats.currentMonth.contract.achieved)}</div>
              <div className="text-center font-bold text-lg">¥{f(stats.currentMonth.contract.target)}</div>
              <div className="text-center font-bold text-lg">{stats.currentMonth.contract.rate}%</div>
            </div>
          </div>
          {/* Card 2: Two Months Ago Completion */}
          <div className="flex flex-col border-r last:border-0 border-slate-100">
            <div className="bg-[#0f172a] text-white text-center py-2 text-sm font-bold flex justify-center items-center gap-2">
              {format(subMonths(currentDate, 2), 'yyyy年M月')}
              <Badge className="bg-slate-700 text-[10px] hover:bg-slate-700 border-0 h-5">確定: 2ヶ月前</Badge>
            </div>
            <div className="grid grid-cols-3 bg-[#1e293b] text-white text-[10px] py-1 px-2 border-b border-slate-700">
              <div className="text-center font-bold">完工達成額</div>
              <div className="text-center font-bold">完工目標額</div>
              <div className="text-center font-bold">達成率</div>
            </div>
            <div className="grid grid-cols-3 p-3 gap-2">
              <div className="text-center font-bold text-lg">¥{f(stats.twoMonthsAgo.completion.achieved)}</div>
              <div className="text-center font-bold text-lg">¥{f(stats.twoMonthsAgo.completion.target)}</div>
              <div className="text-center font-bold text-lg">{stats.twoMonthsAgo.completion.rate}%</div>
            </div>
          </div>
          {/* Card 3: Fiscal Year Completion */}
          <div className="flex flex-col">
            <div className="bg-[#0f172a] text-white text-center py-2 text-sm font-bold flex justify-center items-center gap-2">
              {data?.fiscalYearLabel || '今年度'}
              <Badge className="bg-slate-700 text-[10px] hover:bg-slate-700 border-0 h-5">完工累計</Badge>
            </div>
            <div className="grid grid-cols-3 bg-[#1e293b] text-white text-[10px] py-1 px-2 border-b border-slate-700">
              <div className="text-center font-bold">完工達成額</div>
              <div className="text-center font-bold">完工目標額</div>
              <div className="text-center font-bold">達成率</div>
            </div>
            <div className="grid grid-cols-3 p-3 gap-2">
              <div className="text-center font-bold text-lg">¥{f(stats.fiscalYear.completion.achieved)}</div>
              <div className="text-center font-bold text-lg">¥{f(stats.fiscalYear.completion.target)}</div>
              <div className="text-center font-bold text-lg">{stats.fiscalYear.completion.rate}%</div>
            </div>
          </div>
        </div>

        {/* Settings Buttons for Admins */}
        {isAdminOrHr && (
          <div className="flex justify-end gap-2">
            <Link href="/evaluations/settings/fiscal-year">
              <Button variant="outline" size="sm" className="gap-2 bg-white shadow-sm">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                年度設定
              </Button>
            </Link>
            <Link href="/evaluations/settings/employees">
              <Button variant="outline" size="sm" className="gap-2 bg-white shadow-sm">
                <Users className="w-4 h-4 text-blue-600" />
                個別設定
              </Button>
            </Link>
            <Link href="/evaluations/settings/patterns">
              <Button variant="outline" size="sm" className="gap-2 bg-white shadow-sm">
                <Settings className="w-4 h-4 text-slate-600" />
                チェック設定
              </Button>
            </Link>
          </div>
        )}

        {/* Main Content Area */}
        {viewMode === 'daily' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
            {/* Left Sidebar: Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-4 sticky top-4">
              <div className="flex flex-col gap-3">
                <div className="text-slate-500 text-xs font-bold pl-1">
                  表示年月:
                </div>
                <div className="flex items-center gap-1">
                  <Select value={format(currentDate, 'yyyy')} onValueChange={(v) => {
                    const newDate = new Date(currentDate)
                    newDate.setFullYear(parseInt(v))
                    setCurrentDate(newDate)
                  }}>
                    <SelectTrigger className="w-[70px] h-8 text-xs border-slate-200 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-slate-500 font-bold whitespace-nowrap">年</span>
                  <Select value={format(currentDate, 'M')} onValueChange={(v) => {
                    const newDate = new Date(currentDate)
                    newDate.setMonth(parseInt(v) - 1)
                    setCurrentDate(newDate)
                  }}>
                    <SelectTrigger className="w-[50px] h-8 text-xs border-slate-200 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-slate-500 font-bold whitespace-nowrap">月</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-8 px-0" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => setCurrentDate(new Date())}>
                    今月
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-8 px-0" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-400px)]">
                <table className="w-full text-xs text-left border-collapse sticky top-0 z-10">
                  <thead className="bg-[#1e293b] text-white">
                    <tr>
                      <th className="px-2 py-2 border-r border-slate-700 w-14 text-center whitespace-nowrap">{format(currentDate, 'M月')}</th>
                      <th className="px-2 py-2 text-center whitespace-nowrap">登録数</th>
                    </tr>
                  </thead>
                </table>
                <div className="overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      {(() => {
                        const year = currentDate.getFullYear()
                        const month = currentDate.getMonth()
                        const daysInMonth = new Date(year, month + 1, 0).getDate()
                        const today = new Date()
                        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

                        return [...Array(daysInMonth)].map((_, i) => {
                          const day = i + 1
                          const date = new Date(year, month, day)
                          const dateStr = format(date, 'yyyy-MM-dd')
                          const dayOfWeek = date.getDay() // 0:Sun, 1:Mon...
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                          const isSelected = dateStr === format(currentDate, 'yyyy-MM-dd')
                          const count = calendarStats[dateStr] || 0

                          // Show only up to today if current month
                          if (isCurrentMonth && day > today.getDate()) return null;

                          return (
                            <tr
                              key={day}
                              onClick={() => setCurrentDate(date)}
                              className={cn(
                                "cursor-pointer transition-colors",
                                isSelected ? "bg-blue-600 text-white hover:bg-blue-600" : "hover:bg-slate-50"
                              )}
                            >
                              <td className={cn(
                                "px-2 py-2.5 text-center font-bold border-r w-14 whitespace-nowrap",
                                !isSelected && isWeekend ? "bg-slate-50 text-slate-500" : ""
                              )}>
                                {day}({['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]})
                              </td>
                              <td className="px-2 py-2.5 text-right">
                                {count > 0 && (
                                  <Badge variant="secondary" className={cn(
                                    "bg-slate-200 text-slate-600 font-bold h-5 min-w-[20px] px-1 justify-center rounded-full",
                                    isSelected ? "bg-white text-blue-600" : ""
                                  )}>
                                    {count}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          )
                        }).filter(Boolean)
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-[#f8fafc] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-800">社員別 報告一覧</h2>
                  <Badge className="bg-blue-600 hover:bg-blue-600 h-6 px-3">
                    {format(currentDate, 'yyyy年M月d日')}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500 font-bold">該当件数: {sortedTable.length}件</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f1f5f9] text-slate-600 font-bold border-b">
                    <tr>
                      <th className="px-4 py-4">社員名/チーム</th>
                      <th className="px-4 py-4">登録状況</th>
                      <th className="px-4 py-4">当日獲得pt</th>
                      <th className="px-4 py-4">コメント類</th>
                      <th className="px-4 py-4 text-right">今月獲得pt</th>
                      <th className="px-4 py-4 text-right">今年度獲得pt</th>
                      <th className="px-4 py-4 text-center">詳細</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTable.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{item.team}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={cn("font-bold", item.status === '登録済' ? "text-slate-800" : "text-slate-400")}>{item.status}</div>
                          <div className="text-[10px] text-slate-400">{item.statusDate}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-bold text-slate-700">{item.dailyPt}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1 max-w-[250px]">
                            {item.comments.map((c: string, i: number) => (
                              <div key={i} className="text-slate-600 line-clamp-1 leading-relaxed">
                                {c}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-300 w-[60%]"></div>
                            </div>
                            <div className="text-sm font-bold text-slate-700">{item.monthlyPt}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="text-sm font-bold text-slate-700">{item.fyPt}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link href={`/evaluations/entry/${item.id}/${format(currentDate, 'yyyy-MM-dd')}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50">
                              <Search className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex-1"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-sm border-none bg-white/80 overflow-hidden">
              <CardHeader className="pb-4 bg-white/50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-indigo-600" /> AI総括レポート履歴
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {loadingReports ? (
                    <div className="py-16 text-center text-slate-400">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-indigo-600">レポートを取得中...</p>
                    </div>
                  ) : aiReports.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">選択された期間にAIレポートはありません</p>
                    </div>
                  ) : aiReports.map((report, idx) => (
                    <div
                      key={report.id || idx}
                      className="px-4 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center gap-3"
                      onClick={() => {
                        setSelectedReport(report)
                        setIsReportModalOpen(true)
                      }}
                    >
                      <div className="w-32 flex-shrink-0">
                        <span className="text-xs font-bold text-slate-700">
                          {format(new Date(report.createdAt), 'MM/dd (E) HH:mm', { locale: ja })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">
                          {report.summary.replace(/\n/g, ' ').substring(0, 100)}...
                        </p>
                      </div>
                      <div className="w-32 flex-shrink-0 text-right flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-indigo-600">{report.totalPoints?.toLocaleString() || 0} pt</span>
                        {isAdminOrHr && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => handleDeleteReport(report.id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Detail Modal */}
            <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
              <DialogContent className="max-w-2xl bg-slate-50 border-none shadow-xl">
                <DialogHeader className="bg-white p-6 border-b rounded-t-lg">
                  <DialogTitle className="flex items-center gap-2 text-slate-800">
                    <HistoryIcon className="w-5 h-5 text-indigo-600" />
                    AI分析レポート詳細
                  </DialogTitle>
                </DialogHeader>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {selectedReport ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>期間: {format(new Date(selectedReport.startDate), 'yyyy/MM/dd')} - {format(new Date(selectedReport.endDate), 'yyyy/MM/dd')}</span>
                        <span>作成日: {format(new Date(selectedReport.createdAt), 'yyyy/MM/dd HH:mm')}</span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full h-64 p-4 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm leading-relaxed resize-none transition-all"
                            value={editingSummary}
                            onChange={(e) => setEditingSummary(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                          {selectedReport.summary}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 bg-white border-slate-100 shadow-sm">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">対象人数</div>
                          <div className="text-xl font-bold text-slate-700">{selectedReport.employeeCount}名</div>
                        </Card>
                        <Card className="p-4 bg-white border-slate-100 shadow-sm">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">合計ポイント</div>
                          <div className="text-xl font-bold text-indigo-600">{(selectedReport.totalPoints || 0).toLocaleString()} pt</div>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-slate-400">データ読み込みエラー</p>
                  )}
                </div>
                <DialogFooter className="p-4 bg-white border-t rounded-b-lg flex justify-between items-center">
                  {isAdminOrHr && selectedReport && (
                    <div className="flex gap-2 mr-auto">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={handleUpdateReport} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                            <Save className="w-4 h-4" /> 保存
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="gap-2">
                            <X className="w-4 h-4" /> キャンセル
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2 border-slate-200">
                          <Edit className="w-4 h-4 text-slate-600" /> 編集
                        </Button>
                      )}
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>閉じる</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

      </div>
    </div >
  )
}
