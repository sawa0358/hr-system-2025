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
  Sparkles,
  Settings,
  Users,
  Download,
  Plus
} from "lucide-react"
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
// import { EvaluationsTable } from "@/components/evaluations/evaluations-table" // To be created
import Link from "next/link"
import { Label } from "@/components/ui/label"

export default function EvaluationsPage() {
  const { currentUser } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterEmployment, setFilterEmployment] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [sortOrder, setSortOrder] = useState('registration-newest')

  // Mock data for initial UI
  const contractStats = {
    achieved: '2,250',
    goal: '2,000',
    rate: '112.5'
  }
  const completionStats = {
    achieved: '1,950',
    goal: '2,000',
    rate: '97.5'
  }
  const periodStats = {
    achieved: '14,080',
    goal: '16,000',
    rate: '88'
  }

  const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'

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
                <Button variant="outline" className="h-9 justify-start text-left font-normal border-slate-200">
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                  {format(currentDate, "yyyy/MM/dd", { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                  locale={ja}
                />
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
            <Button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white gap-2 font-bold h-9">
              <Sparkles className="w-4 h-4" />
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
          {/* Card 1 */}
          <div className="flex flex-col border-r last:border-0 border-slate-100">
            <div className="bg-[#0f172a] text-white text-center py-2 text-sm font-bold">
              {format(currentDate, 'yyyy年M月')}
            </div>
            <div className="grid grid-cols-3 bg-[#1e293b] text-white text-[10px] py-1 px-2 border-b border-slate-700">
              <div className="text-center font-bold">契約達成額</div>
              <div className="text-center font-bold">契約目標額</div>
              <div className="text-center font-bold">達成率</div>
            </div>
            <div className="grid grid-cols-3 p-3 gap-2">
              <div className="text-center font-bold text-lg">¥{contractStats.achieved}</div>
              <div className="text-center font-bold text-lg">¥{contractStats.goal}</div>
              <div className="text-center font-bold text-lg">{contractStats.rate}%</div>
            </div>
          </div>
          {/* Card 2 */}
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
              <div className="text-center font-bold text-lg">¥{completionStats.achieved}</div>
              <div className="text-center font-bold text-lg">¥{completionStats.goal}</div>
              <div className="text-center font-bold text-lg">{completionStats.rate}%</div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="flex flex-col">
            <div className="bg-[#0f172a] text-white text-center py-2 text-sm font-bold flex justify-center items-center gap-2">
              2025年4月〜11月
              <Badge className="bg-slate-700 text-[10px] hover:bg-slate-700 border-0 h-5">確定: 2ヶ月前まで</Badge>
            </div>
            <div className="grid grid-cols-3 bg-[#1e293b] text-white text-[10px] py-1 px-2 border-b border-slate-700">
              <div className="text-center font-bold">完工達成額</div>
              <div className="text-center font-bold">完工目標額</div>
              <div className="text-center font-bold">達成率</div>
            </div>
            <div className="grid grid-cols-3 p-3 gap-2">
              <div className="text-center font-bold text-lg">¥{periodStats.achieved}</div>
              <div className="text-center font-bold text-lg">¥{periodStats.goal}</div>
              <div className="text-center font-bold text-lg">{periodStats.rate}%</div>
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
                        const dayOfWeek = date.getDay() // 0:Sun, 1:Mon...
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        const isSelected = format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')

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
                              {/* Mock counts */}
                              {!isWeekend && (
                                <Badge variant="secondary" className={cn(
                                  "bg-slate-200 text-slate-600 font-bold h-5 min-w-[20px] px-1 justify-center rounded-full",
                                  isSelected ? "bg-white text-blue-600" : ""
                                )}>
                                  {Math.floor(Math.random() * 10)}
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
                <Badge className="bg-blue-600 hover:bg-blue-600 h-6 px-3">2026年1月6日(火)</Badge>
              </div>
              <span className="text-xs text-slate-500 font-bold">該当件数: 13件</span>
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
                  {[
                    { name: '小西愛', team: '営業Aチーム / 執行チーム', status: '登録済', statusDate: '24-01-06', dailyPt: '31pt', comments: ['・報・連・相が遅れ気味なのでその場でLINEで送った方が良いと思います。', '・お客様に連絡が遅れてとお叱りをうけました。'], monthlyPt: '476pt', fyPt: '1,077pt', color: 'blue' },
                    { name: '小澤未來', team: '営業Cチーム', status: '登録済', statusDate: '24-01-07', dailyPt: '23pt', comments: ['記入なし'], monthlyPt: '422pt', fyPt: '1,004pt', color: 'blue' },
                    { name: '堀之内健二', team: '営業Bチーム', status: '未登録', statusDate: '-', dailyPt: '0pt', comments: ['記入なし'], monthlyPt: '397pt', fyPt: '942pt', color: 'slate' },
                    { name: '瀬尾麻衣子', team: '営業Bチーム', status: '未登録', statusDate: '-', dailyPt: '0pt', comments: ['記入なし'], monthlyPt: '445pt', fyPt: '1,124pt', color: 'slate' },
                    { name: '水口莉紗巳', team: '内勤Aチーム', status: '登録済', statusDate: '24-01-06', dailyPt: '20pt', comments: ['・マニュアル化した時にチャットワークで伝えると良いと思います'], monthlyPt: '329pt', fyPt: '894pt', color: 'blue' },
                    { name: '森香織', team: '内勤Bチーム', status: '未登録', statusDate: '-', dailyPt: '33pt', comments: ['記入なし'], monthlyPt: '424pt', fyPt: '1,253pt', color: 'slate' },
                  ].map((item, idx) => (
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
                          {item.comments.map((c, i) => (
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
                        <Link href={`/evaluations/entry/user-${idx}/${format(currentDate, 'yyyy-MM-dd')}`}>
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
      </div>
    </div >
  )
}
