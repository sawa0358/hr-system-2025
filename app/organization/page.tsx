"use client"

import { useState, useRef } from "react"
import { OrganizationChart } from "@/components/organization-chart"
import { EmployeeDetailDialog } from "@/components/employee-detail-dialog"
import { useAuth } from "@/lib/auth-context"

export default function OrganizationPage() {
  const { currentUser } = useAuth()
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const orgChartRef = useRef<{ refresh: () => void }>(null)

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setIsDialogOpen(true)
  }

  const handleOrgChartUpdate = () => {
    console.log('組織ページ: 組織図更新が要求されました')
    // 組織図を更新
    if (orgChartRef.current) {
      console.log('組織ページ: 組織図のrefreshを呼び出します')
      orgChartRef.current.refresh()
    } else {
      console.error('組織ページ: orgChartRef.currentがnullです')
    }
  }

  return (
    <main className="h-screen overflow-hidden">
      <OrganizationChart ref={orgChartRef} onEmployeeClick={handleEmployeeClick} />

      <EmployeeDetailDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        employee={selectedEmployee}
        onOrgChartUpdate={handleOrgChartUpdate}
      />
    </main>
  )
}
