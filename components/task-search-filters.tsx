"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"

interface TaskSearchFiltersProps {
  onFilterChange?: (filters: TaskFilters) => void
}

export interface TaskFilters {
  freeWord: string
  member: string
  showArchived: boolean
  dateFrom: string
  dateTo: string
}

export function TaskSearchFilters({ onFilterChange }: TaskSearchFiltersProps) {
  const [freeWord, setFreeWord] = useState("")
  const [member, setMember] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleSearch = () => {
    onFilterChange?.({
      freeWord,
      member,
      showArchived,
      dateFrom,
      dateTo,
    })
  }

  const handleReset = () => {
    setFreeWord("")
    setMember("all")
    setShowArchived(false)
    setDateFrom("")
    setDateTo("")
    onFilterChange?.({
      freeWord: "",
      member: "all",
      showArchived: false,
      dateFrom: "",
      dateTo: "",
    })
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-sm mb-2 block">フリーワード</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="タスク名、説明で検索..."
              value={freeWord}
              onChange={(e) => setFreeWord(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="w-40">
          <Label className="text-sm mb-2 block">メンバー</Label>
          <Select value={member} onValueChange={setMember}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全員</SelectItem>
              <SelectItem value="田中 太郎">田中 太郎</SelectItem>
              <SelectItem value="佐藤 花子">佐藤 花子</SelectItem>
              <SelectItem value="鈴木 一郎">鈴木 一郎</SelectItem>
              <SelectItem value="高橋 美咲">高橋 美咲</SelectItem>
              <SelectItem value="伊藤 健太">伊藤 健太</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-sm mb-2 block">日付範囲</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="yyyymmdd"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 text-sm"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <span className="text-slate-500">〜</span>
            <Input
              placeholder="yyyymmdd"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 text-sm"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showArchived"
            checked={showArchived}
            onCheckedChange={(checked) => {
              const newShowArchived = checked as boolean
              setShowArchived(newShowArchived)
              // 即座にフィルターを適用
              onFilterChange?.({
                freeWord,
                member,
                showArchived: newShowArchived,
                dateFrom,
                dateTo,
              })
            }}
          />
          <Label htmlFor="showArchived" className="cursor-pointer text-sm whitespace-nowrap">
            アーカイブを表示
          </Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            検索
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="w-3.5 h-3.5 mr-1.5" />
            クリア
          </Button>
        </div>
      </div>
    </div>
  )
}
