"use client"

import { AIAskButton } from "@/components/ai-ask-button"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function LeavePage() {
  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">有給管理</h1>
            <p className="text-slate-600">社員の有給休暇を管理</p>
          </div>
          <AIAskButton context="有給管理" />
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
