"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VacationStats } from "@yukyu-system/components/vacation-stats"
import { VacationList } from "@yukyu-system/components/vacation-list"
import { VacationRequestForm } from "@yukyu-system/components/vacation-request-form"

export default function LeaveEmployeeDetailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const name = params.get("name") || "従業員"
  const employeeId = params.get("employeeId") || undefined

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{name} の有給管理</h1>
            <p className="text-slate-600">管理者プレビュー（UIのみ）</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>戻る</Button>
            <Button onClick={() => router.push("/leave/admin")}>管理者</Button>
          </div>
        </div>

        <VacationStats userRole="employee" employeeId={employeeId || undefined} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1"><VacationRequestForm /></div>
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <VacationList userRole="employee" filter="all" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}


