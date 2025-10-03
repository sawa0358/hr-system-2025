"use client"

import { ExportMenu } from "@/components/export-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockEmployees } from "@/lib/mock-data"
import { useState } from "react"
import { EvaluationDetailDialog } from "@/components/evaluation-detail-dialog"

export default function EvaluationsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof mockEmployees)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const activeEmployees = mockEmployees.filter((emp) => emp.status === "active")

  const handleEmployeeClick = (employee: (typeof mockEmployees)[0]) => {
    setSelectedEmployee(employee)
    setIsDialogOpen(true)
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">評価制度</h1>
            <p className="text-slate-600">社員の目標・評価を管理</p>
          </div>
          <ExportMenu />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
              onClick={() => handleEmployeeClick(employee)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{employee.name}</h3>
                    <p className="text-sm text-slate-600">{employee.position}</p>
                    <p className="text-xs text-slate-500 mt-1">{employee.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedEmployee && (
        <EvaluationDetailDialog employee={selectedEmployee} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}
    </main>
  )
}
