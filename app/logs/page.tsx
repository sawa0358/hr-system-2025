"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { activityLogger, type ActivityLog } from "@/lib/activity-logger"
import { Search, Download, Trash2, FileText, FileSpreadsheet, FileText as FileTextIcon, FileImage } from "lucide-react"
import { AIAskButton } from "@/components/ai-ask-button"
import { usePermissions } from "@/hooks/use-permissions"

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const { hasPermission, role } = usePermissions()
  
  // ログ表示権限チェック（総務・管理者のみ）
  const canViewLogs = hasPermission("viewLogs")

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

  // CSV形式でエクスポート
  const handleExportCSV = () => {
    const headers = ["日時", "ユーザー", "モジュール", "アクション", "詳細", "重要度", "ブラウザ"]
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString("ja-JP"),
        `"${log.userName}"`,
        `"${log.module}"`,
        `"${log.action}"`,
        `"${log.details.replace(/"/g, '""')}"`, // CSV用にエスケープ
        `"${log.severity || 'info'}"`,
        `"${log.userAgent ? log.userAgent.split(' ')[0] : ''}"`
      ].join(","))
    ].join("\n")

    const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // JSON形式でエクスポート（既存）
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity_logs_${new Date().toISOString()}.json`
    link.click()
  }

  // TSV形式でエクスポート
  const handleExportTSV = () => {
    const headers = ["日時", "ユーザー", "モジュール", "アクション", "詳細", "重要度", "ブラウザ"]
    const tsvContent = [
      headers.join("\t"),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString("ja-JP"),
        log.userName,
        log.module,
        log.action,
        log.details,
        log.severity || 'info',
        log.userAgent ? log.userAgent.split(' ')[0] : ''
      ].join("\t"))
    ].join("\n")

    const dataBlob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.tsv`
    link.click()
  }

  // PDF形式でエクスポート
  const handleExportPDF = () => {
    // HTMLテーブルを作成
    const createTableHTML = () => {
      const tableRows = filteredLogs.map(log => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; border-right: 1px solid #ddd;">${new Date(log.timestamp).toLocaleString("ja-JP")}</td>
          <td style="padding: 8px; border-right: 1px solid #ddd;">${log.userName}</td>
          <td style="padding: 8px; border-right: 1px solid #ddd;">${log.module}</td>
          <td style="padding: 8px; border-right: 1px solid #ddd;">${log.action}</td>
          <td style="padding: 8px; border-right: 1px solid #ddd;">${log.details}</td>
          <td style="padding: 8px; border-right: 1px solid #ddd; color: ${
            log.severity === 'error' ? '#dc2626' : 
            log.severity === 'warning' ? '#d97706' : 
            log.severity === 'security' ? '#7c3aed' : '#059669'
          };">${log.severity === 'error' ? 'エラー' :
               log.severity === 'warning' ? '警告' :
               log.severity === 'security' ? 'セキュリティ' : '情報'}</td>
          <td style="padding: 8px;">${log.userAgent ? log.userAgent.split(' ')[0] : ''}</td>
        </tr>
      `).join('')

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>システムログレポート</title>
          <style>
            body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #3b82f6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
            td { padding: 8px; border-right: 1px solid #ddd; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>システムログレポート</h1>
          <div class="summary">
            <p><strong>生成日時:</strong> ${new Date().toLocaleString("ja-JP")}</p>
            <p><strong>総ログ数:</strong> ${filteredLogs.length}件</p>
            <p><strong>フィルター:</strong> ${filterModule === 'all' ? 'すべて' : filterModule} ${searchQuery ? `(検索: "${searchQuery}")` : ''}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>日時</th>
                <th>ユーザー</th>
                <th>モジュール</th>
                <th>アクション</th>
                <th>詳細</th>
                <th>重要度</th>
                <th>ブラウザ</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            <p>HRシステム - システムログレポート</p>
          </div>
        </body>
        </html>
      `
    }

    // 新しいウィンドウでPDFを生成
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(createTableHTML())
      printWindow.document.close()
      
      // 少し待ってから印刷ダイアログを開く
      setTimeout(() => {
        printWindow.print()
        // 印刷後、ウィンドウを閉じる（ユーザーがキャンセルした場合も含む）
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }
  }

  const handleClearLogs = () => {
    if (confirm("すべてのログを削除しますか？この操作は取り消せません。")) {
      activityLogger.clearLogs()
      setLogs([])
    }
  }

  const modules = ["all", "社員情報", "組織図", "タスク管理", "給与管理", "認証", "セキュリティ"]

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

  if (!canViewLogs) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">アクセス権限がありません</h2>
          <p className="text-slate-600 mb-4">
            このページは総務・管理者のみアクセスできます
          </p>
          <p className="text-sm text-slate-500">
            現在の権限: {role === 'hr' ? '総務' : role === 'admin' ? '管理者' : role}
          </p>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV} className="text-green-600 hover:text-green-700">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportTSV} className="text-blue-600 hover:text-blue-700">
                <FileTextIcon className="w-4 h-4 mr-2" />
                TSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="text-red-600 hover:text-red-700">
                <FileImage className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportJSON} className="text-purple-600 hover:text-purple-700">
                <FileText className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
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
                          {log.severity && (
                            <Badge 
                              variant={log.severity === 'error' ? 'destructive' : 
                                      log.severity === 'warning' ? 'secondary' : 
                                      log.severity === 'security' ? 'outline' : 'default'}
                              className="text-xs"
                            >
                              {log.severity === 'error' ? 'エラー' :
                               log.severity === 'warning' ? '警告' :
                               log.severity === 'security' ? 'セキュリティ' : '情報'}
                            </Badge>
                          )}
                          <span className="font-semibold text-slate-900">{log.action}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{log.details}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>ユーザー: {log.userName}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString("ja-JP")}</span>
                          {log.userAgent && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs" title={log.userAgent}>
                                ブラウザ: {log.userAgent.split(' ')[0]}
                              </span>
                            </>
                          )}
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
