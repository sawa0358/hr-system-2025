"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useSettingsSync } from "@/hooks/use-settings-sync"

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
  const { saveSettings } = useSettingsSync()
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("active")
  const [employeeType, setEmployeeType] = useState("employee")
  const [position, setPosition] = useState("all")
  const [showInOrgChart, setShowInOrgChart] = useState("1")
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])
  const [availableEmploymentTypes, setAvailableEmploymentTypes] = useState<{value: string, label: string}[]>([])

  // マスターデータをAPIから取得
  const loadData = async () => {
    try {
      // APIからマスターデータを取得
      const response = await fetch('/api/master-data')
      const result = await response.json()
      
      console.log('マスターデータ取得結果:', result)
      
      // APIのレスポンス形式を確認（success.data または直接データ）
      const masterData = result.data || result
      
      // 部署データを設定
      if (masterData.department && Array.isArray(masterData.department)) {
        const deptValues = masterData.department.map((item: any) => 
          typeof item === 'string' ? item : item.value || item.label
        )
        setAvailableDepartments(deptValues)
        if (typeof window !== 'undefined') {
          localStorage.setItem('available-departments', JSON.stringify(deptValues))
        }
      }
      
      // 役職データを設定
      if (masterData.position && Array.isArray(masterData.position)) {
        const posValues = masterData.position.map((item: any) => 
          typeof item === 'string' ? item : item.value || item.label
        )
        setAvailablePositions(posValues)
        if (typeof window !== 'undefined') {
          localStorage.setItem('available-positions', JSON.stringify(posValues))
        }
      }
      
      // 雇用形態データを設定
      if (masterData.employeeType && Array.isArray(masterData.employeeType)) {
        const types = masterData.employeeType
          .map((item: any) => 
            typeof item === 'string' ? { value: item, label: item } : item
          )
          .filter((item: any) => {
            // employeeを除外
            if (item.value === 'employee') return false
            // 正社員を除外（value="employee"の正社員を表示するため）
            if (item.value === '正社員' || item.label === '正社員') return false
            return item.value && item.label
          })
        setAvailableEmploymentTypes(types)
        if (typeof window !== 'undefined') {
          localStorage.setItem('employment-types', JSON.stringify(types))
        }
      }
    } catch (error) {
      console.error('マスターデータの取得エラー:', error)
      // APIから取得できない場合はlocalStorageから取得
      if (typeof window !== 'undefined') {
        const savedDepartments = localStorage.getItem('available-departments')
        if (savedDepartments) {
          try {
            setAvailableDepartments(JSON.parse(savedDepartments))
          } catch (e) {
            console.error('部署データのパースエラー:', e)
          }
        }
        
        const savedPositions = localStorage.getItem('available-positions')
        if (savedPositions) {
          try {
            setAvailablePositions(JSON.parse(savedPositions))
          } catch (e) {
            console.error('役職データのパースエラー:', e)
          }
        }
        
        const savedEmploymentTypes = localStorage.getItem('employment-types')
        if (savedEmploymentTypes) {
          try {
            const types = JSON.parse(savedEmploymentTypes)
              .filter((item: any) => {
                // employeeを除外
                if (item.value === 'employee') return false
                // 正社員を除外（value="employee"の正社員を表示するため）
                if (item.value === '正社員' || item.label === '正社員') return false
                return item.value && item.label
              })
            setAvailableEmploymentTypes(types)
          } catch (e) {
            console.error('雇用形態データのパースエラー:', e)
          }
        }
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // localStorage変更を監視してプルダウンを更新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'available-departments' || e.key === 'available-positions' || e.key === 'employment-types') {
        loadData()
      }
    }

    const handleCustomStorageChange = () => {
      loadData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('departmentsChanged', handleCustomStorageChange)
    window.addEventListener('positionsChanged', handleCustomStorageChange)
    window.addEventListener('employmentTypesChanged', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('departmentsChanged', handleCustomStorageChange)
      window.removeEventListener('positionsChanged', handleCustomStorageChange)
      window.removeEventListener('employmentTypesChanged', handleCustomStorageChange)
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

  // 設定変更時にS3に自動保存
  useEffect(() => {
    if (currentUser?.id && (department !== "all" || position !== "all" || employeeType !== "all")) {
      // 設定が変更された時にS3に保存
      saveSettings()
    }
  }, [department, position, employeeType, currentUser?.id, saveSettings])

  const handleClearFilters = () => {
    setSearchQuery("")
    setDepartment("all")
    setStatus("active")
    setEmployeeType("employee")
    setPosition("all")
    setShowInOrgChart("1")
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
            <SelectItem value="all">全雇用形態</SelectItem>
            <SelectItem value="employee">正社員</SelectItem>
            {availableEmploymentTypes.length > 0 ? (
              availableEmploymentTypes
                .filter((type) => {
                  // employeeを除外
                  if (type.value === 'employee') return false
                  // 正社員を除外（value="employee"の正社員を表示するため）
                  if (type.value === '正社員' || type.label === '正社員') return false
                  return type.value && type.label
                })
                .map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))
            ) : (
              <>
                <SelectItem value="契約社員">契約社員</SelectItem>
                <SelectItem value="パートタイム">パートタイム</SelectItem>
                <SelectItem value="業務委託">業務委託</SelectItem>
                <SelectItem value="外注先">外注先</SelectItem>
                <SelectItem value="派遣社員">派遣社員</SelectItem>
              </>
            )}
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
