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

  // 部署と役職の一覧を取得
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const employees = await response.json()
          
          // 部署の一覧を取得（重複を除去）
          const departments = [...new Set(employees.map((emp: any) => emp.department).filter(Boolean))] as string[]
          setAvailableDepartments(departments)
          
          // 役職の一覧を取得（重複を除去）
          const positions = [...new Set(employees.map((emp: any) => emp.position).filter(Boolean))] as string[]
          setAvailablePositions(positions)
        }
      } catch (error) {
        console.error('フィルターオプションの取得エラー:', error)
      }
    }

    fetchFilterOptions()
  }, [])

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
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
              <SelectItem key={pos} value={pos}>{pos}</SelectItem>
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
