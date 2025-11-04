"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"

interface Employee {
  id: string
  name: string
  employmentType?: string | null
  status: string
}

interface TaskSearchFiltersProps {
  onFilterChange?: (filters: TaskFilters) => void
  employees?: Employee[]
}

export interface TaskFilters {
  freeWord: string
  member: string
  showArchived: boolean
  dateFrom: string
  dateTo: string
}

export function TaskSearchFilters({ onFilterChange, employees = [] }: TaskSearchFiltersProps) {
  const [freeWord, setFreeWord] = useState("")
  const [member, setMember] = useState("all")
  const [employmentType, setEmploymentType] = useState("all")
  const [status, setStatus] = useState("active")
  const [showArchived, setShowArchived] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // 雇用形態・ステータスでフィルタリングされた社員一覧
  const filteredEmployees = useMemo(() => {
    let filtered = employees

    // 雇用形態でフィルタリング
    if (employmentType !== "all") {
      filtered = filtered.filter(emp => emp.employmentType === employmentType)
    }

    // ステータスでフィルタリング
    if (status === "active") {
      // 「在籍中」の場合は status === 'active' のみ
      filtered = filtered.filter(emp => emp.status === "active")
    } else if (status !== "all") {
      filtered = filtered.filter(emp => emp.status === status)
    }

    // 名前でソート
    return filtered.sort((a, b) => a.name.localeCompare(b.name, "ja"))
  }, [employees, employmentType, status])

  // 雇用形態・ステータスが変更されたらメンバー選択をリセット
  const handleEmploymentTypeChange = (value: string) => {
    setEmploymentType(value)
    setMember("all")
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setMember("all")
  }

  // フリーワード変更時に即座にフィルターを適用
  useEffect(() => {
    onFilterChange?.({
      freeWord,
      member,
      showArchived,
      dateFrom,
      dateTo,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeWord, member, showArchived, dateFrom, dateTo])

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
    setEmploymentType("all")
    setStatus("active")
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
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
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
          <Label className="text-sm mb-2 block">雇用形態</Label>
          <Select value={employmentType} onValueChange={handleEmploymentTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全雇用形態</SelectItem>
              <SelectItem value="正社員">正社員</SelectItem>
              <SelectItem value="契約社員">契約社員</SelectItem>
              <SelectItem value="パートタイム">パートタイム</SelectItem>
              <SelectItem value="派遣社員">派遣社員</SelectItem>
              <SelectItem value="業務委託">業務委託</SelectItem>
              <SelectItem value="外注先">外注先</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label className="text-sm mb-2 block">ステータス</Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">在籍中</SelectItem>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="leave">休職中</SelectItem>
              <SelectItem value="retired">退職</SelectItem>
              <SelectItem value="suspended">停職中</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label className="text-sm mb-2 block">メンバー</Label>
          <Select value={member} onValueChange={setMember}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全員</SelectItem>
              {filteredEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
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
