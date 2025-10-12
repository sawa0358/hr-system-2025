"use client"

import { useState, useRef } from "react"
import { OrganizationChart } from "@/components/organization-chart"
import { EmployeeDetailDialog } from "@/components/employee-detail-dialog"
import { AIAskButton } from "@/components/ai-ask-button"
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

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    
    return `【現在のページ】組織図
【ページの説明】会社の組織構造を視覚的に表示・管理するページです

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー（閲覧のみ）'}

【組織図の機能】
- 階層構造での社員表示
- 上司-部下の関係性の可視化
- 部署ごとの組織構造
- 社員カードのクリックで詳細情報表示

【利用可能な操作】
${isAdminOrHR ? `- 組織構造の編集
- 社員の配置変更
- 上司の設定
- 部署の管理` : `- 組織図の閲覧
- 社員情報の確認`}

【このページで質問できること】
- 組織図の見方
- 部署構成について
- 役職の階層について
- 社員の配置変更方法
- 上司-部下関係の設定方法
- エクスポート機能の使い方
- その他、組織管理に関する質問`
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
            <AIAskButton context={buildAIContext()} />
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
