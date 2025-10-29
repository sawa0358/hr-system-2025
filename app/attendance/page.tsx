"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AIAskButton } from "@/components/ai-ask-button"
import { Users, Upload, FileText, X, ChevronDown, ChevronUp } from "lucide-react"
// import { mockEmployees } from "@/lib/mock-data" // フォールバックとして使用しない
import { AttendanceUploadDialog } from "@/components/attendance-upload-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { SharedEmployeeFilters } from "@/components/shared-employee-filters"

export default function AttendancePage() {
  const { currentUser } = useAuth()
  const [filters, setFilters] = useState({
    searchQuery: "",
    department: "all",
    position: "all",
    status: "active",
    employeeType: "all",
    showInOrgChart: "1"
  })
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAllEmployeesMode, setIsAllEmployeesMode] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string; employees: string[]; content?: string | ArrayBuffer; type?: string; isBinary?: boolean }[]>([])
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false)
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 社員データを取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
        } else {
          console.error('社員データの取得に失敗しました')
          setEmployees([])
        }
      } catch (error) {
        console.error('社員データの取得エラー:', error)
        setEmployees([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter((emp) => {
    // 権限チェック: 総務・管理者以外は自分のデータのみ表示
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    if (!isAdminOrHR) {
      // 自分以外のデータは表示しない
      if (emp.id !== currentUser?.id) {
        return false
      }
    }

    // 見えないTOP社員は管理者のみに表示（社員情報ページと同じロジック）
    const isInvisibleTop = emp.isInvisibleTop || emp.employeeNumber === '000'
    if (isInvisibleTop) {
      return currentUser?.role === 'admin'
    }

    // ステータスフィルター（社員情報ページと同じロジック）
    let matchesStatus = true
    if (filters.status === 'active') {
      // 「在籍中」フィルターの場合、コピー社員は除外する
      matchesStatus = emp.status === 'active'
    } else if (filters.status !== 'all') {
      matchesStatus = emp.status === filters.status
    } else {
      // 「全ステータス」の場合でも、デフォルトではコピー社員は除外する
      // コピー社員を見たい場合は明示的に「コピー社員」フィルターを選択する必要がある
      matchesStatus = emp.status !== 'copy'
    }

    // ステータスフィルターで除外された場合は早期リターン
    if (!matchesStatus) {
      return false
    }

    // 休職・退職・停止中の社員はマネージャー・総務・管理者のみに表示
    const isManagerOrHR = currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
    const isInactive = emp.status === 'leave' || emp.status === 'retired' || emp.status === 'suspended' || emp.isSuspended
    if (isInactive) {
      return isManagerOrHR
    }

    // フリーワード検索（複数の組織名・部署・役職も含む）
    let matchesSearch = true
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      // 複数の組織名・部署・役職を配列として取得
      const departments = Array.isArray(emp.departments) ? emp.departments : [emp.department]
      const positions = Array.isArray(emp.positions) ? emp.positions : [emp.position]
      const organizations = Array.isArray(emp.organizations) ? emp.organizations : [emp.organization]
      
      const searchableText = [
        emp.name,
        emp.employeeNumber || emp.employeeId,
        ...departments,
        ...positions,
        ...organizations,
        emp.email,
        emp.phone
      ].join(' ').toLowerCase()
      
      matchesSearch = searchableText.includes(query)
    }

    // 雇用形態フィルター
    const matchesType = filters.employeeType === "all" || emp.employeeType === filters.employeeType

    // 部署フィルター（複数の部署も含む）
    const matchesDepartment = filters.department === "all" || (() => {
      const departments = Array.isArray(emp.departments) ? emp.departments : [emp.department]
      return departments.includes(filters.department)
    })()

    // 役職フィルター（複数の役職も含む）
    const matchesPosition = filters.position === "all" || (() => {
      const positions = Array.isArray(emp.positions) ? emp.positions : [emp.position]
      return positions.includes(filters.position)
    })()

    // システム使用状態のフィルタリング
    const isManager = currentUser?.role === 'manager'
    
    let matchesSystemStatus = true
    if (!isAdminOrHR && !isManager) {
      // 一般ユーザーはシステム使用ONの社員のみ表示
      matchesSystemStatus = emp.role && emp.role !== ''
    }

    // 組織図表示フィルター
    const matchesOrgChart = filters.showInOrgChart === "all" || 
      (filters.showInOrgChart === "1" && emp.showInOrgChart) ||
      (filters.showInOrgChart === "0" && !emp.showInOrgChart)

    return matchesSearch && matchesDepartment && matchesPosition && matchesStatus && matchesType && matchesSystemStatus && matchesOrgChart
  }).sort((a, b) => {
    // 五十音順（ふりがながあればふりがな、なければ名前）でソート
    const aName = (a.furigana || a.name).toLowerCase()
    const bName = (b.furigana || b.name).toLowerCase()
    return aName.localeCompare(bName, 'ja')
  })

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setIsAllEmployeesMode(false)
    setIsUploadDialogOpen(true)
    setIsTemplateExpanded(false) // テンプレートセクションを閉じる
  }

  const handleAllEmployeesClick = () => {
    setSelectedEmployee({ name: "全員分", employeeNumber: "ALL", department: "全部署" })
    setIsAllEmployeesMode(true)
    setIsUploadDialogOpen(true)
    setIsTemplateExpanded(false) // テンプレートセクションを閉じる
  }

  // テンプレートファイルの保存・読み込み
  const saveTemplatesToStorage = (templates: { id: string; name: string; employees: string[]; content?: string | ArrayBuffer; type?: string; isBinary?: boolean }[]) => {
    if (typeof window !== 'undefined') {
      // ArrayBufferをBase64エンコードしてJSON保存可能にする
      const serializableTemplates = templates.map(template => {
        if (template.isBinary && template.content instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(template.content)
          const binaryString = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('')
          const base64Content = btoa(binaryString)
          return {
            ...template,
            content: base64Content
          }
        }
        return template
      })
      
      localStorage.setItem('attendance-templates', JSON.stringify(serializableTemplates))
      // カスタムイベントを発火してS3に自動保存
      window.dispatchEvent(new CustomEvent('attendanceTemplatesChanged'))
    }
  }

  const loadTemplatesFromStorage = (): { id: string; name: string; employees: string[]; content?: string | ArrayBuffer; type?: string; isBinary?: boolean }[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('attendance-templates')
      if (stored) {
        const templates = JSON.parse(stored)
        // Base64エンコードされたArrayBufferを復元
        return templates.map((template: any) => {
          if (template.isBinary && template.content && typeof template.content === 'string') {
            try {
              const binaryString = atob(template.content)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              template.content = bytes.buffer
            } catch (error) {
              console.error('ArrayBuffer復元エラー:', error)
            }
          }
          return template
        })
      }
      return []
    }
    return []
  }

  // コンポーネント初期化時にテンプレートを読み込み
  useEffect(() => {
    const loadedTemplates = loadTemplatesFromStorage()
    setTemplates(loadedTemplates)
  }, [])


  const handleTemplateDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingTemplate(true)
    setIsTemplateExpanded(true) // ドラッグ中はセクションを開く
  }

  const handleTemplateDragLeave = () => {
    setIsDraggingTemplate(false)
  }

  const handleTemplateDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingTemplate(false)
    setIsTemplateExpanded(true) // ドロップ後もセクションを開いたまま
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      // ファイルの内容を読み込んで保存
      const reader = new FileReader()
      reader.onload = (event) => {
        const fileContent = event.target?.result
        const newTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          employees: [],
          content: fileContent, // ArrayBufferまたはstringのまま保存
          type: file.type,
          isBinary: file.type.startsWith('application/') && !file.type.includes('text') && !file.type.includes('json')
        }
        const updatedTemplates = [...templates, newTemplate]
        setTemplates(updatedTemplates)
        saveTemplatesToStorage(updatedTemplates)
      }
      // バイナリファイルの場合はArrayBufferとして読み込み、テキストファイルの場合はテキストとして読み込み
      if (file.type.startsWith('application/') && !file.type.includes('text') && !file.type.includes('json')) {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const handleTemplateFileSelect = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = ".xlsx,.xls,.pdf,.csv"
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      files.forEach((file) => {
        // ファイルの内容を読み込んで保存
        const reader = new FileReader()
        reader.onload = (event) => {
          const fileContent = event.target?.result
          const newTemplate = {
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            employees: [],
            content: fileContent, // ArrayBufferまたはstringのまま保存
            type: file.type,
            isBinary: file.type.startsWith('application/') && !file.type.includes('text') && !file.type.includes('json')
          }
          const updatedTemplates = [...templates, newTemplate]
          setTemplates(updatedTemplates)
          saveTemplatesToStorage(updatedTemplates)
        }
        // バイナリファイルの場合はArrayBufferとして読み込み、テキストファイルの場合はテキストとして読み込み
        if (file.type.startsWith('application/') && !file.type.includes('text') && !file.type.includes('json')) {
          reader.readAsArrayBuffer(file)
        } else {
          reader.readAsText(file)
        }
      })
    }
    input.click()
  }

  const removeTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId)
    setTemplates(updatedTemplates)
    saveTemplatesToStorage(updatedTemplates)
    // カスタムイベントを発火してS3に自動保存
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('attendanceTemplatesChanged'))
    }
  }

  // 現在のユーザーの権限を取得
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const filterDescriptions = []
    if (filters.searchQuery) filterDescriptions.push(`検索キーワード: ${filters.searchQuery}`)
    if (filters.department !== 'all') filterDescriptions.push(`部署: ${filters.department}`)
    if (filters.position !== 'all') filterDescriptions.push(`役職: ${filters.position}`)
    if (filters.status !== 'active') filterDescriptions.push(`ステータス: ${filters.status}`)
    if (filters.employeeType !== 'all') filterDescriptions.push(`雇用形態: ${filters.employeeType}`)

    return `【現在のページ】勤怠管理
【ページの説明】社員の勤怠データをアップロード・管理するページです

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${isAdminOrHR ? '管理者/総務（全機能利用可）' : '一般ユーザー（閲覧のみ）'}

【現在適用されているフィルター】
${filterDescriptions.length > 0 ? filterDescriptions.join('\n') : 'フィルターなし（全社員表示）'}

【表示中の社員数】
- 全体: ${employees.length}名
- フィルター適用後: ${filteredEmployees.length}名

【利用可能な機能】
${isAdminOrHR ? `- 勤怠データのアップロード（個別/一括）
- テンプレートの管理
- 勤怠記録の編集・削除
- 全社員の勤怠データ閲覧` : `- 自分の勤怠データの閲覧
- 勤怠記録の確認`}

【このページで質問できること】
- 勤怠データのアップロード方法
- テンプレートの使い方
- 勤怠記録の確認方法
- フィルター機能の使い方
- 一括アップロード機能について
- その他、勤怠管理に関する質問`
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">勤怠管理</h1>
            <p className="text-slate-600">社員をクリックして勤怠データを管理</p>
          </div>
          <AIAskButton context={buildAIContext()} />
        </div>

        {isAdminOrHR && (
          <div className="rounded-xl border border-slate-200 shadow-sm mb-6" style={{ backgroundColor: '#b4d5e7' }}>
            <div 
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">共通テンプレート</h2>
                <p className="text-sm text-slate-600">勤怠管理用のテンプレートをアップロード・管理（総務・管理者のみ）</p>
              </div>
              {isTemplateExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>

            {isTemplateExpanded && (
              <div className="px-4 pb-4">
                {/* ドラッグドロップエリア */}
                <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-4 ${
                isDraggingTemplate ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
              }`}
              onDragOver={handleTemplateDragOver}
              onDragLeave={handleTemplateDragLeave}
              onDrop={handleTemplateDrop}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-600 text-sm mb-1">テンプレートファイルをドラッグ&ドロップ</p>
              <p className="text-xs text-slate-500 mb-2">または</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTemplateFileSelect}
                className="text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                ファイルを選択
              </Button>
              <p className="text-xs text-slate-500 mt-2">対応形式: Excel, PDF, CSV</p>
            </div>

            {/* テンプレート一覧（コンパクト表示） */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900 text-sm">アップロード済みテンプレート</h3>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-slate-900">{template.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTemplate(template.id)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}
          </div>
        )}

        {isAdminOrHR && (
          <SharedEmployeeFilters
            onFiltersChange={setFilters}
            showStatusFilter={true}
            showClearButton={true}
            placeholder="社員名、社員番号、部署、役職で検索..."
            className="mb-6"
            style={{ backgroundColor: '#b4d5e7' }}
          />
        )}


        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">社員データを読み込み中...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isAdminOrHR && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-500 bg-blue-50"
                onClick={handleAllEmployeesClick}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-blue-900 truncate">全員分</h3>
                      <p className="text-xs text-blue-600 font-mono">管理者・総務専用</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEmployeeClick(employee)}
            >
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback 
                      employeeType={employee.employeeType}
                      className="text-blue-700 font-semibold text-xs"
                    >
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{employee.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{employee.department} / {employee.employeeNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}

            {filteredEmployees.length === 0 && !isAdminOrHR && (
              <div className="text-center py-12 text-slate-500">
                <p>該当する社員が見つかりません</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AttendanceUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        employee={selectedEmployee}
        isAllEmployeesMode={isAllEmployeesMode}
      />
    </main>
  )
}
