"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VacationStats } from "@yukyu-system/components/vacation-stats"
import { VacationList } from "@yukyu-system/components/vacation-list"
import { AIAskButton } from "@/components/ai-ask-button"
import { EmployeeFilters } from "@/components/employee-filters"
import { useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play } from "lucide-react"

export default function LeaveAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { toast } = useToast()
  const initialView = useMemo(() => (params.get("view") === "all" ? "all" : "pending"), [params])
  const [view, setView] = useState<"pending" | "all">(initialView)
  const [isGeneratingLots, setIsGeneratingLots] = useState(false)
  const [filters, setFilters] = useState({
    searchQuery: "",
    department: "all",
    status: "active",
    employeeType: "all",
    position: "all",
    showInOrgChart: "all"
  })

  // 全社員の付与ロット生成
  const handleGenerateLots = async () => {
    if (!confirm('全社員の付与ロットを生成しますか？\n既存のロットがある場合は更新されます。')) {
      return
    }

    try {
      setIsGeneratingLots(true)
      const res = await fetch('/api/vacation/recalc/all', {
        method: 'POST',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || '付与ロットの生成に失敗しました')
      }

      const result = await res.json()
      const summary = result.summary || {}
      
      toast({
        title: "付与ロット生成完了",
        description: `成功: ${summary.success || 0}件、生成: ${summary.totalGenerated || 0}件、更新: ${summary.totalUpdated || 0}件`,
      })
    } catch (error: any) {
      console.error('付与ロット生成エラー:', error)
      toast({
        title: "エラー",
        description: error?.message || '付与ロットの生成に失敗しました',
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLots(false)
    }
  }

  const tabs = [
    { name: "社員", href: "/leave" },
    { name: "管理者", href: "/leave/admin" },
    { name: "設定", href: "/leave/settings" },
  ] as const

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">有給管理（管理者）</h1>
            <p className="text-slate-600">承認や全申請の確認、設定変更ができます</p>
          </div>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.name}
                variant={pathname === tab.href ? "default" : "outline"}
                onClick={() => router.push(tab.href)}
              >
                {tab.name}
              </Button>
            ))}
            <AIAskButton context="有給管理（管理者）画面に関する質問" />
          </div>
        </div>

        <VacationStats userRole="admin" />

        <EmployeeFilters 
          onFiltersChange={(newFilters) => {
            setFilters({
              searchQuery: newFilters.searchQuery,
              department: newFilters.department,
              status: newFilters.status,
              employeeType: newFilters.employeeType,
              position: newFilters.position,
              showInOrgChart: newFilters.showInOrgChart
            })
          }}
        />

        <div className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2">
          <div className="flex gap-2">
            <Button variant={view === "pending" ? "default" : "outline"} onClick={() => { setView("pending"); router.replace("/leave/admin?view=pending") }}>承認待ち</Button>
            <Button variant={view === "all" ? "default" : "outline"} onClick={() => { setView("all"); router.replace("/leave/admin?view=all") }}>全社員</Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateLots}
              disabled={isGeneratingLots}
            >
              {isGeneratingLots ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  全社員付与ロット生成
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <VacationList
              userRole="admin"
              filter={view === "pending" ? "pending" : "all"}
              filters={filters}
              onEmployeeClick={(id, name) => router.push(`/leave?employeeId=${id}&name=${encodeURIComponent(name)}`)}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


