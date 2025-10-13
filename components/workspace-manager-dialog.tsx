"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, Plus, Users, Settings, Trash2 } from "lucide-react"

interface Employee {
  id: string
  name: string
  email?: string
  department?: string
  position?: string
  role?: string
  isInvisibleTop?: boolean
}

interface WorkspaceMember {
  id: string
  employeeId: string
  role: string
  employee: Employee
}

interface Workspace {
  id?: string
  name: string
  description?: string
  members?: WorkspaceMember[]
}

interface WorkspaceManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace?: Workspace | null
  employees: Employee[]
  onSave: (data: {
    name: string
    description: string
    memberIds: string[]
  }) => void
  onDelete?: () => void
  canDelete?: boolean
}

export function WorkspaceManagerDialog({
  open,
  onOpenChange,
  workspace,
  employees,
  onSave,
  onDelete,
  canDelete = false,
}: WorkspaceManagerDialogProps) {
  const [name, setName] = useState(workspace?.name || "")
  const [description, setDescription] = useState(workspace?.description || "")
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    workspace?.members?.map((m) => m.employeeId) || [],
  )
  const [searchQuery, setSearchQuery] = useState("")

  // ダイアログが開いたときに最新のworkspace情報で状態を更新
  useEffect(() => {
    if (open && workspace) {
      setName(workspace.name || "")
      setDescription(workspace.description || "")
      setSelectedMembers(workspace.members?.map((m) => m.employeeId) || [])
      setSearchQuery("")
    } else if (open && !workspace) {
      // 新規作成の場合
      setName("")
      setDescription("")
      setSelectedMembers([])
      setSearchQuery("")
    }
  }, [open, workspace])

  const handleReset = () => {
    setName(workspace?.name || "")
    setDescription(workspace?.description || "")
    setSelectedMembers(workspace?.members?.map((m) => m.employeeId) || [])
    setSearchQuery("")
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert("ワークスペース名を入力してください")
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      memberIds: selectedMembers,
    })

    onOpenChange(false)
    handleReset()
  }

  const handleClose = () => {
    onOpenChange(false)
    handleReset()
  }

  const toggleMember = (employeeId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    )
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      !emp.isInvisibleTop && // 見えないTOP社員を除外
      (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {workspace?.id ? `ワークスペースを編集: "${workspace.name}"` : "新しいワークスペースを作成"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="basic">
              <Settings className="w-4 h-4 mr-2" />
              基本情報
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              メンバー ({selectedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 overflow-y-auto flex-1">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                {workspace?.id ? "新しいワークスペース名 *" : "ワークスペース名 *"}
                {workspace?.id && (
                  <span className="text-xs text-slate-500 ml-2">
                    (現在: "{workspace.name}")
                  </span>
                )}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: エンジニアリングチーム"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                説明
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ワークスペースの説明を入力..."
                rows={4}
                className="mt-1"
              />
            </div>

            {workspace?.id && canDelete && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  ワークスペースを削除
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4 overflow-y-auto flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="名前、部署、役職で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className={`cursor-pointer transition-colors ${
                    selectedMembers.includes(employee.id)
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => toggleMember(employee.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedMembers.includes(employee.id)}
                        onCheckedChange={() => toggleMember(employee.id)}
                      />
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                          {employee.name.slice(0, 3)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900">{employee.name}</p>
                        <p className="text-xs text-slate-500">
                          {employee.department} / {employee.position}
                        </p>
                      </div>
                      {employee.role && (
                        <Badge variant="secondary" className="text-xs">
                          {employee.role === "admin"
                            ? "管理者"
                            : employee.role === "hr"
                              ? "総務"
                              : employee.role === "manager"
                                ? "マネージャー"
                                : employee.role === "store_manager"
                                  ? "店長"
                                  : employee.role === "sub_manager"
                                    ? "サブマネ"
                                    : employee.role === "general"
                                      ? "一般"
                                      : "閲覧"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredEmployees.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">該当する社員が見つかりません</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {workspace?.id ? "保存" : "作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

