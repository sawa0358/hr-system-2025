"use client"

import { AIAskButton } from "@/components/ai-ask-button"
import { useAuth } from "@/lib/auth-context"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { VacationRequestForm } from "@yukyu-system/components/vacation-request-form"
import { VacationList } from "@yukyu-system/components/vacation-list"
import { VacationStats } from "@yukyu-system/components/vacation-stats"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

export default function LeavePage() {
  const { currentUser } = useAuth()

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    
    return `【現在のページ】有給管理（休暇管理）
【ページの説明】社員の有給休暇を管理するページです

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー'}

【利用可能な機能】
- 社員ごとの有給残日数管理
- 有給申請・承認フロー
- 有給取得履歴の表示
- 有給消化率の分析

【このページで質問できること】
- 有給管理システムの概要
- 有給休暇の制度について
- 有給申請の一般的な流れ
- その他、人事管理システム全般に関する質問`
  }

  // 社員トップ（/leave）は常に社員用UIを表示する
  const userRole: 'employee' | 'admin' = 'employee'

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  
  // employeeIdパラメータを取得（管理者が特定社員の画面を見る場合）
  const employeeIdParam = params.get("employeeId")
  const employeeNameParam = params.get("name")
  
  // 表示する社員IDを決定（パラメータがあればそれを使用、なければ自分のID）
  const displayEmployeeId = employeeIdParam || currentUser?.id
  const displayEmployeeName = employeeNameParam || currentUser?.name || "従業員"
  
  // 管理者が他の社員の画面を見ているかどうか
  const isViewingOtherEmployee = employeeIdParam && employeeIdParam !== currentUser?.id
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  
  // マネージャー・総務・管理者権限の判定（AIに聞くボタン表示用）
  const canUseAI = currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
  // 店長・マネージャー以上が「ほか一覧」を表示可能
  const canViewOthersList = currentUser?.role === 'manager' || currentUser?.role === 'store_manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
  
  // 総務・管理者権限の場合は、employeeIdパラメータがない場合に自動的に管理者画面にリダイレクト
  useEffect(() => {
    if (isAdminOrHR && !employeeIdParam) {
      router.replace('/leave/admin')
    }
  }, [isAdminOrHR, employeeIdParam, router])
  
  const initialTab = useMemo(() => (params.get("tab") === "form" ? "form" : params.get("tab") === "others" ? "others" : "list"), [params])
  const [tab, setTab] = useState<"list" | "form" | "others">(initialTab)

  const tabs = [
    { 
      name: "社員", 
      href: "/leave",
      show: false // 社員の有給管理画面を開いている時は非表示（全権限者対象）
    },
    { 
      name: "管理者", 
      href: "/leave/admin",
      show: isAdminOrHR
    },
    { 
      name: "設定", 
      href: "/leave/settings",
      show: isAdminOrHR
    },
  ].filter(tab => tab.show)

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-8" style={{ backgroundColor: '#f2f6f9' }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isViewingOtherEmployee ? `${displayEmployeeName} の有給管理` : `${displayEmployeeName}さんの有給管理`}
            </h1>
            <p className="text-slate-600">
              {isViewingOtherEmployee ? "管理者プレビュー" : "社員の有給休暇を管理"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.name}
                variant={pathname === tab.href ? "default" : "outline"}
                onClick={() => router.push(tab.href)}
              >
                {tab.name}
              </Button>
            ))}
            {canUseAI && <AIAskButton context={buildAIContext()} />}
          </div>
        </div>

        {/* 管理者が他の社員の画面を見ている場合は戻るボタンを表示 */}
        {isViewingOtherEmployee && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => router.push("/leave/admin")}>
              管理者画面に戻る
            </Button>
          </div>
        )}

        <VacationStats userRole={userRole} employeeId={displayEmployeeId} />

        <div className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2">
          <div className="flex gap-2">
            <Button 
              variant={tab === "list" ? "default" : "outline"} 
              onClick={() => { 
                setTab("list"); 
                const params = new URLSearchParams()
                if (employeeIdParam) params.set("employeeId", employeeIdParam)
                if (employeeNameParam) params.set("name", employeeNameParam)
                params.set("tab", "list")
                router.replace(`/leave?${params.toString()}`)
              }}
            >
              申請一覧
            </Button>
            {/* ほか一覧ボタン（店長・マネージャー以上が表示可能） */}
            {canViewOthersList && (
              <Button 
                variant={tab === "others" ? "default" : "outline"} 
                onClick={() => { 
                  setTab("others"); 
                  const params = new URLSearchParams()
                  if (employeeIdParam) params.set("employeeId", employeeIdParam)
                  if (employeeNameParam) params.set("name", employeeNameParam)
                  params.set("tab", "others")
                  router.replace(`/leave?${params.toString()}`)
                }}
              >
                ほか一覧
              </Button>
            )}
            {/* 新規申請ボタン（管理者でも表示） */}
            <Button 
              variant={tab === "form" ? "default" : "outline"} 
              onClick={() => { 
                setTab("form"); 
                const params = new URLSearchParams()
                if (employeeIdParam) params.set("employeeId", employeeIdParam)
                if (employeeNameParam) params.set("name", employeeNameParam)
                params.set("tab", "form")
                router.replace(`/leave?${params.toString()}`)
              }}
            >
              {isViewingOtherEmployee ? "代理申請" : "新規申請"}
            </Button>
          </div>
          <div>
            {tab === "form" && (
              <Button form="vacation-request-form" type="submit">申請を送信</Button>
            )}
          </div>
        </div>

        {tab === "form" ? (
          <div className="max-w-3xl">
            {isViewingOtherEmployee && (
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-900">
                    <strong>{displayEmployeeName}</strong> に代わって代理申請を行います。
                  </p>
                </CardContent>
              </Card>
            )}
            <VacationRequestForm 
              proxyEmployeeId={isViewingOtherEmployee ? displayEmployeeId : undefined}
              onSuccess={() => {
                // 申請成功後、申請一覧タブに切り替える（リロードしない）
                setTab("list")
                const params = new URLSearchParams()
                if (employeeIdParam) params.set("employeeId", employeeIdParam)
                if (employeeNameParam) params.set("name", employeeNameParam)
                params.set("tab", "list")
                router.replace(`/leave?${params.toString()}`)
                // VacationStatsとVacationListを再読み込みさせるため、キーを更新
                setTimeout(() => {
                  window.dispatchEvent(new Event('vacation-request-updated'))
                }, 100)
              }}
            />
          </div>
        ) : tab === "others" ? (
            // ほか一覧：管理者モードのカード表示のみ
            <Card style={{ backgroundColor: '#b4d5e7' }}>
              <CardContent className="p-6" style={{ backgroundColor: 'transparent' }}>
                <VacationList 
                  userRole="admin" 
                  filter="pending"
                  onEmployeeClick={(id, name) => router.push(`/leave?employeeId=${id}&name=${encodeURIComponent(name)}`)}
                />
              </CardContent>
            </Card>
        ) : (
            <Card style={{ backgroundColor: '#b4d5e7' }}>
              <CardContent className="p-6" style={{ backgroundColor: 'transparent' }}>
                <VacationList 
                  userRole={userRole} 
                  filter={"all"}
                  employeeId={displayEmployeeId} // 表示する社員IDを渡す
                />
              </CardContent>
            </Card>
        )}
      </div>
    </main>
  )
}
