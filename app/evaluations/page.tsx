"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Trophy,
  X,
  Heart,
  Medal
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Label } from "@/components/ui/label"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"



import { useRouter } from "next/navigation"

export default function EvaluationsPage() {
  const router = useRouter()
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

  // Prompt Management Dialog states
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
  const [prompts, setPrompts] = useState<any[]>([
    { id: '1', name: '標準的な目標', prompt: 'チーム全体の達成状況を分析し、具体的な改善提案を行ってください。', isDefault: true }
  ])
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptText, setNewPromptText] = useState('')

  // ありがとうモーダル用
  const [isThankyouModalOpen, setIsThankyouModalOpen] = useState(false)
  const [thankyouModalDate, setThankyouModalDate] = useState<string>('')
  const [thankyouList, setThankyouList] = useState<any[]>([])
  const [loadingThankyous, setLoadingThankyous] = useState(false)

  // ありがとうランキングモーダル用
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false)
  const [rankingData, setRankingData] = useState<any[]>([])
  const [rankingTeams, setRankingTeams] = useState<any[]>([])
  const [loadingRanking, setLoadingRanking] = useState(false)
  const [rankingPeriod, setRankingPeriod] = useState<DateRange | undefined>(undefined)
  const [rankingTeamFilter, setRankingTeamFilter] = useState('all')
  const [rankingFiscalYearLoaded, setRankingFiscalYearLoaded] = useState(false)

  const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  const isStoreManager = currentUser?.role === 'store_manager'

  // 年度設定からランキングのデフォルト期間を取得
  useEffect(() => {
    if (!rankingFiscalYearLoaded) {
      fetch('/api/evaluations/settings/fiscal-year')
        .then(res => res.json())
        .then(data => {
          if (data.fiscalYears && data.fiscalYears.length > 0) {
            // 現在の日付が含まれる年度を探す
            const now = new Date()
            const currentFy = data.fiscalYears.find((fy: any) => {
              const start = new Date(fy.startDate)
              const end = new Date(fy.endDate)
              return now >= start && now <= end
            })
            if (currentFy) {
              setRankingPeriod({
                from: new Date(currentFy.startDate),
                to: new Date(currentFy.endDate)
              })
            } else if (data.fiscalYears.length > 0) {
              // 現在の年度が見つからない場合は最新の年度を使用
              const latestFy = data.fiscalYears[0]
              setRankingPeriod({
                from: new Date(latestFy.startDate),
                to: new Date(latestFy.endDate)
              })
            }
          } else {
            // 年度設定がない場合はデフォルト（今年度の4月〜3月）
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const startYear = month >= 4 ? year : year - 1
            setRankingPeriod({
              from: new Date(startYear, 3, 1), // 4月1日
              to: new Date(startYear + 1, 2, 31) // 3月31日
            })
          }
          setRankingFiscalYearLoaded(true)
        })
        .catch(() => {
          // エラー時はデフォルトで1ヶ月前〜今日
          setRankingPeriod({
            from: subMonths(new Date(), 1),
            to: new Date()
          })
          setRankingFiscalYearLoaded(true)
        })
    }
  }, [rankingFiscalYearLoaded])

  useEffect(() => {
    if (currentUser) {
      const allowedRoles = ['admin', 'hr', 'manager', 'store_manager']
      if (!allowedRoles.includes(currentUser.role || '')) {
        // Redirect to today's entry page for self
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        router.replace(`/evaluations/entry/${currentUser.id}/${todayStr}`)
      }
    }
  }, [currentUser, router])

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
      // 店長の場合は自分のチームIDをパラメータに追加（API側でフィルタリング）
      const teamParam = isStoreManager && currentUser?.personnelEvaluationTeamId
        ? `&storeManagerTeamId=${currentUser.personnelEvaluationTeamId}`
        : ''
      fetch(`/api/evaluations/dashboard?date=${dateStr}${teamParam}`, {
        headers: {
          'x-employee-id': currentUser?.id || '',
          'x-employee-role': currentUser?.role || ''
        }
      })
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

  // ありがとうモーダルを開く
  const openThankyouModal = async (dateStr: string) => {
    console.log('[openThankyouModal] Opening modal for:', dateStr)
    setThankyouModalDate(dateStr)
    setIsThankyouModalOpen(true)
    setLoadingThankyous(true)
    try {
      const teamParam = isStoreManager && currentUser?.personnelEvaluationTeamId
        ? `&teamId=${currentUser.personnelEvaluationTeamId}`
        : ''
      const url = `/api/evaluations/thankyous?date=${dateStr}${teamParam}`
      console.log('[openThankyouModal] Fetching:', url)
      const res = await fetch(url)
      const data = await res.json()
      console.log('[openThankyouModal] Response:', data)
      setThankyouList(data.thankyous || [])
    } catch (e) {
      console.error('[openThankyouModal] Error:', e)
      setThankyouList([])
    } finally {
      setLoadingThankyous(false)
    }
  }

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
    // 自分を最上部に表示
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;

    if (sortOrder === 'points-desc') {
      const pA = parseFloat(a.fyPt.toString().replace(/,/g, '').replace('pt', ''))
      const pB = parseFloat(b.fyPt.toString().replace(/,/g, '').replace('pt', ''))
      return pB - pA
    }
    // デフォルト: 名前順や最新順など（ここでは元の順序を維持しつつ、ソート条件があれば適用）
    if (sortOrder === 'name-asc') {
      return (a.name || "").localeCompare(b.name || "", 'ja')
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header Area */}
        <Collapsible defaultOpen={false} className="space-y-4 group/header">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap shrink-0">人事考課システム</h1>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-500 hover:text-slate-800">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold">設定・フィルタ</span>
                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]/header:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-6 flex-1">
                <div className="flex items-center gap-3 flex-wrap mt-2 md:mt-0">
                  <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm shrink-0">
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

                  <Button
                    className="bg-blue-600 hover:bg-blue-700 h-9 p-1 w-9 rounded-full"
                    onClick={() => setIsPromptDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 lg:mt-0 flex-wrap lg:justify-end">
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
          </CollapsibleContent>
        </Collapsible>

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
              <div className="text-center font-bold text-lg">¥{f(stats.currentMonth.contract.achieved)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
              <div className="text-center font-bold text-lg">¥{f(stats.currentMonth.contract.target)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
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
              <div className="text-center font-bold text-lg">¥{f(stats.twoMonthsAgo.completion.achieved)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
              <div className="text-center font-bold text-lg">¥{f(stats.twoMonthsAgo.completion.target)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
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
              <div className="text-center font-bold text-lg">¥{f(stats.fiscalYear.completion.achieved)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
              <div className="text-center font-bold text-lg">¥{f(stats.fiscalYear.completion.target)}<span className="text-[10px] text-slate-500 ml-1">(千円)</span></div>
              <div className="text-center font-bold text-lg">{stats.fiscalYear.completion.rate}%</div>
            </div>
          </div>
        </div>

        {/* Settings Buttons for Admins */}
        {isAdminOrHr && (
          <div className="flex justify-end gap-2 flex-wrap">
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-4 lg:sticky lg:top-4 relative">
              {/* ありがとうランキングボタン */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 text-pink-700 hover:bg-pink-100 shadow-sm"
                onClick={() => {
                  setIsRankingModalOpen(true)
                  // 初回ロード
                  if (rankingPeriod?.from && rankingPeriod?.to) {
                    setLoadingRanking(true)
                    const start = format(rankingPeriod.from, 'yyyy-MM-dd')
                    const end = format(rankingPeriod.to, 'yyyy-MM-dd')
                    fetch(`/api/evaluations/thankyous/ranking?startDate=${start}&endDate=${end}&teamId=${rankingTeamFilter}`)
                      .then(res => res.json())
                      .then(data => {
                        setRankingData(data.ranking || [])
                        setRankingTeams(data.teams || [])
                        setLoadingRanking(false)
                      })
                      .catch(() => setLoadingRanking(false))
                  }
                }}
              >
                <Medal className="w-4 h-4" />
                ありがとうランキング
              </Button>

              <div className="flex items-center justify-between gap-2 p-1 flex-row lg:flex-col lg:items-stretch lg:gap-3">
                <div className="flex items-center gap-1">
                  <Select value={format(currentDate, 'yyyy')} onValueChange={(v) => {
                    const newDate = new Date(currentDate)
                    newDate.setFullYear(parseInt(v))
                    setCurrentDate(newDate)
                  }}>
                    <SelectTrigger className="w-[64px] h-8 text-xs border-slate-200 px-1 bg-white">
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
                    <SelectTrigger className="w-[44px] h-8 text-xs border-slate-200 px-1 bg-white">
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

                <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                  <Button variant="ghost" size="sm" className="h-7 w-8 px-0 hover:bg-white text-slate-600" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-bold hover:bg-white text-slate-700 mx-0.5" onClick={() => setCurrentDate(new Date())}>
                    今月
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-8 px-0 hover:bg-white text-slate-600" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden flex flex-col h-[300px] lg:h-auto lg:max-h-[calc(100vh-400px)]">
                <table className="w-full text-xs text-left border-collapse sticky top-0 z-10">
                  <thead className="bg-[#1e293b] text-white">
                    <tr>
                      <th className="px-2 py-2 border-r border-slate-700 w-14 text-center whitespace-nowrap">{format(currentDate, 'M月')}</th>
                      <th className="px-2 py-2 border-r border-slate-700 text-center whitespace-nowrap">登録数</th>
                      <th className="px-2 py-2 text-center whitespace-nowrap">
                        <Heart className="w-3 h-3 inline text-pink-300 fill-pink-300" />
                      </th>
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
                          const count = calendarStats[dateStr]?.count || 0
                          const thankYouCount = calendarStats[dateStr]?.thankYouCount || 0

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
                              <td className="px-2 py-2.5 text-center border-r">
                                {count > 0 && (
                                  <Badge variant="secondary" className={cn(
                                    "bg-slate-200 text-slate-600 font-bold h-5 min-w-[20px] px-1 justify-center rounded-full",
                                    isSelected ? "bg-white text-blue-600" : ""
                                  )}>
                                    {count}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                {thankYouCount > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openThankyouModal(dateStr)
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all",
                                      "hover:scale-110 hover:bg-pink-100",
                                      isSelected ? "text-white hover:text-pink-600" : "text-pink-500"
                                    )}
                                  >
                                    <Heart className={cn(
                                      "w-3.5 h-3.5",
                                      isSelected ? "fill-white" : "fill-pink-500"
                                    )} />
                                    <span className={cn(
                                      "text-xs font-bold",
                                      isSelected ? "" : "text-pink-600"
                                    )}>{thankYouCount}</span>
                                  </button>
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
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(`/evaluations/entry/${item.id}/${format(currentDate, 'yyyy-MM-dd')}`)}>
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

      {/* Prompt Management Dialog */}
      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AIレポート プロンプト管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Existing Prompts List */}
            <div className="space-y-2">
              {prompts.map((p) => (
                <div key={p.id} className="p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50">
                  {editingPrompt?.id === p.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingPrompt.name}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                        placeholder="プロンプト名"
                        className="font-bold"
                      />
                      <Textarea
                        value={editingPrompt.prompt}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                        placeholder="プロンプト内容"
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingPrompt(null)}>キャンセル</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setPrompts(prompts.map(pr => pr.id === editingPrompt.id ? editingPrompt : pr))
                          setEditingPrompt(null)
                        }}>
                          <Save className="w-3 h-3 mr-1" /> 保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{p.name}</span>
                          {p.isDefault && <Badge className="bg-blue-100 text-blue-700 text-[10px]">デフォルト</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.prompt}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingPrompt(p)}>
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            if (confirm('このプロンプトを削除してもよろしいですか？')) {
                              setPrompts(prompts.filter(pr => pr.id !== p.id))
                            }
                          }}
                          disabled={p.isDefault}
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Prompt */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-bold text-slate-600 mb-2">新規プロンプトを追加</h4>
              <div className="space-y-2">
                <Input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="プロンプト名 (例: 営業チーム向け分析)"
                />
                <Textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="プロンプト内容 (例: 営業チームの成績を分析し、改善点を提案してください)"
                  className="min-h-[80px]"
                />
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={!newPromptName.trim() || !newPromptText.trim()}
                  onClick={() => {
                    setPrompts([...prompts, {
                      id: `prompt-${Date.now()}`,
                      name: newPromptName,
                      prompt: newPromptText,
                      isDefault: false
                    }])
                    setNewPromptName('')
                    setNewPromptText('')
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> プロンプトを追加
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ありがとうモーダル */}
      <Dialog open={isThankyouModalOpen} onOpenChange={setIsThankyouModalOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              <span>{thankyouModalDate ? format(new Date(thankyouModalDate), 'yyyy年M月d日') : ''} のありがとう一覧</span>
              <Badge className="bg-pink-100 text-pink-600 hover:bg-pink-100">
                {thankyouList.length}件
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {loadingThankyous ? (
              <div className="flex items-center justify-center h-32 text-slate-500">
                読み込み中...
              </div>
            ) : thankyouList.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400">
                この日のありがとうはありません
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(85vh-180px)]">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[35%]">
                        送信者 → 受信者
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[65%]">
                        メッセージ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {thankyouList.map((item, idx) => {
                      // 受信者の表示を決定
                      let recipientDisplay: React.ReactNode
                      if (item.recipientType === 'all') {
                        // 全員宛て
                        recipientDisplay = (
                          <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100 font-bold">
                            全員
                          </Badge>
                        )
                      } else if (item.recipientType === 'team') {
                        // チーム宛て
                        recipientDisplay = (
                          <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 font-bold">
                            {item.teamName || 'チーム'}
                          </Badge>
                        )
                      } else {
                        // 個人宛て
                        recipientDisplay = (
                          <span className="font-medium text-pink-600">{item.toNames}</span>
                        )
                      }

                      return (
                        <tr key={item.id || idx} className="hover:bg-pink-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-800">{item.fromName}</span>
                              <span className="text-slate-400">→</span>
                              {recipientDisplay}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                              {item.message || <span className="text-slate-400 italic">（メッセージなし）</span>}
                            </p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsThankyouModalOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ありがとうランキングモーダル */}
      <Dialog open={isRankingModalOpen} onOpenChange={setIsRankingModalOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              <span>ありがとうランキング</span>
              <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100">
                {rankingData.length}名
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* フィルター */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500 font-bold whitespace-nowrap">期間:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    {rankingPeriod?.from ? (
                      rankingPeriod.to ? (
                        <>{format(rankingPeriod.from, "yyyy/MM/dd")} - {format(rankingPeriod.to, "yyyy/MM/dd")}</>
                      ) : (
                        format(rankingPeriod.from, "yyyy/MM/dd")
                      )
                    ) : (
                      <span>期間を選択</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={rankingPeriod?.from}
                    selected={rankingPeriod}
                    onSelect={setRankingPeriod}
                    numberOfMonths={2}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500 font-bold whitespace-nowrap">チーム:</Label>
              <Select value={rankingTeamFilter} onValueChange={setRankingTeamFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {rankingTeams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              className="h-8 bg-pink-600 hover:bg-pink-700"
              onClick={() => {
                if (rankingPeriod?.from && rankingPeriod?.to) {
                  setLoadingRanking(true)
                  const start = format(rankingPeriod.from, 'yyyy-MM-dd')
                  const end = format(rankingPeriod.to, 'yyyy-MM-dd')
                  fetch(`/api/evaluations/thankyous/ranking?startDate=${start}&endDate=${end}&teamId=${rankingTeamFilter}`)
                    .then(res => res.json())
                    .then(data => {
                      setRankingData(data.ranking || [])
                      setRankingTeams(data.teams || [])
                      setLoadingRanking(false)
                    })
                    .catch(() => setLoadingRanking(false))
                }
              }}
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              検索
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {loadingRanking ? (
              <div className="flex items-center justify-center h-32 text-slate-500">
                読み込み中...
              </div>
            ) : rankingData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400">
                データがありません
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(85vh-280px)]">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-amber-50 to-pink-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                        順位
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        社員名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28">
                        チーム
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-pink-600 uppercase tracking-wider w-24">
                        <div className="flex flex-col items-center">
                          <span>受取pt</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-pink-500 uppercase tracking-wider w-20">
                        受取数
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider w-24">
                        送信pt
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-500 uppercase tracking-wider w-20">
                        送信数
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingData.map((item: any, idx: number) => {
                      // 順位メダル表示
                      let rankDisplay: React.ReactNode
                      if (idx === 0 && item.received.pts > 0) {
                        rankDisplay = <span className="text-xl">🥇</span>
                      } else if (idx === 1 && item.received.pts > 0) {
                        rankDisplay = <span className="text-xl">🥈</span>
                      } else if (idx === 2 && item.received.pts > 0) {
                        rankDisplay = <span className="text-xl">🥉</span>
                      } else {
                        rankDisplay = <span className="text-sm font-bold text-slate-500">{idx + 1}</span>
                      }

                      return (
                        <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-4 py-3 text-center">
                            {rankDisplay}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">{item.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{item.teamName || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-pink-600">{item.received.pts.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 ml-0.5">pt</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-600 hover:bg-pink-100">
                              {item.received.count}件
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-blue-600">{item.sent.pts.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 ml-0.5">pt</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-600 hover:bg-blue-100">
                              {item.sent.count}件
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsRankingModalOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
