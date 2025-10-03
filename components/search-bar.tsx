"use client"

import { useState } from "react"
import { Search, Sparkles, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export function SearchBar() {
  const [organization, setOrganization] = useState<string>("")
  const [employeeName, setEmployeeName] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [searchType, setSearchType] = useState<string>("keyword")

  const handleSearch = () => {
    console.log("[v0] Search filters:", {
      organization,
      employeeName,
      dateFrom,
      dateTo,
      searchType,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">総合検索</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Select value={organization} onValueChange={setOrganization}>
          <SelectTrigger>
            <SelectValue placeholder="組織" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全組織</SelectItem>
            <SelectItem value="tech">技術部門</SelectItem>
            <SelectItem value="business">事業部門</SelectItem>
            <SelectItem value="admin">管理部門</SelectItem>
            <SelectItem value="engineering">エンジニアリング部</SelectItem>
            <SelectItem value="sales">営業部</SelectItem>
            <SelectItem value="hr">人事部</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="社員名"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              {dateFrom && dateTo
                ? `${format(dateFrom, "yyyy/MM/dd", { locale: ja })} ~ ${format(dateTo, "yyyy/MM/dd", { locale: ja })}`
                : "期間指定"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2">
              <div>
                <p className="text-sm font-medium mb-2">開始日</p>
                <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ja} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">終了日</p>
                <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} locale={ja} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger>
            <SelectValue placeholder="検索方法" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keyword">キーワード検索</SelectItem>
            <SelectItem value="ai">AIに聞く</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 flex-1">
          <Search className="w-4 h-4 mr-2" />
          AND検索
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setOrganization("")
            setEmployeeName("")
            setDateFrom(undefined)
            setDateTo(undefined)
            setSearchType("keyword")
          }}
        >
          クリア
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        全ての条件でAND検索します。AIに聞くを選択すると自然言語で検索できます。
      </p>
    </div>
  )
}
