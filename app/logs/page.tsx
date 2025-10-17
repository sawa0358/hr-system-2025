"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { activityLogger, type ActivityLog } from "@/lib/activity-logger"
import { Search, Download, Trash2, FileText } from "lucide-react"
import { AIAskButton } from "@/components/ai-ask-button"

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const isAdmin = true

  useEffect(() => {
    setLogs(activityLogger.getLogs())
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesModule = filterModule === "all" || log.module === filterModule

    return matchesSearch && matchesModule
  })

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity_logs_${new Date().toISOString()}.json`
    link.click()
  }

  const handleClearLogs = () => {
    if (confirm("すべてのログを削除しますか？この操作は取り消せません。")) {
      activityLogger.clearLogs()
      setLogs([])
    }
  }

  const modules = ["all", "社員情報", "組織図", "タスク管理", "給与管理"]

  // AIに渡すコンテキスト情報を生成
  const getAIContext = () => {
    const totalLogs = logs.length
    const filteredLogsCount = filteredLogs.length
    const moduleStats = modules.slice(1).map(module => {
      const count = logs.filter(log => log.module === module).length
      return `${module}: ${count}件`
    }).join(', ')
    
    const recentLogs = filteredLogs.slice(0, 10).map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString("ja-JP"),
      user: log.userName,
      action: log.action,
      module: log.module,
      details: log.details
    }))

    return `【システムログ分析コンテキスト】

📊 ログ統計情報:
- 総ログ数: ${totalLogs}件
- 現在のフィルター結果: ${filteredLogsCount}件
- モジュール別統計: ${moduleStats}
- 検索クエリ: "${searchQuery || 'なし'}"
- フィルターモジュール: ${filterModule}

📝 最近のログ（最新10件）:
${recentLogs.map(log => 
  `• ${log.timestamp} | ${log.user} | ${log.module} | ${log.action}: ${log.details}`
).join('\n')}

🔍 利用可能な機能:
- ログの検索・フィルタリング
- モジュール別表示（社員情報、組織図、タスク管理、給与管理）
- ログのエクスポート
- ログのクリア

💡 AIアシスタントとして、ログデータの分析、傾向の把握、問題の特定、改善提案などをサポートできます。`
  }

  if (!isAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">このページは管理者のみアクセスできます</p>
        </div>
      </main>
    )
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">システムログ</h1>
            <p className="text-slate-600">すべての編集・変更履歴を表示</p>
          </div>
          <div className="flex gap-3">
            <AIAskButton context={getAIContext()} />
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
            <Button
              variant="outline"
              onClick={handleClearLogs}
              className="text-red-600 hover:text-red-700 bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ログをクリア
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="アクション、詳細、ユーザー名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのモジュール</SelectItem>
              {modules.slice(1).map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>ログがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredLogs.reverse().map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {log.module}
                          </Badge>
                          <span className="font-semibold text-slate-900">{log.action}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>ユーザー: {log.userName}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString("ja-JP")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-slate-500 text-center">合計 {filteredLogs.length} 件のログ</div>
      </div>
    </main>
  )
}
