"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"

interface SharedEmployeeFiltersProps {
  onFiltersChange?: (filters: {
    searchQuery: string
    department: string
    status: string
    employeeType: string
    position: string
    showInOrgChart: string
  }) => void
  showStatusFilter?: boolean
  showClearButton?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export function SharedEmployeeFilters({ 
  onFiltersChange, 
  showStatusFilter = true,
  showClearButton = true,
  placeholder = "社員名、社員番号、部署、役職で検索...",
  className = "",
  style
}: SharedEmployeeFiltersProps) {
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("active")
  const [employeeType, setEmployeeType] = useState("employee")
  const [position, setPosition] = useState("all")
  const [showInOrgChart, setShowInOrgChart] = useState("all")
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
        position,
        showInOrgChart
      })
    }
  }, [searchQuery, department, status, employeeType, position, showInOrgChart])

  const handleClearFilters = () => {
    setSearchQuery("")
    setDepartment("all")
    setStatus("active")
    setEmployeeType("employee")
    setPosition("all")
    setShowInOrgChart("all")
  }

  // グリッドの列数を動的に決定
  const gridCols = showStatusFilter && showClearButton ? "md:grid-cols-7" : 
                   showStatusFilter || showClearButton ? "md:grid-cols-6" : "md:grid-cols-5"

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`} style={style}>
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={placeholder}
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

        <Select value={showInOrgChart} onValueChange={setShowInOrgChart}>
          <SelectTrigger>
            <SelectValue placeholder="組織図表示" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">組織図表示</SelectItem>
            <SelectItem value="1">表示ON</SelectItem>
            <SelectItem value="0">表示OFF</SelectItem>
          </SelectContent>
        </Select>

        {/* ステータスフィルター（オプション） */}
        {showStatusFilter && (
          <>
            {/* 店長・マネージャー・総務・管理者のみステータスフィルターを変更可能 */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager' || currentUser?.role === 'store_manager') ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ステータス</SelectItem>
                  <SelectItem value="active">在籍中</SelectItem>
                  <SelectItem value="leave">休職中</SelectItem>
                  <SelectItem value="retired">退職</SelectItem>
                  <SelectItem value="suspended">外注停止</SelectItem>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager') && (
                    <SelectItem value="copy">コピー社員</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              /* 一般ユーザーは「在籍中」固定表示 */
              <div className="flex items-center justify-center h-10 px-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="text-sm text-slate-700">在籍中</span>
              </div>
            )}
          </>
        )}

        {/* クリアボタン（オプション） */}
        {showClearButton && (
          <Button 
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            クリア
          </Button>
        )}
      </div>
    </div>
  )
}
