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
    employeeType: "all",
    showInOrgChart: "1"
  })
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAllEmployeesMode, setIsAllEmployeesMode] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 社員データを取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
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
      } finally {
        setIsLoading(false)
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

    // 見えないTOP社員は管理者のみに表示（社員情報ページと同じロジック）
    const isInvisibleTop = emp.isInvisibleTop || emp.employeeNumber === '000'
    if (isInvisibleTop) {
      return currentUser?.role === 'admin'
    }

    // ステータスフィルター（社員情報ページと同じロジック）
    let matchesStatus = true
    if (filters.status === 'active') {
      // 「在籍中」フィルターの場合、コピー社員は除外する
      matchesStatus = emp.status === 'active'
    } else if (filters.status !== 'all') {
      matchesStatus = emp.status === filters.status
    } else {
      // 「全ステータス」の場合でも、デフォルトではコピー社員は除外する
      // コピー社員を見たい場合は明示的に「コピー社員」フィルターを選択する必要がある
      matchesStatus = emp.status !== 'copy'
    }

    // ステータスフィルターで除外された場合は早期リターン
    if (!matchesStatus) {
      return false
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

    // システム使用状態のフィルタリング
    const isManager = currentUser?.role === 'manager'
    
    let matchesSystemStatus = true
    if (!isAdminOrHR && !isManager) {
      // 一般ユーザーはシステム使用ONの社員のみ表示
      matchesSystemStatus = emp.role && emp.role !== ''
    }

    // 組織図表示フィルター
    const matchesOrgChart = filters.showInOrgChart === "all" || 
      (filters.showInOrgChart === "1" && emp.showInOrgChart) ||
      (filters.showInOrgChart === "0" && !emp.showInOrgChart)

    return matchesSearch && matchesDepartment && matchesPosition && matchesStatus && matchesType && matchesSystemStatus && matchesOrgChart
  }).sort((a, b) => {
    // 五十音順（ふりがながあればふりがな、なければ名前）でソート
    const aName = (a.furigana || a.name).toLowerCase()
    const bName = (b.furigana || b.name).toLowerCase()
    return aName.localeCompare(bName, 'ja')
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
            <p className="text-slate-600">社員をクリックして給与明細を管理</p>
          </div>
          <AIAskButton context={buildAIContext()} />
        </div>

        {isAdminOrHR && (
          <SharedEmployeeFilters
            onFiltersChange={setFilters}
            showStatusFilter={true}
            showClearButton={true}
            placeholder="社員名、社員番号、部署、役職で検索..."
            className="mb-6"
            style={{ backgroundColor: '#b4d5e7' }}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">社員データを読み込み中...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isAdminOrHR && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-500 bg-blue-50"
                onClick={handleAllEmployeesClick}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-blue-900 truncate">全員分</h3>
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
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback 
                      employeeType={employee.employeeType}
                      className="text-blue-700 font-semibold text-xs whitespace-nowrap overflow-hidden"
                    >
                      {(() => {
                        const text = typeof window !== 'undefined'
                          ? (localStorage.getItem(`employee-avatar-text-${employee.id}`) || (employee.name || '未').slice(0, 3))
                          : (employee.name || '未').slice(0, 3)
                        return text.slice(0, 3)
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{employee.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{employee.department} / {employee.employeeNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}

            {filteredEmployees.length === 0 && !isAdminOrHR && (
              <div className="text-center py-12 text-slate-500">
                <p>該当する社員が見つかりません</p>
              </div>
            )}
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