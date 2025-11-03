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
        {/* PCでは右上にボタンを配置、モバイルではカード内に配置 */}
        <div className="relative">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">ダッシュボード</h1>
                <p className="text-slate-600">システムの概要と最新情報を確認できます</p>
              </div>
              {/* モバイル用：説明文の下に表示 */}
              <Button 
                onClick={() => setShowPermissionMatrix(true)} 
                variant="outline" 
                className="gap-2 mt-4 md:hidden w-full"
              >
                <Shield className="w-4 h-4" />
                権限一覧表
              </Button>
            </div>
          </div>
          {/* PC用：右上に配置 */}
          <div className="hidden md:block absolute top-0 right-0">
            <Button 
              onClick={() => setShowPermissionMatrix(true)} 
              variant="outline" 
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              権限一覧表
            </Button>
          </div>
        </div>
      </div>

      {/* お知らせセクションを外側の枠まで広げる */}
      <div className="bg-emerald-50/30 -mx-6 px-6 py-6 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto">
          <BulletinBoard isAdmin={permissions.manageAnnouncements} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <PermissionMatrix open={showPermissionMatrix} onOpenChange={setShowPermissionMatrix} />
      </div>
    </main>
  )
}
