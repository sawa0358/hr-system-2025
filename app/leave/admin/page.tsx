"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VacationStats } from "@yukyu-system/components/vacation-stats"
import { VacationList } from "@yukyu-system/components/vacation-list"
import { AIAskButton } from "@/components/ai-ask-button"
import { useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Play, Database } from "lucide-react"

export default function LeaveAdminPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { toast } = useToast()
  const initialView = useMemo(() => (params.get("view") === "all" ? "all" : "pending"), [params])
  const [view, setView] = useState<"pending" | "all">(initialView)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isGeneratingLots, setIsGeneratingLots] = useState(false)

  // 初期設定の投入
  const handleInitConfig = async () => {
    try {
      setIsInitializing(true)
      const res = await fetch('/api/vacation/config/init', {
        method: 'POST',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || '初期設定の投入に失敗しました')
      }

      const result = await res.json()
      toast({
        title: "初期設定完了",
        description: result.message || "デフォルト設定を投入し、有効化しました",
      })
    } catch (error: any) {
      console.error('初期設定投入エラー:', error)
      toast({
        title: "エラー",
        description: error?.message || '初期設定の投入に失敗しました',
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

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

        <div className="rounded-md bg-slate-50 p-3 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Input placeholder="社員名、社員番号、部署、役職で検索" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40"><SelectValue placeholder="雇用形態" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全雇用形態</SelectItem>
              <SelectItem value="regular">正社員</SelectItem>
              <SelectItem value="part">パート・アルバイト</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-36"><SelectValue placeholder="部署" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部署</SelectItem>
              <SelectItem value="sales">営業</SelectItem>
              <SelectItem value="dev">開発</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-36"><SelectValue placeholder="役職" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全役職</SelectItem>
              <SelectItem value="staff">一般</SelectItem>
              <SelectItem value="manager">管理職</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="on">
            <SelectTrigger className="w-28"><SelectValue placeholder="表示" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="on">表示ON</SelectItem>
              <SelectItem value="off">表示OFF</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="active">
            <SelectTrigger className="w-28"><SelectValue placeholder="在籍" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">在籍中</SelectItem>
              <SelectItem value="retired">退職</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2">
          <div className="flex gap-2">
            <Button variant={view === "pending" ? "default" : "outline"} onClick={() => { setView("pending"); router.replace("/leave/admin?view=pending") }}>承認待ち</Button>
            <Button variant={view === "all" ? "default" : "outline"} onClick={() => { setView("all"); router.replace("/leave/admin?view=all") }}>全社員</Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitConfig}
              disabled={isInitializing || isGeneratingLots}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  投入中...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  初期設定投入
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateLots}
              disabled={isInitializing || isGeneratingLots}
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
              onEmployeeClick={(id, name) => router.push(`/leave?employeeId=${id}&name=${encodeURIComponent(name)}`)}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


