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
  Download
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

export default function EvaluationsPage() {
  const { currentUser } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [filterTeam, setFilterTeam] = useState('all')

  // Mock data for initial UI
  const contractStats = {
    achieved: 2250,
    goal: 2000,
    rate: 112.5
  }
  const completionStats = {
    achieved: 1950,
    goal: 2000,
    rate: 97.5
  }
  const yearlyStats = {
    achieved: 14080,
    goal: 16000,
    rate: 88
  }

  const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">人事考課システム</h1>
            <p className="text-slate-500 mt-1">
              {format(currentDate, 'yyyy年MM月dd日 (E)', { locale: ja })} の報告状況とAI分析
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-slate-200 p-1 rounded-lg">
              <Button
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setViewMode('daily')}
              >
                日次
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setViewMode('monthly')}
              >
                期間
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(currentDate, "yyyy年MM月dd日", { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>

            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Sparkles className="w-4 h-4" />
              AIレポートを生成
            </Button>
            <Button variant="outline">
              <span className="mr-2">AIに聞く</span>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Month Contract */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">{format(currentDate, 'yyyy年M月', { locale: ja })}</span>
              <span className="text-xs text-slate-500">契約達成状況</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">契約達成額</div>
                <div className="font-bold text-lg">¥{contractStats.achieved.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">契約目標額</div>
                <div className="font-bold text-lg">¥{contractStats.goal.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center bg-blue-50/50">
                <div className="text-xs text-slate-500 mb-1">達成率</div>
                <div className="font-bold text-lg text-blue-600">{contractStats.rate}%</div>
              </div>
            </div>
          </div>

          {/* Previous Month Completion (Dummy logic for now) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">{format(subMonths(currentDate, 1), 'yyyy年M月', { locale: ja })}</span>
              <span className="text-xs text-slate-500">完工達成状況 (確定: 2ヶ月前)</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">完工達成額</div>
                <div className="font-bold text-lg">¥{completionStats.achieved.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">完工目標額</div>
                <div className="font-bold text-lg">¥{completionStats.goal.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center bg-green-50/50">
                <div className="text-xs text-slate-500 mb-1">達成率</div>
                <div className="font-bold text-lg text-green-600">{completionStats.rate}%</div>
              </div>
            </div>
          </div>

          {/* Yearly Total */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">期間合計</span>
              <span className="text-xs text-slate-500">完工達成状況</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">完工達成額</div>
                <div className="font-bold text-lg">¥{yearlyStats.achieved.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">完工目標額</div>
                <div className="font-bold text-lg">¥{yearlyStats.goal.toLocaleString()}</div>
              </div>
              <div className="p-4 text-center bg-orange-50/50">
                <div className="text-xs text-slate-500 mb-1">達成率</div>
                <div className="font-bold text-lg text-orange-600">{yearlyStats.rate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="チーム" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="A">営業Aチーム</SelectItem>
                <SelectItem value="B">営業Bチーム</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="雇用形態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="full">正社員</SelectItem>
                <SelectItem value="part">パート</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {isAdminOrHr && (
              <div className="flex items-center gap-2">
                <Link href="/evaluations/settings/employees">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="w-4 h-4" />
                    個別設定
                  </Button>
                </Link>
                <Link href="/evaluations/settings/patterns">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    チェック設定
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Left Sidebar: Calendar / Filter */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(currentDate, 'M月', { locale: ja })} 登録数
              </h3>
              {/* Calendar view placeholder */}
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded cursor-pointer">
                    <span>{i + 1}日 ({['月', '火', '水', '木', '金'][i % 5]})</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">5</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">
                社員別 報告一覧 - {format(currentDate, 'yyyy年MM月dd日 (E)', { locale: ja })}
              </h2>
              <span className="text-xs text-slate-500">該当件数: 0件</span>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">社員名</th>
                    <th className="px-4 py-3">チーム</th>
                    <th className="px-4 py-3">進捗</th>
                    <th className="px-4 py-3">獲得pt</th>
                    <th className="px-4 py-3">ステータス</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">田中 太郎</td>
                    <td className="px-4 py-3 text-slate-500">Aチーム</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[85%]"></div>
                        </div>
                        <span className="text-xs text-slate-500">85%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600">15pt</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">完了</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/evaluations/entry/user-1/${format(currentDate, 'yyyy-MM-dd')}`}>
                        <Button size="sm" variant="outline">詳細確認</Button>
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
