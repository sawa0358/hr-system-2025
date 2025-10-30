"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Settings } from "lucide-react"
import { VacationRequestForm } from "@/components/vacation-request-form"
import { VacationList } from "@/components/vacation-list"
import { VacationStats } from "@/components/vacation-stats"
import { EmployeeSearch } from "@/components/employee-search"
import Link from "next/link"

export default function VacationManagementSystem() {
  const [userRole, setUserRole] = useState<"employee" | "admin">("employee")
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null)

  const handleEmployeeClick = (employeeId: number, employeeName: string) => {
    setSelectedEmployee({ id: employeeId, name: employeeName })
    setUserRole("employee")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">有給休暇管理システム</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee ? `${selectedEmployee.name}の申請状況` : "Vacation Management System"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={userRole === "employee" ? "default" : "outline"}
                onClick={() => {
                  setUserRole("employee")
                  setSelectedEmployee(null)
                }}
              >
                従業員
              </Button>
              <Button
                variant={userRole === "admin" ? "default" : "outline"}
                onClick={() => {
                  setUserRole("admin")
                  setSelectedEmployee(null)
                }}
              >
                管理者
              </Button>
              {userRole === "admin" && (
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Settings className="h-4 w-4" />
                    設定
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <VacationStats userRole={userRole} />

        {userRole === "admin" && (
          <div className="mt-6">
            <EmployeeSearch />
          </div>
        )}

        <div className="mt-8">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">{userRole === "employee" ? "申請一覧" : "承認待ち"}</TabsTrigger>
              <TabsTrigger value="new">{userRole === "employee" ? "新規申請" : "全申請"}</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-6">
              <VacationList userRole={userRole} filter="pending" onEmployeeClick={handleEmployeeClick} />
            </TabsContent>

            <TabsContent value="new" className="mt-6">
              {userRole === "employee" ? (
                <VacationRequestForm />
              ) : (
                <VacationList userRole={userRole} filter="all" onEmployeeClick={handleEmployeeClick} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
