"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  CalendarIcon,
  Tag,
  CheckSquare,
  Users,
  Palette,
  Plus,
  X,
  Edit2,
  Trash2,
  Upload,
  FileIcon,
  Download,
  Settings,
  Search,
  FileText,
  Archive,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { employees } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

interface Label {
  id: string
  name: string
  color: string
}

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

interface Member {
  id: string
  name: string
}

interface TaskFile {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
}

interface FileFolder {
  id: string
  name: string
  files: TaskFile[]
}

interface Task {
  id: string
  title: string
  description: string
  assignee: string
  dueDate: string
  priority: "low" | "medium" | "high"
  comments: number
  attachments: number
  status: string
  labels?: Label[]
  checklists?: Checklist[]
  members?: Member[]
  cardColor?: string
}

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
  onTaskUpdate?: (updatedTask: Task) => void
}

const PRESET_LABELS: Label[] = [
  { id: "label-1", name: "緊急", color: "#ef4444" },
  { id: "label-2", name: "重要", color: "#f59e0b" },
  { id: "label-3", name: "バグ", color: "#dc2626" },
  { id: "label-4", name: "機能追加", color: "#3b82f6" },
  { id: "label-5", name: "改善", color: "#10b981" },
  { id: "label-6", name: "ドキュメント", color: "#8b5cf6" },
]

const CARD_COLORS = [
  { name: "なし", value: "" },
  { name: "赤", value: "#fee2e2" },
  { name: "オレンジ", value: "#fed7aa" },
  { name: "黄", value: "#fef3c7" },
  { name: "緑", value: "#d1fae5" },
  { name: "青", value: "#dbeafe" },
  { name: "紫", value: "#e9d5ff" },
  { name: "ピンク", value: "#fce7f3" },
  { name: "グレー", value: "#f3f4f6" },
]

const PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
]

const STATUS_OPTIONS = [
  { value: "todo", label: "未着手" },
  { value: "in-progress", label: "進行中" },
  { value: "review", label: "レビュー" },
  { value: "done", label: "完了" },
]

export function TaskDetailDialog({ task, open, onOpenChange, onRefresh, onTaskUpdate }: TaskDetailDialogProps) {
  const { currentUser } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  
  // 締切日設定ハンドラー
  const handleSetDueDate = (date: Date | undefined) => {
    console.log("setDueDate called with:", date)
    setDueDate(date)
  }
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("todo")
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cardColor, setCardColor] = useState("")
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [showLabelSelector, setShowLabelSelector] = useState(false)
  const [customLabels, setCustomLabels] = useState<Label[]>(PRESET_LABELS)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")

  const [fileFolders, setFileFolders] = useState<FileFolder[]>([
    { id: "folder-1", name: "資料", files: [] },
    { id: "folder-2", name: "画像", files: [] },
  ])
  const [activeFileFolder, setActiveFileFolder] = useState(fileFolders[0].id)
  const [isAddingFileFolder, setIsAddingFileFolder] = useState(false)
  const [newFileFolderName, setNewFileFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const [showPriorityManager, setShowPriorityManager] = useState(false)
  const [showStatusManager, setShowStatusManager] = useState(false)
  const [priorityOptions, setPriorityOptions] = useState(PRIORITY_OPTIONS)
  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS)
  const [newPriorityLabel, setNewPriorityLabel] = useState("")
  const [newPriorityValue, setNewPriorityValue] = useState("")
  const [newStatusLabel, setNewStatusLabel] = useState("")
  const [newStatusValue, setNewStatusValue] = useState("")

  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false)
  const [showCalendarSelector, setShowCalendarSelector] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")

  const [isGoogleCalendarSynced, setIsGoogleCalendarSynced] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // タスクが変更されたときに状態を更新
  useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setPriority(task.priority || "medium")
      setStatus(task.status || "todo")
      setSelectedLabels(task.labels || [])
      setChecklists(task.checklists || [])
      
      // membersの構造を正しく処理
      const processedMembers = (task.members || []).map((member: any) => ({
        id: member.id || member.employee?.id || "",
        name: member.name || member.employee?.name || "未設定",
      }))
      setMembers(processedMembers)
      
      setCardColor(task.cardColor || "")
      
      // ファイル情報を復元
      if (task.attachments && Array.isArray(task.attachments)) {
        console.log("Restoring file folders from task:", task.attachments)
        setFileFolders(task.attachments)
        // アクティブフォルダを最初のフォルダに設定
        if (task.attachments.length > 0) {
          setActiveFileFolder(task.attachments[0].id)
        }
      } else {
        // デフォルトのフォルダ構造を設定
        const defaultFolders = [
          { id: "folder-1", name: "資料", files: [] },
          { id: "folder-2", name: "画像", files: [] },
        ]
        setFileFolders(defaultFolders)
        setActiveFileFolder(defaultFolders[0].id)
      }
      
      console.log("TaskDetailDialog - Task loaded:", task)
      console.log("TaskDetailDialog - Processed members:", processedMembers)
    }
  }, [task])

  const handleAddLabel = (label: Label) => {
    console.log("handleAddLabel called with:", label)
    console.log("Current selectedLabels:", selectedLabels)
    if (!selectedLabels.find((l) => l.id === label.id)) {
      const newLabels = [...selectedLabels, label]
      setSelectedLabels(newLabels)
      console.log("New selectedLabels:", newLabels)
    } else {
      console.log("Label already exists")
    }
  }

  const handleRemoveLabel = (labelId: string) => {
    setSelectedLabels(selectedLabels.filter((l) => l.id !== labelId))
  }

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      const newLabel: Label = {
        id: `label-${Date.now()}`,
        name: newLabelName,
        color: newLabelColor,
      }
      setCustomLabels([...customLabels, newLabel])
      setNewLabelName("")
      setNewLabelColor("#3b82f6")
    }
  }

  const handleDeleteLabel = (labelId: string) => {
    setCustomLabels(customLabels.filter((l) => l.id !== labelId))
    setSelectedLabels(selectedLabels.filter((l) => l.id !== labelId))
  }

  const handleAddChecklist = () => {
    const title = prompt("チェックリスト名を入力してください")
    if (title) {
      const newChecklist: Checklist = {
        id: `checklist-${Date.now()}`,
        title,
        items: [],
      }
      setChecklists([...checklists, newChecklist])
    }
  }

  const handleAddChecklistItem = (checklistId: string) => {
    const text = prompt("チェック項目を入力してください")
    if (text) {
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: [...checklist.items, { id: `item-${Date.now()}`, text, completed: false }],
              }
            : checklist,
        ),
      )
    }
  }

  const handleToggleChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists(
      checklists.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item,
              ),
            }
          : checklist,
      ),
    )
  }

  const handleDeleteChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists(
      checklists.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.filter((item) => item.id !== itemId),
            }
          : checklist,
      ),
    )
  }

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(checklists.filter((c) => c.id !== checklistId))
  }

  const handleAddMember = () => {
    const name = prompt("メンバー名を入力してください")
    if (name) {
      const newMember: Member = {
        id: `member-${Date.now()}`,
        name,
      }
      setMembers([...members, newMember])
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId))
  }

  const handleAddFileFolder = () => {
    if (newFileFolderName.trim()) {
      const newFolder: FileFolder = {
        id: `folder-${Date.now()}`,
        name: newFileFolderName,
        files: [],
      }
      setFileFolders([...fileFolders, newFolder])
      setActiveFileFolder(newFolder.id)
      setNewFileFolderName("")
      setIsAddingFileFolder(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileUpload = async (files: File[]) => {
    if (!currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    const currentFolder = fileFolders.find((f) => f.id === activeFileFolder)
    if (!currentFolder) return

    // ファイルを順次アップロード
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'task')
        formData.append('folderName', currentFolder.name)

        console.log("Uploading file:", file.name, "to folder:", currentFolder.name)

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-employee-id': currentUser.id,
          },
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          console.log("File uploaded successfully:", result)

          const newFile: TaskFile = {
            id: result.fileId,
            name: file.name,
            type: file.type,
            uploadDate: new Date().toISOString().split("T")[0],
            size: `${Math.round(file.size / 1024)}KB`,
          }

          setFileFolders(
            fileFolders.map((folder) =>
              folder.id === activeFileFolder 
                ? { ...folder, files: [...folder.files, newFile] } 
                : folder,
            ),
          )
        } else {
          const error = await response.json()
          console.error("File upload failed:", error)
          alert(`ファイルアップロードに失敗しました: ${error.error}`)
        }
      } catch (error) {
        console.error("File upload error:", error)
        alert(`ファイルアップロードに失敗しました: ${file.name}`)
      }
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    try {
      console.log("Deleting file:", fileId)

      const response = await fetch(`/api/files/${fileId}/delete`, {
        method: 'DELETE',
        headers: {
          'x-employee-id': currentUser.id,
        },
      })

      if (response.ok) {
        console.log("File deleted successfully")
        setFileFolders(
          fileFolders.map((folder) =>
            folder.id === activeFileFolder 
              ? { ...folder, files: folder.files.filter((f) => f.id !== fileId) } 
              : folder,
          ),
        )
      } else {
        const error = await response.json()
        console.error("File deletion failed:", error)
        alert(`ファイル削除に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error("File deletion error:", error)
      alert("ファイル削除に失敗しました")
    }
  }

  const handleAddPriority = () => {
    if (newPriorityLabel.trim() && newPriorityValue.trim()) {
      setPriorityOptions([...priorityOptions, { value: newPriorityValue, label: newPriorityLabel }])
      setNewPriorityLabel("")
      setNewPriorityValue("")
    }
  }

  const handleDeletePriority = (value: string) => {
    setPriorityOptions(priorityOptions.filter((p) => p.value !== value))
  }

  const handleAddStatus = () => {
    if (newStatusLabel.trim() && newStatusValue.trim()) {
      setStatusOptions([...statusOptions, { value: newStatusValue, label: newStatusLabel }])
      setNewStatusLabel("")
      setNewStatusValue("")
    }
  }

  const handleDeleteStatus = (value: string) => {
    setStatusOptions(statusOptions.filter((s) => s.value !== value))
  }

  const handleAddEmployee = (employee: any) => {
    if (!members.find((m) => m.id === employee.id)) {
      setMembers([...members, { id: employee.id, name: employee.name }])
    }
    setShowEmployeeSelector(false)
    setEmployeeSearch("")
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.position.toLowerCase().includes(employeeSearch.toLowerCase()),
  )

  const handleGoogleCalendarSync = () => {
    setIsGoogleCalendarSynced(!isGoogleCalendarSynced)
    console.log("[v0] Google Calendar sync:", !isGoogleCalendarSynced ? "enabled" : "disabled")
  }

  const handleMakeTemplate = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    try {
      const templateData = {
        title: `${title} (テンプレート)`,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority,
        labels: selectedLabels,
        checklists,
        cardColor,
        isTemplate: true,
      }

      console.log("Creating template:", templateData)
      // テンプレートデータをlocalStorageに保存
      const templates = JSON.parse(localStorage.getItem('cardTemplates') || '[]')
      templates.push({
        id: `template-${Date.now()}`,
        ...templateData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      })
      localStorage.setItem('cardTemplates', JSON.stringify(templates))
      
      alert("テンプレートとして保存しました")
    } catch (error) {
      console.error("Error creating template:", error)
      alert("テンプレートの保存に失敗しました")
    }
  }

  const handleArchive = () => {
    setIsArchived(true)
    console.log("[v0] Archiving task:", task?.title)
    alert("タスクをアーカイブしました。後から呼び出すことができます。")
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    setIsSaving(true)
    try {
      const requestBody = {
        title: title || "",
        description: description || "",
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority: priority || "medium",
        status: status || "todo",
        labels: selectedLabels || [],
        checklists: checklists || [],
        cardColor: cardColor || "",
        isArchived: isArchived || false,
        members: members || [],
        attachments: fileFolders || [], // ファイル情報を追加
      }
      
      console.log("Sending card update request:", {
        cardId: task.id,
        userId: currentUser.id,
        requestBody
      })

      const response = await fetch(`/api/cards/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUser.id,
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Card saved successfully:", result)
        
        // 保存されたカードデータでローカル状態を更新
        if (result.card) {
          // レスポンスからメンバー情報を正しく処理
          const processedMembers = (result.card.members || []).map((member: any) => ({
            id: member.employee?.id || member.id || "",
            name: member.employee?.name || member.name || "未設定",
          }))

          setTitle(result.card.title || "")
          setDescription(result.card.description || "")
          setDueDate(result.card.dueDate ? new Date(result.card.dueDate) : undefined)
          setPriority(result.card.priority || "medium")
          setStatus(result.card.status || "todo")
          setSelectedLabels(result.card.labels || [])
          setChecklists(result.card.checklists || [])
          setMembers(processedMembers)
          setCardColor(result.card.cardColor || "")
          
          // ファイル情報も更新
          if (result.card.attachments && Array.isArray(result.card.attachments)) {
            setFileFolders(result.card.attachments)
          }
          
          // 親コンポーネントに更新されたタスクを通知
          if (onTaskUpdate && task) {
            const updatedTask: Task = {
              id: task.id,
              title: result.card.title || "",
              description: result.card.description || "",
              assignee: processedMembers[0]?.name || task.assignee,
              dueDate: result.card.dueDate || "",
              priority: result.card.priority || "medium",
              comments: task.comments,
              attachments: result.card.attachments || task.attachments,
              status: result.card.status || "todo",
              cardColor: result.card.cardColor || "",
              labels: result.card.labels || [],
              members: processedMembers,
              checklists: result.card.checklists || task.checklists || [],
            }
            onTaskUpdate(updatedTask)
          }
        }
        
        if (onRefresh) {
          onRefresh()
        }
        onOpenChange(false)
      } else {
        const error = await response.json()
        console.error("Failed to save card:", error)
        console.error("Response status:", response.status)
        console.error("Error details:", error.details || error.error)
        alert(`保存に失敗しました: ${error.error || error.details || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("Error saving card:", error)
      alert("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    if (confirm("このタスクを削除してもよろしいですか？")) {
      try {
        const response = await fetch(`/api/cards/${task.id}`, {
          method: "DELETE",
          headers: {
            "x-employee-id": currentUser.id,
          },
        })

        if (response.ok) {
          console.log("Task deleted successfully")
          if (onRefresh) {
            onRefresh()
          }
          onOpenChange(false)
        } else {
          const error = await response.json()
          console.error("Failed to delete card:", error)
          alert(`削除に失敗しました: ${error.error}`)
        }
      } catch (error) {
        console.error("Error deleting card:", error)
        alert("削除に失敗しました")
      }
    }
  }

  if (!task) return null

  const currentFileFolder = fileFolders.find((f) => f.id === activeFileFolder)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: cardColor || "white" }}
      >
        <DialogHeader>
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              placeholder="タスク名"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Labels Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                ラベル
              </label>
              <Button variant="ghost" size="sm" onClick={() => setShowLabelManager(!showLabelManager)}>
                <Edit2 className="w-3 h-3 mr-1" />
                管理
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedLabels.map((label) => (
                <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white">
                  {label.name}
                  <button onClick={() => handleRemoveLabel(label.id)} className="ml-1 hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              type="button"
              onClick={() => setShowLabelSelector(true)}
              className="pointer-events-auto"
            >
              <Plus className="w-3 h-3 mr-1" />
              ラベルを追加
            </Button>

            {showLabelManager && (
              <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                <h4 className="font-medium mb-3">ラベル管理</h4>
                <div className="space-y-2 mb-3">
                  {customLabels.map((label) => (
                    <div key={label.id} className="flex items-center justify-between">
                      <Badge style={{ backgroundColor: label.color }} className="text-white">
                        {label.name}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLabel(label.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="ラベル名"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                  />
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Button onClick={handleCreateLabel}>追加</Button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">説明</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="タスクの詳細を入力..."
              rows={4}
            />
          </div>

          {/* Due Date with Google Calendar Sync */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              締切日
            </label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 justify-start bg-transparent pointer-events-auto"
                type="button"
                onClick={() => setShowCalendarSelector(true)}
              >
                {dueDate ? format(dueDate, "PPP", { locale: ja }) : "日付を選択"}
              </Button>
              <Button
                variant={isGoogleCalendarSynced ? "default" : "outline"}
                onClick={handleGoogleCalendarSync}
                className="whitespace-nowrap"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {isGoogleCalendarSynced ? "Google連携中" : "Google連携"}
              </Button>
            </div>
            {isGoogleCalendarSynced && (
              <p className="text-xs text-green-600 mt-2">✓ Googleカレンダーと同期されています</p>
            )}
          </div>

          {/* Priority and Status with Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">重要度</label>
                <Button variant="ghost" size="sm" onClick={() => setShowPriorityManager(!showPriorityManager)}>
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showPriorityManager && (
                <div className="mt-3 p-3 border rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2 text-sm">重要度管理</h4>
                  <div className="space-y-2 mb-3">
                    {priorityOptions.map((option) => (
                      <div key={option.value} className="flex items-center justify-between text-sm">
                        <span>{option.label}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePriority(option.value)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="表示名"
                      value={newPriorityLabel}
                      onChange={(e) => setNewPriorityLabel(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="値"
                      value={newPriorityValue}
                      onChange={(e) => setNewPriorityValue(e.target.value)}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleAddPriority}>
                      追加
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">状態</label>
                <Button variant="ghost" size="sm" onClick={() => setShowStatusManager(!showStatusManager)}>
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showStatusManager && (
                <div className="mt-3 p-3 border rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2 text-sm">状態管理</h4>
                  <div className="space-y-2 mb-3">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center justify-between text-sm">
                        <span>{option.label}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteStatus(option.value)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="表示名"
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="値"
                      value={newStatusValue}
                      onChange={(e) => setNewStatusValue(e.target.value)}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleAddStatus}>
                      追加
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members with Employee Selector */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              メンバー
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {(member.name || "未").slice(0, 3)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                  <button onClick={() => handleRemoveMember(member.id)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEmployeeSelector(true)}>
              <Plus className="w-3 h-3 mr-1" />
              メンバーを追加
            </Button>

            {showEmployeeSelector && (
              <div className="mt-3 p-4 border rounded-lg bg-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">社員を選択</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowEmployeeSelector(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="名前、部署、役職で検索..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => handleAddEmployee(employee)}
                      className="w-full text-left p-3 rounded hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                          {(employee.name || "未").slice(0, 3)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-slate-500">
                          {employee.department} / {employee.position}
                        </p>
                      </div>
                    </button>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">該当する社員が見つかりません</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Checklists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                チェックリスト
              </label>
              <Button variant="outline" size="sm" onClick={handleAddChecklist}>
                <Plus className="w-3 h-3 mr-1" />
                チェックリストを追加
              </Button>
            </div>
            <div className="space-y-4">
              {checklists.map((checklist) => {
                const completedCount = checklist.items.filter((item) => item.completed).length
                const totalCount = checklist.items.length
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

                return (
                  <div key={checklist.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{checklist.title}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteChecklist(checklist.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>{Math.round(progress)}%</span>
                        <span>
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleChecklistItem(checklist.id, item.id)}
                          />
                          <span className={`flex-1 text-sm ${item.completed ? "line-through text-slate-500" : ""}`}>
                            {item.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChecklistItem(checklist.id, item.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddChecklistItem(checklist.id)}
                      className="mt-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      項目を追加
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              ファイル
            </label>
            <Tabs value={activeFileFolder} onValueChange={setActiveFileFolder}>
              <div className="flex items-center gap-2 mb-3">
                <TabsList className="flex-1 justify-start overflow-x-auto">
                  {fileFolders.map((folder) => (
                    <TabsTrigger key={folder.id} value={folder.id}>
                      {folder.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {!isAddingFileFolder ? (
                  <Button variant="outline" size="sm" onClick={() => setIsAddingFileFolder(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    フォルダ追加
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="フォルダ名"
                      value={newFileFolderName}
                      onChange={(e) => setNewFileFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFileFolder()}
                      className="w-32 h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddFileFolder}>
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingFileFolder(false)
                        setNewFileFolderName("")
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {fileFolders.map((folder) => (
                <TabsContent key={folder.id} value={folder.id} className="space-y-3">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 mb-2">ファイルをドラッグ&ドロップ</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || [])
                          handleFileUpload(files)
                        }
                        input.click()
                      }}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      ファイルを選択
                    </Button>
                  </div>

                  {folder.files.length > 0 && (
                    <div className="space-y-2">
                      {folder.files.map((file) => (
                        <Card key={file.id} className="border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileIcon className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {file.uploadDate} • {file.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm">
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.id)}>
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Card Color */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              カードの色
            </label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setCardColor(color.value)}
                  className={`w-16 h-10 rounded border-2 ${
                    cardColor === color.value ? "border-blue-600" : "border-slate-300"
                  }`}
                  style={{ backgroundColor: color.value || "white" }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Archive Section */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleArchive}
              className="w-full gap-2 text-slate-600 hover:text-slate-900 bg-transparent"
            >
              <Archive className="w-4 h-4" />
              アーカイブする（後から呼び出せます）
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </Button>
              <Button variant="outline" onClick={handleMakeTemplate} className="gap-2 bg-transparent">
                <FileText className="w-4 h-4" />
                テンプレート化する
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* ラベル選択ダイアログ */}
      <Dialog open={showLabelSelector} onOpenChange={setShowLabelSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ラベルを選択</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {customLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => {
                  console.log("Label selected:", label)
                  handleAddLabel(label)
                  setShowLabelSelector(false)
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 flex items-center justify-between transition-colors border border-slate-200"
              >
                <Badge style={{ backgroundColor: label.color }} className="text-white text-sm">
                  {label.name}
                </Badge>
                {selectedLabels.find(l => l.id === label.id) && (
                  <span className="text-sm text-green-600">✓ 選択済み</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLabelSelector(false)}>
              キャンセル
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* カレンダー選択ダイアログ */}
      <Dialog open={showCalendarSelector} onOpenChange={setShowCalendarSelector}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>締切日を選択</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <Calendar 
              mode="single" 
              selected={dueDate} 
              onSelect={(date) => {
                console.log("Calendar date selected:", date)
                handleSetDueDate(date)
                setShowCalendarSelector(false)
              }} 
              locale={ja}
              className="rounded-md border"
            />
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => {
                  handleSetDueDate(undefined)
                  setShowCalendarSelector(false)
                }}
                className="flex-1"
              >
                クリア
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCalendarSelector(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
