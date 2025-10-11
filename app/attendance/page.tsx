"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AIAskButton } from "@/components/ai-ask-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Upload, FileText } from "lucide-react"
import { mockEmployees } from "@/lib/mock-data"
import { AttendanceUploadDialog } from "@/components/attendance-upload-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function AttendancePage() {
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [department, setDepartment] = useState("all")
  const [status, setStatus] = useState("active")
  const [employeeType, setEmployeeType] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAllEmployeesMode, setIsAllEmployeesMode] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [templates, setTemplates] = useState<{ id: string; name: string; employees: string[] }[]>([
    { id: "1", name: "共通テンプレート1", employees: [] },
    { id: "2", name: "共通テンプレート2", employees: [] },
  ])

  // 社員データを取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
        } else {
          console.error('社員データの取得に失敗しました')
          // フォールバック: モックデータを使用
          setEmployees(mockEmployees)
        }
      } catch (error) {
        console.error('社員データの取得エラー:', error)
        // フォールバック: モックデータを使用
        setEmployees(mockEmployees)
      }
    }

    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment = department === "all" || emp.department === department
    const matchesStatus = status === "all" || emp.status === status
    const matchesType = employeeType === "all" || emp.employeeType === employeeType

    // システム使用状態のフィルタリング
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    const isManager = currentUser?.role === 'manager'
    
    let matchesSystemStatus = true
    if (!isAdminOrHR && !isManager) {
      // 一般ユーザーはシステム使用ONの社員のみ表示
      matchesSystemStatus = emp.role && emp.role !== ''
    }

    return matchesSearch && matchesDepartment && matchesStatus && matchesType && matchesSystemStatus
  })

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee)
    setIsAllEmployeesMode(false)
    setIsUploadDialogOpen(true)
  }

  const handleAllEmployeesClick = () => {
    setSelectedEmployee({ name: "全員分", employeeNumber: "ALL", department: "全部署" })
    setIsAllEmployeesMode(true)
    setIsUploadDialogOpen(true)
  }

  const handleTemplateUpload = () => {
    alert("テンプレートファイルをアップロードしました")
  }

  const handleTemplateClick = (template: any) => {
    alert(`${template.name}を開きました`)
  }

  // Mock user role - in real app, this would come from auth context
  const userRole = "admin" // or "hr" or "employee"
  const isAdminOrHR = userRole === "admin" || userRole === "hr"

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const filterDescriptions = []
    if (searchQuery) filterDescriptions.push(`検索キーワード: ${searchQuery}`)
    if (department !== 'all') filterDescriptions.push(`部署: ${department}`)
    if (status !== 'active') filterDescriptions.push(`ステータス: ${status}`)
    if (employeeType !== 'all') filterDescriptions.push(`雇用形態: ${employeeType}`)

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
            <p className="text-slate-600">社員をクリックして勤怠データをアップロード</p>
          </div>
          <AIAskButton context={buildAIContext()} />
        </div>

        {isAdminOrHR && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">共通テンプレート</h2>
                <p className="text-sm text-slate-600">勤怠管理用のテンプレートをアップロード・管理</p>
              </div>
              <Button onClick={handleTemplateUpload} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                テンプレート追加
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-slate-200"
                  onClick={() => handleTemplateClick(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{template.name}</h3>
                        <p className="text-xs text-slate-500">
                          {template.employees.length > 0 ? `${template.employees.length}名登録済み` : "未登録"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="社員名、社員番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={employeeType} onValueChange={setEmployeeType}>
              <SelectTrigger>
                <SelectValue placeholder="雇用形態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="employee">社員</SelectItem>
                <SelectItem value="contractor">外注</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="部署" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部署</SelectItem>
                <SelectItem value="engineering">エンジニアリング</SelectItem>
                <SelectItem value="sales">営業</SelectItem>
                <SelectItem value="marketing">マーケティング</SelectItem>
                <SelectItem value="hr">人事</SelectItem>
                <SelectItem value="finance">経理</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ステータス</SelectItem>
                <SelectItem value="active">在籍中</SelectItem>
                <SelectItem value="leave">休職中</SelectItem>
                <SelectItem value="retired">退職</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isAdminOrHR && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-500 bg-blue-50"
              onClick={handleAllEmployeesClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-900 truncate">全員分</h3>
                    <p className="text-sm text-blue-700 truncate">全社員の勤怠管理</p>
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{employee.name}</h3>
                    <p className="text-sm text-slate-600 truncate">{employee.department}</p>
                    <p className="text-xs text-slate-500 font-mono">{employee.employeeNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && !isAdminOrHR && (
          <div className="text-center py-12 text-slate-500">
            <p>該当する社員が見つかりません</p>
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
