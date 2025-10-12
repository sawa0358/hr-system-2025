"use client"

import { useState, useEffect, useCallback } from "react"
import { EmployeeTable } from "@/components/employee-table"
import { EmployeeFilters } from "@/components/employee-filters"
import { EmployeeDetailDialog } from "@/components/employee-detail-dialog"
import { EvaluationDetailDialog } from "@/components/evaluation-detail-dialog"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"

export default function EmployeesPage() {
  const { currentUser, isAuthenticated, login } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
    } else {
      setShowLoginModal(false)
    }
  }, [isAuthenticated])
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [evaluationOpen, setEvaluationOpen] = useState(false)
  const [evaluationEmployee, setEvaluationEmployee] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [filters, setFilters] = useState({
    searchQuery: "",
    department: "all",
    status: "active",
    employeeType: "all",
    position: "all"
  })

  // 管理者・総務権限のチェック
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  const handleAddEmployee = () => {
    setSelectedEmployee(null)
    setDetailOpen(true)
  }

  const handleEmployeeClick = (employee: any) => {
    console.log('社員クリック:', employee)
    console.log('社員ID:', employee?.id)
    console.log('社員名:', employee?.name)
    
    // 古いIDを検出して警告
    if (employee?.id && employee.id.includes('cmganegqz')) {
      console.error('古いIDが検出されました:', employee.id)
      alert('ページを再読み込みしてください。古いデータが検出されました。')
      window.location.reload()
      return
    }
    
    setSelectedEmployee(employee)
    setDetailOpen(true)
  }

  const handleEvaluationClick = (employee: any) => {
    setEvaluationEmployee(employee)
    setEvaluationOpen(true)
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const filterDescriptions = []
    if (filters.searchQuery) filterDescriptions.push(`検索キーワード: ${filters.searchQuery}`)
    if (filters.department !== 'all') filterDescriptions.push(`部署: ${filters.department}`)
    if (filters.status !== 'active') filterDescriptions.push(`ステータス: ${filters.status}`)
    if (filters.employeeType !== 'all') filterDescriptions.push(`雇用形態: ${filters.employeeType}`)
    if (filters.position !== 'all') filterDescriptions.push(`役職: ${filters.position}`)

    return `【現在のページ】社員情報管理
【ページの説明】社員の基本情報を管理するページです（デフォルト: 在籍中のみ表示）

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー（閲覧のみ）'}

【現在適用されているフィルター】
${filterDescriptions.length > 0 ? filterDescriptions.join('\n') : 'フィルターなし（全社員表示）'}

【利用可能な機能】
${isAdminOrHR ? `- 新規社員登録
- 社員情報の編集
- 社員情報のエクスポート
- 社員詳細の閲覧
- 評価情報の確認` : `- 社員詳細の閲覧
- 評価情報の確認`}

【このページで質問できること】
- 社員データの見方や操作方法
- フィルター機能の使い方
- 社員登録・編集の手順
- エクスポート機能の使い方
- その他、人事管理システム全般に関する質問`
  }

  const handleLoginSuccess = (employee: any, rememberMe: boolean) => {
    // 認証コンテキストのlogin関数を呼び出し
    login(employee, rememberMe)
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">読み込み中...</p>
          </div>
        </div>
        <LoginModal 
          open={showLoginModal} 
          onLoginSuccess={handleLoginSuccess} 
        />
      </>
    )
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">社員情報</h1>
            <p className="text-slate-600">社員の基本情報を管理(デフォルト: 在籍中のみ表示)</p>
          </div>
          {isAdminOrHR && (
            <div className="flex gap-3">
              <AIAskButton context={buildAIContext()} />
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddEmployee}>
                <Plus className="w-4 h-4 mr-2" />
                新規登録
              </Button>
            </div>
          )}
        </div>

        <EmployeeFilters onFiltersChange={handleFiltersChange} />

        <div className="mt-6">
          <EmployeeTable 
            onEmployeeClick={handleEmployeeClick} 
            onEvaluationClick={handleEvaluationClick}
            refreshTrigger={refreshTrigger}
            filters={filters}
          />
        </div>
      </div>

      <EmployeeDetailDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
        employee={selectedEmployee}
        onRefresh={handleRefresh}
      />

      {evaluationEmployee && (
        <EvaluationDetailDialog open={evaluationOpen} onOpenChange={setEvaluationOpen} employee={evaluationEmployee} />
      )}

      <LoginModal 
        open={showLoginModal} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </main>
  )
}
