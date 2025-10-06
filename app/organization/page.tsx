"use client"

import { useState, useRef } from "react"
import { OrganizationChart } from "@/components/organization-chart"
import { ExportMenu } from "@/components/export-menu"
import { EmployeeDetailDialog } from "@/components/employee-detail-dialog"
import { AIAskButton } from "@/components/ai-ask-button"

export default function OrganizationPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const orgChartRef = useRef<{ refresh: () => void }>(null)

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleOrgChartUpdate = () => {
    // 組織図を更新
    if (orgChartRef.current) {
      orgChartRef.current.refresh()
    }
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">組織図</h1>
            <p className="text-slate-600">組織構造の作成と閲覧</p>
          </div>
          <div className="flex gap-3">
            <AIAskButton context="組織図" />
            <ExportMenu />
          </div>
        </div>

        <OrganizationChart ref={orgChartRef} onEmployeeClick={handleEmployeeClick} />
      </div>

      <EmployeeDetailDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        employee={selectedEmployee}
        onOrgChartUpdate={handleOrgChartUpdate}
      />
    </main>
  )
}
