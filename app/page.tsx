"use client"

import { useState } from "react"
import { BulletinBoard } from "@/components/bulletin-board"
import { PermissionMatrix } from "@/components/permission-matrix"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

export default function DashboardPage() {
  const { permissions } = usePermissions()
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false)

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">ダッシュボード</h1>
            <p className="text-slate-600">システムの概要と最新情報を確認できます</p>
          </div>
          <Button onClick={() => setShowPermissionMatrix(true)} variant="outline" className="gap-2">
            <Shield className="w-4 h-4" />
            権限一覧表
          </Button>
        </div>


        <div className="bg-emerald-50/30 p-6 rounded-xl border border-emerald-100">
          <BulletinBoard isAdmin={permissions.manageAnnouncements} />
        </div>

        <PermissionMatrix open={showPermissionMatrix} onOpenChange={setShowPermissionMatrix} />
      </div>
    </main>
  )
}
