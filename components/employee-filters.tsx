"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmployeeFiltersProps {
  onFiltersChange?: (filters: {
    searchQuery: string
    department: string
    status: string
    employeeType: string
    position: string
  }) => void
}

export function EmployeeFilters({ onFiltersChange }: EmployeeFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("active")
  const [employeeType, setEmployeeType] = useState("all")
  const [position, setPosition] = useState("all")
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])

  // 部署と役職の一覧をlocalStorageから取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 部署管理から取得
      const savedDepartments = localStorage.getItem('available-departments')
      if (savedDepartments) {
        try {
          const departments = JSON.parse(savedDepartments)
          setAvailableDepartments(departments)
        } catch (error) {
          console.error('部署データの取得エラー:', error)
        }
      }

      // 役職管理から取得
      const savedPositions = localStorage.getItem('available-positions')
      if (savedPositions) {
        try {
          const positions = JSON.parse(savedPositions)
          setAvailablePositions(positions)
        } catch (error) {
          console.error('役職データの取得エラー:', error)
        }
      }
    }
  }, [])

  // カッコ表示を除去するヘルパー関数
  const cleanText = (text: string) => {
    return text.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '')
  }

  // フィルター変更時に親コンポーネントに通知
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        searchQuery,
        department,
        status,
        employeeType,
        position
      })
    }
  }, [searchQuery, department, status, employeeType, position])

  const handleClearFilters = () => {
    setSearchQuery("")
    setDepartment("all")
    setStatus("active")
    setEmployeeType("all")
    setPosition("all")
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="社員名、社員番号、部署、役職で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={employeeType} onValueChange={setEmployeeType}>
          <SelectTrigger>
            <SelectValue placeholder="雇用形態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">雇用形態</SelectItem>
            <SelectItem value="employee">正社員</SelectItem>
            <SelectItem value="contractor">契約社員</SelectItem>
          </SelectContent>
        </Select>

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="部署" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部署</SelectItem>
            {availableDepartments.map((dept) => (
              <SelectItem key={dept} value={dept}>{cleanText(dept)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger>
            <SelectValue placeholder="役職" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全役職</SelectItem>
            {availablePositions.map((pos) => (
              <SelectItem key={pos} value={pos}>{cleanText(pos)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全ステータス</SelectItem>
            <SelectItem value="active">在籍中</SelectItem>
            <SelectItem value="leave">休職中</SelectItem>
            <SelectItem value="retired">退職</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          クリア
        </Button>
      </div>
    </div>
  )
}
