"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AIAskButton } from "@/components/ai-ask-button"
import { Users } from "lucide-react"
// import { mockEmployees } from "@/lib/mock-data" // フォールバックとして使用しない
import { PayrollUploadDialog } from "@/components/payroll-upload-dialog"
import { useAuth } from "@/lib/auth-context"
import { SharedEmployeeFilters } from "@/components/shared-employee-filters"

export default function PayrollPage() {
  const { currentUser } = useAuth()
  const [filters, setFilters] = useState({
    searchQuery: "",
    department: "all",
    position: "all",
    status: "active",
    employeeType: "all"
  })
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAllEmployeesMode, setIsAllEmployeesMode] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])

  // 社員データを取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
        } else {
          console.error('社員データの取得に失敗しました')
          setEmployees([])
        }
      } catch (error) {
        console.error('社員データの取得エラー:', error)
        setEmployees([])
      }
    }

    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter((emp) => {
    // 権限チェック: 総務・管理者以外は自分のデータのみ表示
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    if (!isAdminOrHR) {
      // 自分以外のデータは表示しない
      if (emp.id !== currentUser?.id) {
        return false
      }
    }

    // 見えないTOP社員は管理者のみに表示
    const isInvisibleTop = emp.isInvisibleTop || emp.employeeNumber === '000'
    if (isInvisibleTop) {
      return currentUser?.role === 'admin'
    }

    // 休職・退職・停止中の社員はマネージャー・総務・管理者のみに表示
    const isManagerOrHR = currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
    const isInactive = emp.status === 'leave' || emp.status === 'retired' || emp.status === 'suspended' || emp.isSuspended
    if (isInactive) {
      return isManagerOrHR
    }

    // フリーワード検索（複数の組織名・部署・役職も含む）
    let matchesSearch = true
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      // 複数の組織名・部署・役職を配列として取得
      const departments = Array.isArray(emp.departments) ? emp.departments : [emp.department]
      const positions = Array.isArray(emp.positions) ? emp.positions : [emp.position]
      const organizations = Array.isArray(emp.organizations) ? emp.organizations : [emp.organization]
      
      const searchableText = [
        emp.name,
        emp.employeeNumber || emp.employeeId,
        ...departments,
        ...positions,
        ...organizations,
        emp.email,
        emp.phone
      ].join(' ').toLowerCase()
      
      matchesSearch = searchableText.includes(query)
    }

    // 雇用形態フィルター
    const matchesType = filters.employeeType === "all" || emp.employeeType === filters.employeeType

    // 部署フィルター（複数の部署も含む）
    const matchesDepartment = filters.department === "all" || (() => {
      const departments = Array.isArray(emp.departments) ? emp.departments : [emp.department]
      return departments.includes(filters.department)
    })()

    // 役職フィルター（複数の役職も含む）
    const matchesPosition = filters.position === "all" || (() => {
      const positions = Array.isArray(emp.positions) ? emp.positions : [emp.position]
      return positions.includes(filters.position)
    })()

    // ステータスフィルター
    const matchesStatus = filters.status === "all" || emp.status === filters.status

    // システム使用状態のフィルタリング
    const isManager = currentUser?.role === 'manager'
    
    let matchesSystemStatus = true
    if (!isAdminOrHR && !isManager) {
      // 一般ユーザーはシステム使用ONの社員のみ表示
      matchesSystemStatus = emp.role && emp.role !== ''
    }

    // ダミー社員（見えないTOP社員または社員番号000）の表示制限
    // 管理者・総務以外は、見えないTOP社員または社員番号000を非表示にする
    if (!isAdminOrHR) {
      // 見えないTOP社員または社員番号000を除外
      if (emp.isInvisibleTop || emp.employeeNumber === '000') {
        return false
      }
    }

    return matchesSearch && matchesDepartment && matchesPosition && matchesStatus && matchesType && matchesSystemStatus
  })

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setIsAllEmployeesMode(false)
    setIsUploadDialogOpen(true)
  }

  const handleAllEmployeesClick = () => {
    setSelectedEmployee({ name: "全員分", employeeNumber: "ALL", department: "全部署" })
    setIsAllEmployeesMode(true)
    setIsUploadDialogOpen(true)
  }

  // 現在のユーザーの権限を取得
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const filterDescriptions = []
    if (filters.searchQuery) filterDescriptions.push(`検索キーワード: ${filters.searchQuery}`)
    if (filters.department !== 'all') filterDescriptions.push(`部署: ${filters.department}`)
    if (filters.position !== 'all') filterDescriptions.push(`役職: ${filters.position}`)
    if (filters.status !== 'active') filterDescriptions.push(`ステータス: ${filters.status}`)
    if (filters.employeeType !== 'all') filterDescriptions.push(`雇用形態: ${filters.employeeType}`)

    return `【現在のページ】給与管理
【ページの説明】社員の給与明細をアップロード・管理するページです

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー（自分の給与のみ閲覧）'}

【現在適用されているフィルター】
${filterDescriptions.length > 0 ? filterDescriptions.join('\n') : 'フィルターなし（全社員表示）'}

【表示中の社員数】
- 全体: ${employees.length}名
- フィルター適用後: ${filteredEmployees.length}名

【利用可能な機能】
${isAdminOrHR ? `- 給与明細のアップロード（個別/一括）
- 給与データの編集・削除
- 全社員の給与データ閲覧
- 給与統計の確認` : `- 自分の給与明細の閲覧
- 給与履歴の確認`}

【このページで質問できること】
- 給与明細のアップロード方法
- 給与データの確認方法
- フィルター機能の使い方
- 一括アップロード機能について
- 給与計算の仕組み
- その他、給与管理に関する質問`
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">給与管理</h1>
            <p className="text-slate-600">社員をクリックして給与明細をアップロード</p>
          </div>
          <AIAskButton context={buildAIContext()} />
        </div>

        <SharedEmployeeFilters
          onFiltersChange={setFilters}
          showStatusFilter={true}
          showClearButton={true}
          placeholder="社員名、社員番号、部署、役職で検索..."
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isAdminOrHR && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-500 bg-blue-50"
              onClick={handleAllEmployeesClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-900 truncate">全員分</h3>
                    <p className="text-sm text-blue-700 truncate">全社員の給与管理</p>
                    <p className="text-xs text-blue-600 font-mono">管理者・総務専用</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEmployeeClick(employee)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{employee.name}</h3>
                    <p className="text-sm text-slate-600 truncate">{employee.department}</p>
                    <p className="text-xs text-slate-500 font-mono">{employee.employeeNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && !isAdminOrHR && (
          <div className="text-center py-12 text-slate-500">
            <p>該当する社員が見つかりません</p>
          </div>
        )}
      </div>

      <PayrollUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        employee={selectedEmployee}
        isAllEmployeesMode={isAllEmployeesMode}
      />
    </main>
  )
}
