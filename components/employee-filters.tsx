"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"

interface EmployeeFiltersProps {
  onFiltersChange?: (filters: {
    searchQuery: string
    department: string
    status: string
    employeeType: string
    position: string
    showInOrgChart: string
  }) => void
}

export function EmployeeFilters({ onFiltersChange }: EmployeeFiltersProps) {
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("active")
  const [employeeType, setEmployeeType] = useState("正社員")
  const [position, setPosition] = useState("all")
  const [showInOrgChart, setShowInOrgChart] = useState("1")
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])
  const [availableEmploymentTypes, setAvailableEmploymentTypes] = useState<{value: string, label: string}[]>([])

  // データ取得関数
  const loadData = async () => {
    if (typeof window !== 'undefined') {
      try {
        console.log('マスターデータの取得を開始します')
        // APIエンドポイントからマスターデータを取得
        const response = await fetch('/api/master-data')
        console.log('マスターデータAPIレスポンス:', response.status)
        const result = await response.json()
        console.log('マスターデータAPI結果:', result)
        
        if (result.success && result.data) {
          const masterData = result.data
          console.log('マスターデータ:', masterData)
          
          // 部署データを設定
          if (masterData.departments) {
            console.log('部署データを設定:', masterData.departments)
            setAvailableDepartments(masterData.departments)
            // localStorageにも保存
            localStorage.setItem('available-departments', JSON.stringify(masterData.departments))
          } else {
            console.warn('部署データが取得できませんでした')
          }
          
          // 役職データを設定
          if (masterData.positions) {
            console.log('役職データを設定:', masterData.positions)
            setAvailablePositions(masterData.positions)
            // localStorageにも保存
            localStorage.setItem('available-positions', JSON.stringify(masterData.positions))
          } else {
            console.warn('役職データが取得できませんでした')
          }
          
          // 雇用形態データを設定
          if (masterData.employmentTypes) {
            const employmentTypes = masterData.employmentTypes.map((type: string) => ({
              value: type,
              label: type
            }))
            console.log('雇用形態データを設定:', employmentTypes)
            setAvailableEmploymentTypes(employmentTypes)
            // localStorageにも保存
            localStorage.setItem('employment-types', JSON.stringify(employmentTypes))
          } else {
            console.warn('雇用形態データが取得できませんでした')
          }
        } else {
          // APIから取得できない場合はlocalStorageから取得
          console.warn('APIからマスターデータを取得できませんでした。localStorageから取得します。')
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error('マスターデータの取得エラー:', error)
        // エラーの場合はlocalStorageから取得
        loadFromLocalStorage()
      }
    }
  }

  // localStorageからデータを取得する関数
  const loadFromLocalStorage = () => {
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

    // 雇用形態管理から取得
    const savedEmploymentTypes = localStorage.getItem('employment-types')
    if (savedEmploymentTypes) {
      try {
        const employmentTypes = JSON.parse(savedEmploymentTypes)
        setAvailableEmploymentTypes(employmentTypes)
      } catch (error) {
        console.error('雇用形態データの取得エラー:', error)
      }
    }
  }

  // 初期読み込み
  useEffect(() => {
    // キャッシュをクリアしてからデータを読み込み
    if (typeof window !== 'undefined') {
      localStorage.removeItem('available-departments')
      localStorage.removeItem('available-positions')
      localStorage.removeItem('employment-types')
    }
    loadData()
  }, [])

  // localStorage変更を監視
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
    window.addEventListener('employmentTypesChanged', handleCustomStorageChange)
    window.addEventListener('departmentsChanged', handleCustomStorageChange)
    window.addEventListener('positionsChanged', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('employmentTypesChanged', handleCustomStorageChange)
      window.removeEventListener('departmentsChanged', handleCustomStorageChange)
      window.removeEventListener('positionsChanged', handleCustomStorageChange)
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
    setEmployeeType("正社員")
    setPosition("all")
    setShowInOrgChart("1")
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4 shadow-sm" style={{ backgroundColor: '#b4d5e7' }}>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
            <SelectItem value="all">全雇用形態</SelectItem>
            {availableEmploymentTypes
              .filter((type) => type.value && type.value.trim() !== '' && type.value !== '')
              .map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="部署" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部署</SelectItem>
            {availableDepartments
              .filter((dept) => dept && dept.trim() !== '')
              .map((dept) => (
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
            {availablePositions
              .filter((pos) => pos && pos.trim() !== '')
              .map((pos) => (
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
