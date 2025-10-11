"use client"

import { AIAskButton } from "@/components/ai-ask-button"
import { useAuth } from "@/lib/auth-context"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function LeavePage() {
  const { currentUser } = useAuth()

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    
    return `【現在のページ】有給管理（休暇管理）
【ページの説明】社員の有給休暇を管理するページです（現在開発中）

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー'}

【実装予定の機能】
- 社員ごとの有給残日数管理
- 有給申請・承認フロー
- 有給取得履歴の表示
- 有給消化率の分析
- カレンダー表示での有給管理

【現在の状態】
このページは現在開発中です。将来的に上記の機能が実装される予定です。

【このページで質問できること】
- 有給管理システムの概要
- 実装予定の機能について
- 有給休暇の制度について
- 有給申請の一般的な流れ
- その他、人事管理システム全般に関する質問`
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">有給管理</h1>
            <p className="text-slate-600">社員の有給休暇を管理</p>
          </div>
          <AIAskButton context={buildAIContext()} />
        </div>

        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">有給管理機能</h2>
                <p className="text-lg text-slate-600 mb-4">将来的に実装予定</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium text-amber-900 mb-1">実装予定の機能</p>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• 社員ごとの有給残日数管理</li>
                      <li>• 有給申請・承認フロー</li>
                      <li>• 有給取得履歴の表示</li>
                      <li>• 有給消化率の分析</li>
                      <li>• カレンダー表示での有給管理</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500">この機能は現在開発中です。実装までしばらくお待ちください。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
