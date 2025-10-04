"use client"

import { useState } from "react"
import { EmployeeTable } from "@/components/employee-table"
import { EmployeeFilters } from "@/components/employee-filters"
import { ExportMenu } from "@/components/export-menu"
import { EmployeeDetailDialog } from "@/components/employee-detail-dialog"
import { EvaluationDetailDialog } from "@/components/evaluation-detail-dialog"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function EmployeesPage() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [evaluationOpen, setEvaluationOpen] = useState(false)
  const [evaluationEmployee, setEvaluationEmployee] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">社員情報</h1>
            <p className="text-slate-600">社員の基本情報を管理(デフォルト: 在籍中のみ表示)</p>
          </div>
          <div className="flex gap-3">
            <AIAskButton context="社員情報" />
            <ExportMenu />
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddEmployee}>
              <Plus className="w-4 h-4 mr-2" />
              新規登録
            </Button>
          </div>
        </div>

        <EmployeeFilters />

        <div className="mt-6">
          <EmployeeTable 
            onEmployeeClick={handleEmployeeClick} 
            onEvaluationClick={handleEvaluationClick}
            refreshTrigger={refreshTrigger}
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
    </main>
  )
}
