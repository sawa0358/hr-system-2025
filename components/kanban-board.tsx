"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Plus, ChevronLeft, ChevronRight, FileText, LayoutGrid, List, GripVertical, MoreHorizontal, Edit, Trash2, Palette } from "lucide-react"
import { format, parseISO } from "date-fns"
import { taskTemplates } from "@/lib/mock-data"
import { checkListPermissions, getPermissionErrorMessage } from "@/lib/permissions"
import { TaskDetailDialog } from "./task-detail-dialog"

// 18色のカラーパレット（段階的配色）
const COLOR_PALETTE = [
  // 基本色
  { name: "白", value: "#ffffff", category: "basic" },
  { name: "黒", value: "#000000", category: "basic" },
  { name: "グレー", value: "#6b7280", category: "basic" },
  
  // 赤系統
  { name: "赤", value: "#ef4444", category: "red" },
  { name: "ローズ", value: "#f43f5e", category: "red" },
  { name: "ピンク", value: "#ec4899", category: "red" },
  
  // オレンジ系統
  { name: "オレンジ", value: "#f97316", category: "orange" },
  { name: "アンバー", value: "#f59e0b", category: "orange" },
  { name: "イエロー", value: "#eab308", category: "orange" },
  
  // 緑系統
  { name: "緑", value: "#22c55e", category: "green" },
  { name: "エメラルド", value: "#10b981", category: "green" },
  { name: "ティール", value: "#14b8a6", category: "green" },
  
  // 青系統
  { name: "青", value: "#3b82f6", category: "blue" },
  { name: "インディゴ", value: "#6366f1", category: "blue" },
  { name: "バイオレット", value: "#8b5cf6", category: "blue" },
  
  // 紫系統
  { name: "パープル", value: "#a855f7", category: "purple" },
  { name: "フューシャ", value: "#d946ef", category: "purple" },
  { name: "ライラック", value: "#e879f9", category: "purple" },
]

// ヘックスカラーをRGBAに変換する関数
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// リスト色用（薄い色調）
const LIST_COLORS = COLOR_PALETTE.map(color => ({
  name: color.name,
  value: color.value === "#ffffff" ? "#ffffff" : 
         color.value === "#000000" ? "#f1f5f9" : 
         color.value === "#6b7280" ? "#e5e7eb" : 
         hexToRgba(color.value, 0.15) // 透明度15%を適用して薄くする
}))
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Task {
  id: string
  title: string
  description: string
  assignee: string
  members?: { id: string; name: string; email?: string }[]
  dueDate: string
  priority: "low" | "medium" | "high"
  comments: number
  attachments: number
  status: string
  cardColor?: string
  labels?: { id: string; name: string; color: string }[]
  checklists?: any[]
  isArchived?: boolean
  boardId?: string
}

interface KanbanList {
  id: string
  title: string
  taskIds: string[]
  color?: string
}

function CompactTaskCard({ task, onClick, isDragging }: { task: Task; onClick: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        // カスタム重要度の場合は大文字小文字を調整
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-1"
    >
      <Card
        className={`shadow-sm hover:shadow-md transition-shadow ${
          task.isArchived ? "border-gray-300 opacity-70" : "border-slate-200"
        }`}
        style={{ 
          backgroundColor: task.isArchived 
            ? "#f3f4f6" 
            : (task.cardColor && task.cardColor !== "" ? task.cardColor : "white")
        }}
      >
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200/50 rounded transition-colors flex-shrink-0"
              {...attributes}
              {...listeners}
              title="ドラッグして移動"
            >
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
              <span className="font-medium text-slate-900 text-xs truncate block">{task.title}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {task.isArchived && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  アーカイブ
                </Badge>
              )}
              <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">
                {task.dueDate ? format(parseISO(task.dueDate), "yyyy/MM/dd") : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskCard({ task, onClick, isDragging }: { task: Task; onClick: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        // カスタム重要度の場合は大文字小文字を調整
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="mb-2"
    >
      <Card
        className={`shadow-sm hover:shadow-md transition-shadow ${
          task.isArchived ? "border-gray-300 opacity-70" : "border-slate-200"
        }`}
        style={{ 
          backgroundColor: task.isArchived 
            ? "#f3f4f6" 
            : (task.cardColor && task.cardColor !== "" ? task.cardColor : "white")
        }}
      >
        <CardContent className="p-2">
          <div className="flex items-start gap-2">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200/50 rounded transition-colors flex-shrink-0 mt-1"
              {...attributes}
              {...listeners}
              title="ドラッグして移動"
            >
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex-1 cursor-pointer" onClick={onClick}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm leading-relaxed">{task.title}</h3>
                <div className="flex items-center gap-1">
                  {task.isArchived && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      アーカイブ
                    </Badge>
                  )}
                  <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              </div>

              {task.labels && task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {task.labels.map((label) => (
                    <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white text-xs">
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-600 mb-2 leading-relaxed line-clamp-2">{task.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-1">
                  {task.members && task.members.length > 0 ? (
                    task.members.slice(0, 3).map((member, index) => (
                      <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                          {member.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))
                  ) : (
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
                        未
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {task.members && task.members.length > 3 && (
                    <div className="w-6 h-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">
                        +{task.members.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {task.dueDate ? format(parseISO(task.dueDate), "yyyy/MM/dd") : ""}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskListItem({ task, onClick }: { task: Task; onClick: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        // カスタム重要度の場合は大文字小文字を調整
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    }
  }

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 border rounded-md hover:bg-slate-50 cursor-pointer transition-colors ${
        task.isArchived ? "border-gray-300 opacity-70" : "border-slate-200"
      }`}
      onClick={onClick}
      style={{ 
        backgroundColor: task.isArchived 
          ? "#f3f4f6" 
          : (task.cardColor && task.cardColor !== "" ? task.cardColor : "white")
      }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-900 text-sm truncate">{task.title}</h3>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {task.isArchived && (
          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
            アーカイブ
          </Badge>
        )}
        <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex -space-x-1">
          {task.members && task.members.length > 0 ? (
            task.members.slice(0, 3).map((member, index) => (
              <Avatar key={member.id} className="w-5 h-5 border border-white">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {member.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <Avatar className="w-5 h-5">
              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
                未
              </AvatarFallback>
            </Avatar>
          )}
          {task.members && task.members.length > 3 && (
            <div className="w-5 h-5 bg-gray-100 border border-white rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                +{task.members.length - 3}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 min-w-[90px]">
          <Calendar className="w-3 h-3" />
          <span>
            {task.dueDate ? format(parseISO(task.dueDate), "yyyy/MM/dd") : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({
  list,
  tasks,
  viewMode,
  onTaskClick,
  onAddCard,
  onAddFromTemplate,
  onEditList,
  onDeleteList,
  onListColorChange,
  boardId,
}: {
  list: KanbanList
  tasks: Task[]
  viewMode: "card" | "list"
  onTaskClick: (task: Task) => void
  onAddCard: () => void
  onAddFromTemplate: (template: any) => void
  onEditList: (listId: string) => void
  onDeleteList: (listId: string) => void
  onListColorChange: (listId: string) => void
  boardId?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])

  // localStorageから折りたたみ状態を読み込む
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // 常時運用タスクリストはデフォルトで畳んだ状態
    if (list.title === "常時運用タスク") {
      const saved = localStorage.getItem(`list-collapsed-${list.id}`)
      return saved === 'true' || saved === null // 保存されていない場合は畳んだ状態
    }
    const saved = localStorage.getItem(`list-collapsed-${list.id}`)
    return saved === 'true'
  })

  // 折りたたみ状態をlocalStorageに保存
  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem(`list-collapsed-${list.id}`, String(collapsed))
  }

  // localStorageからテンプレートを読み込む（ボードごと）
  useEffect(() => {
    if (showTemplateDialog && boardId) {
      const storageKey = `cardTemplates-${boardId}`
      const templates = JSON.parse(localStorage.getItem(storageKey) || '[]')
      console.log('[v0] Loaded templates from localStorage for board:', boardId, templates)
      setSavedTemplates(templates)
    }
  }, [showTemplateDialog, boardId])

  // テンプレートを削除
  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation() // カードのクリックイベントを阻止
    if (confirm('このテンプレートを削除してもよろしいですか？')) {
      if (!boardId) return
      const storageKey = `cardTemplates-${boardId}`
      const templates = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updatedTemplates = templates.filter((t: any) => t.id !== templateId)
      localStorage.setItem(storageKey, JSON.stringify(updatedTemplates))
      setSavedTemplates(updatedTemplates)
      console.log('[v0] Template deleted:', templateId)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (isCollapsed) {
    return (
      <div ref={setNodeRef} style={style} className="flex-shrink-0 w-12">
        <div 
          className="rounded-lg p-2 h-full min-h-[400px] flex flex-col items-center"
          style={{ backgroundColor: list.color || "#f1f5f9" }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleCollapse(false)}
            className="h-8 w-8 p-0 mb-4 flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex-1 flex items-center justify-center">
            <div className="writing-mode-vertical text-sm font-semibold text-slate-900 whitespace-nowrap">
              {list.title} ({tasks.length})
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex-1 min-w-[300px]"
    >
      <div 
        className="rounded-lg p-4 relative z-0"
        style={{ backgroundColor: list.color || "#f1f5f9" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleCollapse(true)
              }}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded transition-colors"
              {...attributes}
              {...listeners}
              title="ドラッグしてリストを移動"
            >
              <GripVertical className="w-4 h-4 text-slate-500" />
            </div>
            <h2 className="font-semibold text-slate-900">{list.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
              {tasks.length}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditList(list.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onListColorChange(list.id)}>
                  <Palette className="w-4 h-4 mr-2" />
                  色を変更
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteList(list.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) =>
              viewMode === "list" ? (
                <CompactTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ) : (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ),
            )}

            <button
              onClick={onAddCard}
              className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              カードを追加
            </button>

            <button
              onClick={() => setShowTemplateDialog(true)}
              className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              テンプレートから追加
            </button>
          </div>
        </SortableContext>
      </div>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>テンプレートを選択</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {savedTemplates.map((template) => (
              <Card
                key={template.id}
                className="border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                onClick={() => {
                  onAddFromTemplate(template)
                  setShowTemplateDialog(false)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 flex-1">{template.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        テンプレート
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                  {template.labels && template.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.labels.map((label: any) => (
                        <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white text-xs">
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {savedTemplates.length === 0 && <p className="text-center text-slate-500 py-8">テンプレートがありません</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface KanbanBoardProps {
  boardData?: any
  currentUserId?: string
  currentUserRole?: string
  onRefresh?: () => void
  showArchived?: boolean
  dateFrom?: string
  dateTo?: string
}

export const KanbanBoard = forwardRef<any, KanbanBoardProps>(({ boardData, currentUserId, currentUserRole, onRefresh, showArchived = false, dateFrom, dateTo }, ref) => {
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false)
  const [listColorModalOpen, setListColorModalOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [colorChangeListId, setColorChangeListId] = useState<string | null>(null)

  // ボードデータからリストとカードを生成
  const generateListsFromBoardData = (boardData: any) => {
    if (!boardData?.lists) {
      return [
        { id: "always-running", title: "常時運用タスク", taskIds: [] },
        { id: "scheduled", title: "予定リスト", taskIds: [] },
        { id: "in-progress", title: "進行中", taskIds: [] },
        { id: "done", title: "完了", taskIds: [] },
      ]
    }

    return boardData.lists
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) // position順にソート
      .map((list: any) => ({
        id: list.id,
        title: list.title,
        taskIds: list.cards ? list.cards
          .filter((card: any) => {
            // アーカイブフィルターを適用
            if (!showArchived && card.isArchived) {
              return false // アーカイブされたカードをスキップ
            }
            if (showArchived && !card.isArchived) {
              return false // アーカイブされていないカードをスキップ
            }

            // 日付フィルターを適用
            if (dateFrom || dateTo) {
              if (!card.dueDate) return false // 締切日がないカードをスキップ
              
              const cardDate = new Date(card.dueDate)
              const fromDate = dateFrom ? new Date(dateFrom.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
              const toDate = dateTo ? new Date(dateTo.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
              
              if (fromDate && cardDate < fromDate) return false
              if (toDate && cardDate > toDate) return false
            }

            return true
          })
          .map((card: any) => card.id) : [],
        color: list.color,
      }))
  }

  const generateTasksFromBoardData = (boardData: any) => {
    if (!boardData?.lists) {
      return {}
    }

    const tasks: Record<string, Task> = {}
    boardData.lists.forEach((list: any) => {
      if (list.cards) {
        list.cards.forEach((card: any) => {
          // アーカイブフィルターを適用
          if (!showArchived && card.isArchived) {
            return // アーカイブされたカードをスキップ
          }
          if (showArchived && !card.isArchived) {
            return // アーカイブされていないカードをスキップ
          }

          // 日付フィルターを適用
          if (dateFrom || dateTo) {
            if (!card.dueDate) return // 締切日がないカードをスキップ
            
            const cardDate = new Date(card.dueDate)
            const fromDate = dateFrom ? new Date(dateFrom.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
            const toDate = dateTo ? new Date(dateTo.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
            
            if (fromDate && cardDate < fromDate) return
            if (toDate && cardDate > toDate) return
          }

          tasks[card.id] = {
            id: card.id,
            title: card.title,
            description: card.description || "",
            assignee: card.members?.[0]?.employee?.name || card.members?.[0]?.name || "未割り当て",
            dueDate: card.dueDate || "",
            priority: card.priority || "medium",
            comments: 0,
            attachments: card.attachments?.length || 0,
            status: card.status || list.id,
            cardColor: card.cardColor,
            labels: card.labels || [],
            members: card.members?.map((m: any) => ({
              id: m.employee?.id || m.id,
              name: m.employee?.name || m.name,
              email: m.employee?.email || m.email,
            })) || [],
            checklists: card.checklists || [],
            isArchived: card.isArchived || false,
            boardId: boardData.id,
          }
        })
      }
    })
    return tasks
  }

  const [lists, setLists] = useState<KanbanList[]>(
    boardData ? generateListsFromBoardData(boardData) : []
  )

  const [tasksById, setTasksById] = useState<Record<string, Task>>(
    boardData ? generateTasksFromBoardData(boardData) : {},
  )

  // ボードデータが変更されたときに状態を更新
  useEffect(() => {
    if (boardData) {
      console.log("KanbanBoard - Updating with board data:", boardData)
      console.log("KanbanBoard - showArchived:", showArchived)
      console.log("KanbanBoard - dateFrom:", dateFrom, "dateTo:", dateTo)
      setLists(generateListsFromBoardData(boardData))
      setTasksById(generateTasksFromBoardData(boardData))
    }
  }, [boardData, showArchived, dateFrom, dateTo])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a task
    if (tasksById[activeId]) {
      const activeList = lists.find((list) => list.taskIds.includes(activeId))
      const overList = lists.find((list) => list.id === overId || list.taskIds.includes(overId))

      if (!activeList || !overList || activeList === overList) return

      setLists((lists) => {
        const activeItems = activeList.taskIds
        const overItems = overList.taskIds

        const activeIndex = activeItems.indexOf(activeId)
        const overIndex = overItems.indexOf(overId)

        let newIndex: number
        if (overId in tasksById) {
          newIndex = overIndex
        } else {
          newIndex = overItems.length
        }

        return lists.map((list) => {
          if (list.id === activeList.id) {
            return { ...list, taskIds: activeItems.filter((id) => id !== activeId) }
          }
          if (list.id === overList.id) {
            const newTaskIds = [...overItems]
            newTaskIds.splice(newIndex, 0, activeId)
            return { ...list, taskIds: newTaskIds }
          }
          return list
        })
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a list
    if (lists.find((list) => list.id === activeId)) {
      const oldIndex = lists.findIndex((list) => list.id === activeId)
      const newIndex = lists.findIndex((list) => list.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // ローカル状態を更新
        const newLists = arrayMove(lists, oldIndex, newIndex)
        setLists(newLists)

        // データベースに並び順を保存
        try {
          console.log("[v0] Reordering lists:", newLists.map((list, index) => ({ id: list.id, position: index })))
          
          const response = await fetch(`/api/boards/${boardData?.id}/lists/reorder`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-employee-id': currentUserId || '',
            },
            body: JSON.stringify({
              listOrders: newLists.map((list, index) => ({ id: list.id, position: index })),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error("[v0] Failed to reorder lists:", error)
            alert(`リストの並び順更新に失敗しました: ${error.error || '不明なエラー'}`)
            // 失敗時は元の状態に戻す
            onRefresh?.()
          } else {
            console.log("[v0] Lists reordered successfully")
          }
        } catch (error) {
          console.error("[v0] Error reordering lists:", error)
          alert("リストの並び順更新中にエラーが発生しました")
          // 失敗時は元の状態に戻す
          onRefresh?.()
        }
      }
      return
    }

    // Check if dragging a task
    if (tasksById[activeId]) {
      const sourceList = lists.find((list) => list.taskIds.includes(activeId))
      const targetList = lists.find((list) => list.id === overId) || 
                        lists.find((list) => list.taskIds.includes(overId))
      
      if (!sourceList || !targetList) return

      const oldIndex = sourceList.taskIds?.indexOf(activeId) ?? -1
      
      // Determine new index in target list
      let newIndex: number
      if (targetList.id === overId) {
        // Dropped on list header, add to end
        newIndex = targetList.taskIds?.length ?? 0
      } else {
        // Dropped on another task
        newIndex = targetList.taskIds?.indexOf(overId) ?? 0
      }

      // Update local state first
      setLists((lists) => {
        const newLists = [...lists]
        
        if (sourceList.id === targetList.id) {
          // Moving within same list
          const sourceTaskIds = sourceList.taskIds || []
          const updatedTaskIds = arrayMove(sourceTaskIds, oldIndex, newIndex)
          const sourceListIndex = newLists.findIndex((l) => l.id === sourceList.id)
          newLists[sourceListIndex] = { ...sourceList, taskIds: updatedTaskIds }
        } else {
          // Moving between lists
          const sourceListIndex = newLists.findIndex((l) => l.id === sourceList.id)
          const targetListIndex = newLists.findIndex((l) => l.id === targetList.id)
          
          // Remove from source list
          const sourceTaskIds = sourceList.taskIds || []
          const updatedSourceTaskIds = sourceTaskIds.filter((id) => id !== activeId)
          newLists[sourceListIndex] = { ...sourceList, taskIds: updatedSourceTaskIds }
          
          // Add to target list
          const targetTaskIds = targetList.taskIds || []
          const updatedTargetTaskIds = [...targetTaskIds]
          updatedTargetTaskIds.splice(newIndex, 0, activeId)
          newLists[targetListIndex] = { ...targetList, taskIds: updatedTargetTaskIds }
        }
        
        return newLists
      })

      // Update database
      if (!currentUserId) {
        console.error('No current user ID available for authentication')
        return
      }
      
      try {
        const response = await fetch(`/api/cards/${activeId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-employee-id': currentUserId,
          },
          body: JSON.stringify({
            listId: targetList.id,
            position: newIndex
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Failed to update card position:', response.status, errorText)
          if (response.status === 401) {
            console.error('Authentication failed. Please check if user is logged in.')
          }
          // Optionally revert local state change
        } else {
          console.log('Card position updated successfully')
        }
      } catch (error) {
        console.error('Error updating card position:', error)
        // Optionally revert local state change
      }
    }
  }

  const handleAddList = async () => {
    if (!currentUserRole) {
      alert(getPermissionErrorMessage("店長"))
      return
    }

    const listPermissions = checkListPermissions(currentUserRole as any)
    if (!listPermissions.canCreate) {
      alert(listPermissions.reason || getPermissionErrorMessage("店長"))
      return
    }

    const listName = prompt("リスト名を入力してください")
    if (listName) {
      try {
        console.log("[v0] Creating new list:", listName)
        
        const response = await fetch(`/api/boards/${boardData?.id}/lists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-employee-id': currentUserId || '',
          },
          body: JSON.stringify({
            title: listName,
          }),
        })

        if (response.ok) {
          const newListData = await response.json()
          console.log("[v0] List created successfully:", newListData)
          
          // ボードデータを再取得してUIを更新
          onRefresh?.()
        } else {
          const error = await response.json()
          console.error("[v0] Failed to create list:", error)
          alert(`リストの作成に失敗しました: ${error.error || '不明なエラー'}`)
        }
      } catch (error) {
        console.error("[v0] Error creating list:", error)
        alert("リストの作成中にエラーが発生しました")
      }
    }
  }

  const handleEditList = async (listId: string) => {
    if (!currentUserRole) {
      alert(getPermissionErrorMessage("店長"))
      return
    }

    const listPermissions = checkListPermissions(currentUserRole as any)
    if (!listPermissions.canEdit) {
      alert(listPermissions.reason || getPermissionErrorMessage("店長"))
      return
    }

    const list = lists.find(l => l.id === listId)
    if (!list) return

    const newTitle = prompt("リスト名を入力してください", list.title)
    if (newTitle && newTitle !== list.title) {
      try {
        const response = await fetch(`/api/boards/${boardData?.id}/lists/${listId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-employee-id': currentUserId || '',
          },
          body: JSON.stringify({ title: newTitle }),
        })

        if (response.ok) {
          setLists(lists.map(l => 
            l.id === listId ? { ...l, title: newTitle } : l
          ))
          if (onRefresh) onRefresh()
        } else {
          alert('リストの更新に失敗しました')
        }
      } catch (error) {
        console.error('Error updating list:', error)
        alert('リストの更新に失敗しました')
      }
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!currentUserRole) {
      alert(getPermissionErrorMessage("店長"))
      return
    }

    const listPermissions = checkListPermissions(currentUserRole as any)
    if (!listPermissions.canDelete) {
      alert(listPermissions.reason || getPermissionErrorMessage("店長"))
      return
    }

    const list = lists.find(l => l.id === listId)
    if (!list) return

    if (confirm(`リスト「${list.title}」を削除してもよろしいですか？`)) {
      try {
        const response = await fetch(`/api/boards/${boardData?.id}/lists/${listId}`, {
          method: 'DELETE',
          headers: {
            'x-employee-id': currentUserId || '',
          },
        })

        if (response.ok) {
          setLists(lists.filter(l => l.id !== listId))
          if (onRefresh) onRefresh()
        } else {
          alert('リストの削除に失敗しました')
        }
      } catch (error) {
        console.error('Error deleting list:', error)
        alert('リストの削除に失敗しました')
      }
    }
  }

  const handleListColorChange = async (listId: string, color: string) => {
    try {
      console.log('Changing list color:', { listId, color, boardId: boardData?.id })
      
      const response = await fetch(`/api/boards/${boardData?.id}/lists/${listId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUserId || '',
        },
        body: JSON.stringify({ color }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('List color updated successfully:', result)
        setLists(lists.map(l =>
          l.id === listId ? { ...l, color } : l
        ))
        if (onRefresh) onRefresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('List color update failed:', response.status, errorData)
        alert(`リスト色の変更に失敗しました: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error updating list color:', error)
      alert(`リスト色の変更に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  // refを通じて外部からhandleTaskClickを呼び出せるようにする
  useImperativeHandle(ref, () => ({
    handleTaskClick
  }))

  const handleTaskUpdate = (updatedTask: Task) => {
    // タスクが更新されたときにローカル状態を更新
    setTasksById((prev) => ({
      ...prev,
      [updatedTask.id]: updatedTask
    }))
    
    // ステータスが変更された場合、リスト間での移動も処理
    if (updatedTask.status) {
      setLists((prevLists) => {
        return prevLists.map((list) => {
          // 古いリストからタスクを削除
          const filteredTaskIds = list.taskIds.filter(id => id !== updatedTask.id)
          
          // 新しいステータスのリストにタスクを追加
          const statusToTitleMap: Record<string, string> = {
            'todo': '未着手',
            'in-progress': '進行中',
            'review': 'レビュー',
            'done': '完了'
          }
          
          const targetTitle = statusToTitleMap[updatedTask.status] || updatedTask.status
          if (list.title === targetTitle) {
            return { ...list, taskIds: [...filteredTaskIds, updatedTask.id] }
          }
          
          return { ...list, taskIds: filteredTaskIds }
        })
      })
    }
  }

  const handleAddCard = (listId: string) => {
    setSelectedListId(listId)
    setAddCardDialogOpen(true)
  }

  const handleAddFromTemplate = async (listId: string, template: any) => {
    if (!boardData?.id || !currentUserId) {
      alert("ユーザー情報が取得できません")
      return
    }

    try {
      console.log("[v0] Creating card from template:", template, "in list:", listId)
      
      // テンプレートから新しいカードを作成
      const cardData = {
        title: template.title.replace(' (テンプレート)', ''), // テンプレートの文字を削除
        description: template.description,
        priority: template.priority || 'medium',
        cardColor: template.cardColor,
        boardId: boardData.id,
        listId: listId,
        memberIds: [currentUserId], // 現在のユーザーをメンバーに追加
      }
      
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUserId,
        },
        body: JSON.stringify(cardData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Card created from template successfully:", result)
        
        // ラベルを追加
        if (template.labels && template.labels.length > 0) {
          for (const label of template.labels) {
            await fetch(`/api/cards/${result.card.id}/labels`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-employee-id": currentUserId,
              },
              body: JSON.stringify({ labelId: label.id }),
            })
          }
        }
        
        // チェックリストを追加
        if (template.checklists && template.checklists.length > 0) {
          for (const checklist of template.checklists) {
            await fetch(`/api/cards/${result.card.id}/checklists`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-employee-id": currentUserId,
              },
              body: JSON.stringify({
                title: checklist.title,
                items: checklist.items,
              }),
            })
          }
        }
        
        // ボードデータを再取得
        onRefresh?.()
        alert("テンプレートからカードを作成しました")
      } else {
        const error = await response.json()
        console.error("[v0] Failed to create card from template:", error)
        alert(`カードの作成に失敗しました: ${error.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("[v0] Error creating card from template:", error)
      alert("カードの作成中にエラーが発生しました")
    }
  }

  const handleCreateCard = async (cardData: { title: string; description?: string; priority?: string }) => {
    if (!selectedListId || !boardData?.id || !currentUserId) {
      alert("ユーザー情報が取得できません")
      return
    }

    try {
      console.log("Creating card:", cardData, "in list:", selectedListId)
      
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUserId,
        },
        body: JSON.stringify({
          ...cardData,
          boardId: boardData.id,
          listId: selectedListId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Card created successfully:", result)
        
                 // ローカル状態を更新
                 const newTask: Task = {
                   id: result.card.id,
                   title: cardData.title,
                   description: cardData.description || "",
                   assignee: result.card.members?.[0]?.employee?.name || "未割り当て",
                   members: result.card.members?.map((member: any) => ({
                     id: member.employee?.id || member.id,
                     name: member.employee?.name || member.name,
                     email: member.employee?.email || member.email
                   })) || [],
                   dueDate: result.card.dueDate || "",
                   priority: (cardData.priority as "low" | "medium" | "high") || "medium",
                   comments: 0,
                   attachments: 0,
                   status: selectedListId,
                   cardColor: result.card.cardColor || "",
                   labels: result.card.labels || [],
                 }

        setTasksById((prev) => ({ ...prev, [newTask.id]: newTask }))
        setLists((prev) =>
          prev.map((list) =>
            list.id === selectedListId ? { ...list, taskIds: [...list.taskIds, newTask.id] } : list
          )
        )
        
        setAddCardDialogOpen(false)
        
        // ボードデータを再取得
        if (onRefresh) {
          onRefresh()
        }
      } else {
        console.error("Failed to create card:", await response.text())
        alert("カードの作成に失敗しました")
      }
    } catch (error) {
      console.error("Error creating card:", error)
      alert("カードの作成に失敗しました")
    }
  }

  const activeTask = activeId && tasksById[activeId] ? tasksById[activeId] : null

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-8 gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            カード
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 gap-2"
          >
            <List className="w-4 h-4" />
            全体
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {lists.length > 0 ? (
            <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => {
                const listTasks = list.taskIds?.map((id) => tasksById[id]).filter(Boolean) || []
                return (
                  <KanbanColumn
                    key={list.id}
                    list={list}
                    tasks={listTasks}
                    viewMode={viewMode}
                    onTaskClick={handleTaskClick}
                    onAddCard={() => handleAddCard(list.id)}
                    onAddFromTemplate={(template) => handleAddFromTemplate(list.id, template)}
                    onEditList={handleEditList}
                    onDeleteList={handleDeleteList}
                    onListColorChange={(listId) => {
                      setColorChangeListId(listId)
                      setListColorModalOpen(true)
                    }}
                    boardId={boardData?.id}
                  />
                )
              })}
            </SortableContext>
          ) : (
            <div className="flex-1 text-center py-12 text-slate-500">
              <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">リストがありません</p>
              <p className="text-sm">最初のリストを作成してタスク管理を始めましょう</p>
            </div>
          )}

          {currentUserRole && (() => {
            const listPermissions = checkListPermissions(currentUserRole as any)
            if (!listPermissions.canCreate) return null
            
            return (
              <div className="flex-shrink-0 w-[300px]">
                <button
                  onClick={handleAddList}
                  className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 h-full min-h-[120px]"
                >
                  <Plus className="w-5 h-5" />
                  リストを追加
                </button>
              </div>
            )
          })()}
        </div>

        <DragOverlay>
          {activeTask && tasksById[activeTask.id] ? (
            viewMode === "list" ? (
              <CompactTaskCard task={activeTask} onClick={() => {}} isDragging />
            ) : (
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
            )
          ) : null}
        </DragOverlay>
      </DndContext>

               <TaskDetailDialog 
                 task={selectedTask} 
                 open={dialogOpen} 
                 onOpenChange={setDialogOpen}
                 onRefresh={onRefresh}
                 onTaskUpdate={handleTaskUpdate}
               />
      
      {/* カード追加ダイアログ */}
      <AddCardDialog 
        open={addCardDialogOpen} 
        onOpenChange={setAddCardDialogOpen}
        onCreateCard={handleCreateCard}
      />

      {/* リスト色変更モーダル */}
      <Dialog open={listColorModalOpen} onOpenChange={setListColorModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>リストの色を変更</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* カラーピッカー */}
            <div className="space-y-2">
              <label className="text-sm font-medium">カスタム色を選択</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="customListColor"
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  onChange={(e) => {
                    if (colorChangeListId) {
                      const customColor = hexToRgba(e.target.value, 0.15)
                      handleListColorChange(colorChangeListId, customColor)
                      setListColorModalOpen(false)
                      setColorChangeListId(null)
                    }
                  }}
                />
                <span className="text-sm text-gray-600">カスタム色を選択</span>
              </div>
            </div>
            
            {/* プリセット色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">プリセット色</label>
              <div className="grid grid-cols-6 gap-3">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      if (colorChangeListId) {
                        handleListColorChange(colorChangeListId, color.value)
                        setListColorModalOpen(false)
                        setColorChangeListId(null)
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    <div className="text-xs text-center font-medium text-gray-700">
                      {color.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})

// カード追加ダイアログコンポーネント
function AddCardDialog({ 
  open, 
  onOpenChange, 
  onCreateCard 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCard: (data: { title: string; description?: string; priority?: string }) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert("カードタイトルを入力してください")
      return
    }
    onCreateCard({ title, description, priority })
    setTitle("")
    setDescription("")
    setPriority("medium")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規カード追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="カードのタイトルを入力"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="カードの説明を入力"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">優先度</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">
              作成
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
