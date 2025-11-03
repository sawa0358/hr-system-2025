"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Plus, ChevronLeft, ChevronRight, FileText, LayoutGrid, List, MoreHorizontal, Edit, Trash2, Palette, GripVertical } from "lucide-react"
import { format, parseISO } from "date-fns"
import { taskTemplates } from "@/lib/mock-data"
import { checkListPermissions, checkCardPermissions, getPermissionErrorMessage } from "@/lib/permissions"
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
  TouchSensor,
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
  members?: { id: string; name: string; email?: string; employeeType?: string }[]
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
  name?: string
  taskIds: string[]
  color?: string
}

function CompactTaskCard({ task, onClick, isDragging, currentUserId, currentUserRole, isMobile = false, activeId }: { task: Task; onClick: () => void; isDragging?: boolean; currentUserId?: string; currentUserRole?: string; isMobile?: boolean; activeId?: string | null }) {
  // 権限チェック
  const isAdminOrHr = currentUserRole === 'admin' || currentUserRole === 'hr'
  const cardMemberIds = (task.members || []).map((m: any) => m.id || m.employeeId || m.employee?.id).filter(Boolean)
  const isCardMember = cardMemberIds.includes(currentUserId || '') || task.createdBy === currentUserId
  const canDrag = isAdminOrHr || isCardMember
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: task.id,
    disabled: !canDrag // 権限がない場合はドラッグを無効化
  })
  
  // クリックとドラッグを区別するためのフラグ
  const clickStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // カード全体のクリックハンドラー（ドラッグ開始していない場合のみ）
  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    // モバイルでドラッグが開始されていない場合のみクリックを実行
    if (isMobile && !isDragging && activeId !== task.id) {
      // 少し遅延させて、ドラッグイベントと競合しないようにする
      clickTimeoutRef.current = setTimeout(() => {
        if (!isDragging && activeId !== task.id) {
          onClick()
        }
      }, 200)
    } else if (!isMobile) {
      onClick()
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      clickStartRef.current = null
    }
  }, [])

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
      data-sortable-id={task.id}
    >
      <Card
        className={`shadow-sm hover:shadow-md transition-shadow ${
          isDragging 
            ? 'cursor-grabbing' 
            : canDrag 
              ? 'cursor-grab' 
              : 'cursor-pointer'
        } ${
          task.isArchived ? "border-gray-300 opacity-70" : "border-slate-200"
        }`}
        style={{ 
          backgroundColor: task.isArchived 
            ? "#f3f4f6" 
            : (task.cardColor && task.cardColor !== "" ? task.cardColor : "white"),
          touchAction: isMobile && canDrag ? (isDragging ? 'none' : 'manipulation') : 'auto', // モバイルではドラッグを優先（manipulationでパンとズームを許可）
          willChange: isDragging ? 'transform' : 'auto', // GPU加速でスムーズに
          WebkitUserSelect: 'none', // iOSでテキスト選択を防ぐ
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : canDrag ? 'grab' : 'pointer', // ドラッグ中はgrabbingカーソル
        }}
        {...attributes}
        {...(canDrag ? listeners : {})}
      >
        <CardContent 
          className="p-2"
          onClick={(e) => {
            // ドラッグ中でない場合のみクリックイベントを実行
            if (!isDragging && activeId !== task.id) {
              e.stopPropagation()
              console.log('Task card clicked:', task.id, task.title)
              onClick()
            }
          }}
        >
          <div className="flex items-center gap-2">
            {/* ドラッグハンドル（モバイルでドラッグ可能な場合のみ表示・視覚的なヒント） */}
            {isMobile && canDrag && (
              <div 
                className="flex-shrink-0 text-slate-400"
                style={{ touchAction: 'none', pointerEvents: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
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
            <div className="flex -space-x-1 flex-shrink-0">
              {task.members && task.members.length > 0 ? (
                task.members.slice(0, 5).map((member, index) => {
                  
                  // ローカルストレージから画像の文字列を取得
                  const avatarText = typeof window !== 'undefined' 
                    ? localStorage.getItem(`employee-avatar-text-${member.id}`) || member.name.slice(0, 3)
                    : member.name.slice(0, 3)
                  
                  return (
                    <Avatar key={member.id} className="w-5 h-5 border border-white">
                      <AvatarFallback 
                        employeeType={member.employee?.employeeType}
                        className={`font-semibold whitespace-nowrap overflow-hidden ${
                          /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
                        }`}
                      >
                        {avatarText.slice(0, 3)}
                      </AvatarFallback>
                    </Avatar>
                  )
                })
              ) : (
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold whitespace-nowrap overflow-hidden">
                    未
                  </AvatarFallback>
                </Avatar>
              )}
              {task.members && task.members.length > 5 && (
                <div className="w-5 h-5 bg-gray-100 border border-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">
                    +{task.members.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskCard({ task, onClick, isDragging, currentUserId, currentUserRole, isMobile = false, activeId }: { task: Task; onClick: () => void; isDragging?: boolean; currentUserId?: string; currentUserRole?: string; isMobile?: boolean; activeId?: string | null }) {
  // 権限チェック
  const isAdminOrHr = currentUserRole === 'admin' || currentUserRole === 'hr'
  const cardMemberIds = (task.members || []).map((m: any) => m.id || m.employeeId || m.employee?.id).filter(Boolean)
  const isCardMember = cardMemberIds.includes(currentUserId || '') || task.createdBy === currentUserId
  const canDrag = isAdminOrHr || isCardMember
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: task.id,
    disabled: !canDrag // 権限がない場合はドラッグを無効化
  })
  
  // クリックとドラッグを区別するためのフラグ
  const clickStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // カード全体のクリックハンドラー（ドラッグ開始していない場合のみ）
  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    // モバイルでドラッグが開始されていない場合のみクリックを実行
    if (isMobile && !isDragging && activeId !== task.id) {
      // 少し遅延させて、ドラッグイベントと競合しないようにする
      clickTimeoutRef.current = setTimeout(() => {
        if (!isDragging && activeId !== task.id) {
          onClick()
        }
      }, 200)
    } else if (!isMobile) {
      onClick()
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
      clickStartRef.current = null
    }
  }, [])

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
      data-sortable-id={task.id}
    >
      <Card
        className={`shadow-sm hover:shadow-md transition-shadow ${
          isDragging 
            ? 'cursor-grabbing' 
            : canDrag 
              ? 'cursor-grab' 
              : 'cursor-pointer'
        } ${
          task.isArchived ? "border-gray-300 opacity-70" : "border-slate-200"
        }`}
        style={{ 
          backgroundColor: task.isArchived 
            ? "#f3f4f6" 
            : (task.cardColor && task.cardColor !== "" ? task.cardColor : "white"),
          touchAction: isMobile && canDrag ? (isDragging ? 'none' : 'manipulation') : 'auto', // モバイルではドラッグを優先（manipulationでパンとズームを許可）
          willChange: isDragging ? 'transform' : 'auto', // GPU加速でスムーズに
          WebkitUserSelect: 'none', // iOSでテキスト選択を防ぐ
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : canDrag ? 'grab' : 'pointer', // ドラッグ中はgrabbingカーソル
        }}
        {...attributes}
        {...(canDrag ? listeners : {})}
      >
        <CardContent 
          className="p-2"
          onClick={(e) => {
            // ドラッグ中でない場合のみクリックイベントを実行
            if (!isDragging && activeId !== task.id) {
              e.stopPropagation()
              console.log('TaskCard clicked:', task.id, task.title)
              onClick()
            }
          }}
        >
          <div className="flex items-start gap-2">
            {/* ドラッグハンドル（モバイルでドラッグ可能な場合のみ表示・視覚的なヒント） */}
            {isMobile && canDrag && (
              <div 
                className="flex-shrink-0 text-slate-400 mt-1"
                style={{ touchAction: 'none', pointerEvents: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 cursor-pointer">
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
                    task.members.slice(0, 5).map((member, index) => {
                      // ローカルストレージから画像の文字列を取得
                      const avatarText = typeof window !== 'undefined' 
                        ? localStorage.getItem(`employee-avatar-text-${member.id}`) || member.name.slice(0, 3)
                        : member.name.slice(0, 3)
                      
                      return (
                        <Avatar key={member.id} className="w-7 h-7 border-2 border-white">
                          <AvatarFallback 
                            employeeType={member.employee?.employeeType}
                            className={`font-semibold whitespace-nowrap overflow-hidden ${
                              /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
                            }`}
                          >
                            {avatarText.slice(0, 3)}
                          </AvatarFallback>
                        </Avatar>
                      )
                    })
                  ) : (
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold whitespace-nowrap overflow-hidden">
                        未
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {task.members && task.members.length > 5 && (
                    <div className="w-7 h-7 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">
                        +{task.members.length - 5}
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
                task.members.slice(0, 5).map((member, index) => {
                  // ローカルストレージから画像の文字列を取得
                  const avatarText = typeof window !== 'undefined' 
                    ? localStorage.getItem(`employee-avatar-text-${member.id}`) || member.name.slice(0, 3)
                    : member.name.slice(0, 3)
                  
                  return (
                <Avatar key={member.id} className="w-6 h-6 border border-white">
                  <AvatarFallback 
                    employeeType={member.employee?.employeeType}
                    className={`font-semibold whitespace-nowrap overflow-hidden ${
                      /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
                    }`}
                  >
                    {avatarText.slice(0, 3)}
                  </AvatarFallback>
                </Avatar>
              )
                })
              ) : (
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold whitespace-nowrap overflow-hidden">
                    未
                  </AvatarFallback>
                </Avatar>
              )}
          {task.members && task.members.length > 5 && (
            <div className="w-6 h-6 bg-gray-100 border border-white rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                +{task.members.length - 5}
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
  currentUserId,
  currentUserRole,
  activeId,
  isMobile = false,
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
  currentUserId?: string
  currentUserRole?: string
  activeId?: string | null
  isMobile?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])

  // localStorageから折りたたみ状態を読み込む
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // 常時運用タスクリストはデフォルトで畳んだ状態
    if ((list.name || list.title) === "常時運用タスク") {
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
    // 親コンポーネントに再レンダリングを促すためにカスタムイベントを発火
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('listCollapseChanged', { detail: { listId: list.id } }))
    }
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
              {list.name || list.title || 'No name'} ({tasks.length})
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
      className={isMobile ? "w-full flex-shrink-0" : "flex-shrink-0"}
    >
      <div 
        className="rounded-lg p-4 relative z-0"
        style={{ backgroundColor: list.color || "#f1f5f9" }}
        data-list-id={list.id}
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
              <List className="w-4 h-4 text-slate-500" />
            </div>
            <h2 className="font-semibold text-slate-900">{list.name || list.title || 'No name'}</h2>
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
                <CompactTaskCard key={task.id} task={task} onClick={() => {
                  console.log('CompactTaskCard onClick callback:', task.id)
                  onTaskClick(task)
                }} isDragging={activeId === task.id} currentUserId={currentUserId} currentUserRole={currentUserRole} isMobile={isMobile} activeId={activeId} />
              ) : (
                <TaskCard key={task.id} task={task} onClick={() => {
                  console.log('TaskCard onClick callback:', task.id)
                  onTaskClick(task)
                }} isDragging={activeId === task.id} currentUserId={currentUserId} currentUserRole={currentUserRole} isMobile={isMobile} activeId={activeId} />
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
  isMobile?: boolean
}

export const KanbanBoard = forwardRef<any, KanbanBoardProps>(({ boardData, currentUserId, currentUserRole, onRefresh, showArchived = false, dateFrom, dateTo, isMobile = false }, ref) => {
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // デバッグ用：dialogOpenとselectedTaskの変更を監視
  useEffect(() => {
    console.log('Dialog state changed:', { dialogOpen, selectedTask: selectedTask?.id, selectedTaskTitle: selectedTask?.title })
  }, [dialogOpen, selectedTask])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false)
  const [listColorModalOpen, setListColorModalOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [colorChangeListId, setColorChangeListId] = useState<string | null>(null)
  const [collapseUpdateTrigger, setCollapseUpdateTrigger] = useState(0) // 折りたたみ状態更新用のトリガー

  // 折りたたみ状態変更イベントをリッスン
  useEffect(() => {
    const handleCollapseChange = () => {
      setCollapseUpdateTrigger(prev => prev + 1) // トリガーを更新して再レンダリングを促す
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('listCollapseChanged', handleCollapseChange)
      return () => {
        window.removeEventListener('listCollapseChanged', handleCollapseChange)
      }
    }
  }, [])

  // ボードデータからリストとカードを生成
  const generateListsFromBoardData = (boardData: any) => {
    if (!boardData?.lists) {
      // ボードデータがない場合は空配列を返す（デフォルトリストはAPI側で作成される）
      return []
    }

    console.log("generateListsFromBoardData - boardData.lists:", boardData.lists)
    const generatedLists = boardData.lists
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) // position順にソート
      .map((list: any) => ({
        id: list.id,
        title: list.title,
        name: list.title,
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
    
    console.log("generateListsFromBoardData - generatedLists:", generatedLists)
    return generatedLists
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
              employee: m.employee, // employeeオブジェクト全体を保持
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

  // モバイル・PC共通：距離ベースのアクティベーション（スクロールとドラッグを区別）
  // モバイル用：TouchSensor（タッチイベントベース、5px以上の移動でドラッグ開始）
  // PC用：PointerSensor（マウスイベントベース、8px以上の移動でドラッグ開始）
  const sensors = useSensors(
    // モバイル用：TouchSensor（タッチイベントを直接処理、5px以上の移動でドラッグ開始）
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5, // 5px以上の移動でドラッグ開始（小さな移動はスクロールとして認識）
      },
    }),
    // PC用：PointerSensor（マウス・タッチ両対応、8px以上の移動でドラッグ開始）
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px以上の移動でドラッグ開始（小さな移動は無視）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // ドラッグ開始フラグ（モバイル用：クリックとドラッグを区別）
  const draggingTaskIdRef = useRef<string | null>(null)
  
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    draggingTaskIdRef.current = activeId // ドラッグ開始を記録
    
    // タスクのドラッグの場合、権限チェックを行う
    if (tasksById[activeId]) {
      const draggedTask = tasksById[activeId]
      
      // カードの移動権限をチェック（総務・管理者は全て移動可能、その他はメンバーのみ）
      const isAdminOrHr = currentUserRole === 'admin' || currentUserRole === 'hr'
      const cardMemberIds = (draggedTask.members || []).map((m: any) => m.id || m.employeeId || m.employee?.id).filter(Boolean)
      const isCardMember = cardMemberIds.includes(currentUserId || '') || draggedTask.createdBy === currentUserId
      
      if (!isAdminOrHr && !isCardMember) {
        console.log('カードの移動権限がありません: ドラッグをキャンセル')
        alert('カードの移動権限がありません: カードメンバーではありません')
        // ドラッグ操作をキャンセル
        setActiveId(null)
        draggingTaskIdRef.current = null
        return
      }

      // モバイルの場合、ドラッグ開始時のカード中心位置を記録
      if (isMobile) {
        // ドラッグ開始時のカード中心位置を記録
        const allCards = document.querySelectorAll('[data-sortable-id]')
        for (const card of allCards) {
          if (card.getAttribute('data-sortable-id') === activeId) {
            const cardRect = card.getBoundingClientRect()
            dragStartCardCenterXRef.current = cardRect.left + cardRect.width / 2
            break
          }
        }
      }
    }
    
    setActiveId(activeId)
  }

  // モバイル用：最後に移動したリストID（連続移動をスムーズに）
  const lastMovedListIdRef = useRef<string | null>(null)
  const autoMoveToClosestListRef = useRef<NodeJS.Timeout | null>(null)
  
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

      // モバイル用：即座に移動（リストに入る前でも移動）
      const shouldMove = isMobile || (overList && activeList.id !== overList.id)
      
      if (shouldMove) {
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

          const updatedLists = lists.map((list) => {
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
          
          // 最後に移動したリストを記録
          if (isMobile && overList.id !== lastMovedListIdRef.current) {
            lastMovedListIdRef.current = overList.id
          }
          
          return updatedLists
        })
      }
    }
  }
  
  // モバイル用：カードの位置に基づいて最も近いリストに自動移動
  const autoMoveToClosestList = (cardCenterX: number, activeId: string) => {
    if (!isMobile || !desktopScrollContainerRef.current) return
    
    const activeList = lists.find((list) => list.taskIds.includes(activeId))
    if (!activeList) return
    
    // すべてのリスト要素を取得
    const allListElements = document.querySelectorAll('[data-list-id]')
    let closestList: { id: string; element: Element; distance: number } | null = null
    
    allListElements.forEach((listEl) => {
      const listId = listEl.getAttribute('data-list-id')
      if (!listId || listId === activeList.id) return
      
      const listRect = listEl.getBoundingClientRect()
      const listCenterX = listRect.left + listRect.width / 2
      const distance = Math.abs(cardCenterX - listCenterX)
      
      // リストの範囲内（±50%マージン）にある場合のみ考慮
      if (cardCenterX >= listRect.left - listRect.width * 0.5 && 
          cardCenterX <= listRect.right + listRect.width * 0.5) {
        if (!closestList || distance < closestList.distance) {
          closestList = { id: listId, element: listEl, distance }
        }
      }
    })
    
    // 最も近いリストが見つかり、現在のリストと異なる場合
    if (!closestList) return
    
    const closestListId: string = (closestList as { id: string; element: Element; distance: number }).id
    if (closestListId !== activeList.id) {
      const targetList = lists.find((list) => list.id === closestListId)
      if (!targetList) return
      
      // 即座に移動（重複防止：最後に移動したリストと異なる場合のみ）
      if (lastMovedListIdRef.current !== closestListId) {
        setLists((currentLists) => {
          const currentActiveList = currentLists.find((list) => list.taskIds.includes(activeId))
          if (!currentActiveList || currentActiveList.id === targetList.id) return currentLists
          
          const activeItems = currentActiveList.taskIds
          const targetItems = targetList.taskIds
          
          const updatedLists = currentLists.map((list) => {
            if (list.id === currentActiveList.id) {
              return { ...list, taskIds: activeItems.filter((id) => id !== activeId) }
            }
            if (list.id === targetList.id) {
              return { ...list, taskIds: [...targetItems, activeId] }
            }
            return list
          })
          
          lastMovedListIdRef.current = closestListId
          return updatedLists
        })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    
    // モバイルの場合のクリーンアップ（現在は不要だが、将来の拡張用に残す）
    if (isMobile) {
      // 距離ベースのアクティベーションにより、bodyのtouchAction変更は不要
    }
    
    // ドラッグ終了後、少し遅延させてフラグをリセット（クリックイベントと競合しないように）
    setTimeout(() => {
      draggingTaskIdRef.current = null
    }, 300)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a task - 権限チェックを最初に実行
    if (tasksById[activeId]) {
      const draggedTask = tasksById[activeId]
      
      // カードの移動権限をチェック（総務・管理者は全て移動可能、その他はメンバーのみ）
      const isAdminOrHr = currentUserRole === 'admin' || currentUserRole === 'hr'
      const cardMemberIds = (draggedTask.members || []).map((m: any) => m.id || m.employeeId || m.employee?.id).filter(Boolean)
      const isCardMember = cardMemberIds.includes(currentUserId || '') || draggedTask.createdBy === currentUserId
      
      if (!isAdminOrHr && !isCardMember) {
        console.log('カードの移動権限がありません: カードメンバーではありません')
        alert('カードの移動権限がありません: カードメンバーではありません')
        return // 権限がない場合は処理を終了
      }
    }

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
            
            // リスト変更イベントを発火（S3自動保存用）
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('listChanged'))
            }
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
      const draggedTask = tasksById[activeId]
      
      // カードの移動権限をチェック（総務・管理者は全て移動可能、その他はメンバーのみ）
      const isAdminOrHr = currentUserRole === 'admin' || currentUserRole === 'hr'
      const cardMemberIds = (draggedTask.members || []).map((m: any) => m.id || m.employeeId || m.employee?.id).filter(Boolean)
      const isCardMember = cardMemberIds.includes(currentUserId || '') || draggedTask.createdBy === currentUserId
      
      if (!isAdminOrHr && !isCardMember) {
        console.log('カードの移動権限がありません: カードメンバーではありません')
        alert('カードの移動権限がありません: カードメンバーではありません')
        return
      }

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
          
          // カード変更イベントを発火（S3自動保存用）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cardChanged'))
          }
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
          
          // リスト変更イベントを発火（S3自動保存用）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('listChanged'))
          }
          
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
          
          // リスト変更イベントを発火（S3自動保存用）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('listChanged'))
          }
          
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
          
          // リスト変更イベントを発火（S3自動保存用）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('listChanged'))
          }
          
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
    console.log('handleTaskClick called:', task.id, task.title)
    console.log('Current user:', currentUserId, currentUserRole)
    
    // カード閲覧権限をチェック（簡略化版）
    if (currentUserRole && currentUserId) {
      // 管理者・総務は全てのカードを開ける
      if (currentUserRole === 'admin' || currentUserRole === 'hr') {
        console.log('Admin/HR user, opening dialog')
        setSelectedTask(task)
        setDialogOpen(true)
        return
      }
      
      // 他のロールは、カードのメンバーであるか作成者である場合のみ開ける
      const isMember = task.members?.some(m => m.id === currentUserId)
      const isCreator = task.assignee === currentUserId // assigneeを作成者として扱う
      
      console.log('Permission check:', { isMember, isCreator, members: task.members, assignee: task.assignee })
      
      if (!isMember && !isCreator) {
        console.log('Permission denied')
        alert("このカードを開く権限がありません")
        return
      }
    }
    
    console.log('Opening dialog with task:', task)
    setSelectedTask(task)
    setDialogOpen(true)
    console.log('Dialog state updated:', { task, dialogOpen: true })
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
                     email: member.employee?.email || member.email,
                     employee: member.employee, // employeeオブジェクト全体を保持
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
        
        // カード変更イベントを発火（S3自動保存用）
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cardChanged'))
        }
        
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
  
  // スクロールコンテナのref
  const desktopScrollContainerRef = useRef<HTMLDivElement>(null)

  // モバイル・PC共通: ドラッグ中に自動スクロール（カーソル位置に応じて隣のリストを表示）
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoScrollAnimationFrameRef = useRef<number | null>(null) // requestAnimationFrame用
  const lastMouseXRef = useRef<number>(0)
  const lastTouchXRef = useRef<number>(0)
  const dragStartCardCenterXRef = useRef<number | null>(null) // ドラッグ開始時のカード中心位置
  
  useEffect(() => {
    // マウス位置を追跡（PC用）
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseXRef.current = e.clientX
    }
    
    // タッチ位置を追跡（モバイル用）
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        lastTouchXRef.current = e.touches[0].clientX
      }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        lastTouchXRef.current = e.touches[0].clientX
      }
    }
    
    if (activeId) {
      // 初期位置を設定（ドラッグ開始時の位置を取得）
      if (isMobile) {
        // モバイルの場合はタッチ開始時にも位置を記録
        window.addEventListener('touchstart', handleTouchStart, { passive: true })
      }
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
      return () => {
        if (isMobile) {
          window.removeEventListener('touchstart', handleTouchStart)
        }
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('touchmove', handleTouchMove)
      }
    } else {
      // ドラッグが終了したら位置をリセット
      lastMouseXRef.current = 0
      lastTouchXRef.current = 0
      dragStartCardCenterXRef.current = null // ドラッグ開始位置をリセット
      
      // ドラッグ終了時に自動スクロールを停止
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
        autoScrollIntervalRef.current = null
      }
      if (autoScrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollAnimationFrameRef.current)
        autoScrollAnimationFrameRef.current = null
      }
      if (autoMoveToClosestListRef.current) {
        clearTimeout(autoMoveToClosestListRef.current)
        autoMoveToClosestListRef.current = null
      }
      lastMovedListIdRef.current = null // リセット
    }
  }, [activeId, isMobile])
  
  const handleDragOverWithAutoScroll = (event: DragOverEvent) => {
    handleDragOver(event)
    
    if (!activeId || !desktopScrollContainerRef.current) return
    
    // タスクがドラッグされている場合のみ処理
    if (!tasksById[activeId]) return
    
    const container = desktopScrollContainerRef.current
    const containerRect = container.getBoundingClientRect()
    
    // ポインタ位置を取得（イベントから直接取得、またはリファレンスから）
    let pointerX = 0
    if (event.activatorEvent && 'clientX' in event.activatorEvent) {
      pointerX = (event.activatorEvent as { clientX: number }).clientX
    } else if (event.activatorEvent && 'touches' in event.activatorEvent) {
      const touches = (event.activatorEvent as TouchEvent).touches
      if (touches && touches.length > 0) {
        pointerX = touches[0].clientX
      }
    } else {
      // フォールバック: リファレンスから取得
      pointerX = isMobile ? lastTouchXRef.current : lastMouseXRef.current
    }
    
    // モバイルの場合、カードを左右に動かしたときの滑らかなスクロール処理
    // 実際のスマホでも動作するように、カードの位置を基準にする
    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    if (isMobile || isTouchDevice) {
      // 既存の自動スクロールをクリア
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
        autoScrollIntervalRef.current = null
      }
      
      // カード要素を取得（タッチイベントに依存しない）
      const allCards = document.querySelectorAll('[data-sortable-id]')
      let activeCardElement: Element | null = null
      
      for (const card of allCards) {
        if (card.getAttribute('data-sortable-id') === activeId) {
          activeCardElement = card
          break
        }
      }
      
      // カード要素が見つかった場合、カードの位置を基準にスクロール
      if (activeCardElement) {
        const cardRect = activeCardElement.getBoundingClientRect()
        const cardCenterX = cardRect.left + cardRect.width / 2 // カードの中心位置
        
        // モバイル用：最も近いリストに自動移動（左右に動かし始めたら即座に移動）
        if (isMobile && activeId) {
          // 既存のタイマーをクリア
          if (autoMoveToClosestListRef.current) {
            clearTimeout(autoMoveToClosestListRef.current)
            autoMoveToClosestListRef.current = null
          }
          
          // 即座に最も近いリストに移動（50ms以内）
          autoMoveToClosestListRef.current = setTimeout(() => {
            autoMoveToClosestList(cardCenterX, activeId)
            autoMoveToClosestListRef.current = null
          }, 50)
        }
        
        const containerWidth = containerRect.width
        const containerCenter = containerRect.left + containerWidth / 2
        
        // ドラッグ開始位置からの移動距離を計算
        const dragStartX = dragStartCardCenterXRef.current ?? cardCenterX
        const dragDistance = cardCenterX - dragStartX
        const dragDistancePercent = Math.abs(dragDistance) / containerWidth
        
        // 画面の中心からの距離を計算
        const distanceFromCenter = cardCenterX - containerCenter
        const normalizedDistance = distanceFromCenter / (containerWidth / 2) // -1 to 1
        
        // スクロール速度を大幅に上げる（さらに2倍高速化）
        // ドラッグ距離が大きいほど速く、画面端に近いほど速く
        const maxSpeed = 160 // 160px/frame = 約9600px/s（60fps時、さらに2倍高速化）
        const minSpeed = 40 // 40px/frame = 約2400px/s（60fps時）
        const baseSpeed = Math.max(minSpeed, Math.abs(normalizedDistance) * maxSpeed)
        // ドラッグ距離が大きい場合、さらに速度を上げる
        const dragBonus = Math.min(dragDistancePercent * 80, 60) // 最大60px/frameのボーナス（さらに2倍）
        const scrollSpeed = baseSpeed + dragBonus
        
        // スクロール開始の感度を調整（Trello風：画面端を広めに、より敏感に）
        const sensitivityZone = containerWidth * 0.3 // 画面端30%の範囲（Trello風、より広く）
        const minDragThreshold = containerWidth * 0.02 // 画面幅の2%以上動いたらスクロール開始（より敏感に）
        
        // 左側スクロール判定（Trello風：画面端30%の範囲 OR 左に2%以上動いた）
        const shouldScrollLeft = cardCenterX < containerRect.left + sensitivityZone || 
                                 (dragDistance < -minDragThreshold)
        
        if (shouldScrollLeft) {
          // 既存のアニメーションフレームをクリア
          if (autoScrollAnimationFrameRef.current !== null) {
            cancelAnimationFrame(autoScrollAnimationFrameRef.current)
            autoScrollAnimationFrameRef.current = null
          }
          
          // requestAnimationFrameで滑らかにスクロール
          const scrollLeft = () => {
            if (desktopScrollContainerRef.current && activeId) {
              // カードの位置を再取得（ドラッグ中の位置変化に対応）
              const currentCard = document.querySelector(`[data-sortable-id="${activeId}"]`)
              if (currentCard) {
                const currentCardRect = currentCard.getBoundingClientRect()
                const currentCardCenterX = currentCardRect.left + currentCardRect.width / 2
                
                // カードの現在位置を再計算
                const currentDragDistance = currentCardCenterX - dragStartX
                // 左側スクロール継続条件：画面左30%範囲内 OR 左に2%以上動いている（Trello風）
                const shouldContinueLeft = currentCardCenterX < containerRect.left + sensitivityZone || 
                                           currentDragDistance < -minDragThreshold
                
                if (shouldContinueLeft) {
                  const currentScrollLeft = desktopScrollContainerRef.current.scrollLeft
                  if (currentScrollLeft > 0) {
                    // 距離に応じた速度でスクロール（Trello風：高速、滑らかに）
                    // 残り距離に応じて速度を調整（近いほど遅く、遠いほど速く）
                    const remainingDistance = currentScrollLeft
                    const speedFactor = remainingDistance < 100 ? Math.max(0.3, remainingDistance / 100) : 1
                    const speed = Math.min(scrollSpeed * speedFactor, remainingDistance) // 残り距離を超えないように
                    desktopScrollContainerRef.current.scrollLeft -= speed // 直接代入で高速化
                    // 次のフレームをスケジュール
                    autoScrollAnimationFrameRef.current = requestAnimationFrame(scrollLeft)
                  } else {
                    // スクロール終了
                    autoScrollAnimationFrameRef.current = null
                  }
                } else {
                  // カードが範囲外に出たらスクロール停止
                  autoScrollAnimationFrameRef.current = null
                }
              } else {
                // カードが見つからない
                autoScrollAnimationFrameRef.current = null
              }
            } else {
              // コンテナまたはアクティブIDが無い
              autoScrollAnimationFrameRef.current = null
            }
          }
          
          // 初回のアニメーションフレームをスケジュール
          autoScrollAnimationFrameRef.current = requestAnimationFrame(scrollLeft)
          return
        }
        
        // 右側スクロール判定（Trello風：画面端30%の範囲 OR 右に2%以上動いた）
        const shouldScrollRight = cardCenterX > containerRect.right - sensitivityZone || 
                                  (dragDistance > minDragThreshold)
        
        if (shouldScrollRight) {
          // 既存のアニメーションフレームをクリア
          if (autoScrollAnimationFrameRef.current !== null) {
            cancelAnimationFrame(autoScrollAnimationFrameRef.current)
            autoScrollAnimationFrameRef.current = null
          }
          
          // requestAnimationFrameで滑らかにスクロール
          const scrollRight = () => {
            if (desktopScrollContainerRef.current && activeId) {
              // カードの位置を再取得（ドラッグ中の位置変化に対応）
              const currentCard = document.querySelector(`[data-sortable-id="${activeId}"]`)
              if (currentCard) {
                const currentCardRect = currentCard.getBoundingClientRect()
                const currentCardCenterX = currentCardRect.left + currentCardRect.width / 2
                
                // カードの現在位置を再計算
                const currentDragDistance = currentCardCenterX - dragStartX
                // 右側スクロール継続条件：画面右30%範囲内 OR 右に2%以上動いている（Trello風）
                const shouldContinueRight = currentCardCenterX > containerRect.right - sensitivityZone || 
                                            currentDragDistance > minDragThreshold
                
                if (shouldContinueRight) {
                  const currentScrollLeft = desktopScrollContainerRef.current.scrollLeft
                  const maxScrollLeft = desktopScrollContainerRef.current.scrollWidth - desktopScrollContainerRef.current.clientWidth
                  if (currentScrollLeft < maxScrollLeft) {
                    // 距離に応じた速度でスクロール（Trello風：高速、滑らかに）
                    const remainingDistance = maxScrollLeft - currentScrollLeft
                    // 残り距離に応じて速度を調整（近いほど遅く、遠いほど速く）
                    const speedFactor = remainingDistance < 100 ? Math.max(0.3, remainingDistance / 100) : 1
                    const speed = Math.min(scrollSpeed * speedFactor, remainingDistance) // 残り距離を超えないように
                    desktopScrollContainerRef.current.scrollLeft += speed // 直接代入で高速化
                    // 次のフレームをスケジュール
                    autoScrollAnimationFrameRef.current = requestAnimationFrame(scrollRight)
                  } else {
                    // スクロール終了
                    autoScrollAnimationFrameRef.current = null
                  }
                } else {
                  // カードが範囲外に出たらスクロール停止
                  autoScrollAnimationFrameRef.current = null
                }
              } else {
                // カードが見つからない
                autoScrollAnimationFrameRef.current = null
              }
            } else {
              // コンテナまたはアクティブIDが無い
              autoScrollAnimationFrameRef.current = null
            }
          }
          
          // 初回のアニメーションフレームをスケジュール
          autoScrollAnimationFrameRef.current = requestAnimationFrame(scrollRight)
          return
        }
      }
    }
    
    // pointerXが0の場合（初期化されていない）は処理をスキップ（PC用のフォールバック）
    if (pointerX === 0 && !isMobile) return
    
    // ドラッグ中のカード要素を取得（data-sortable-id属性で検索）
    const allCards = document.querySelectorAll('[data-sortable-id]')
    let activeCardElement: Element | null = null
    
    for (const card of allCards) {
      if (card.getAttribute('data-sortable-id') === activeId) {
        activeCardElement = card
        break
      }
    }
    
    // カード要素が見つかった場合、リストからのはみ出しを判定
    if (activeCardElement) {
      const cardRect = activeCardElement.getBoundingClientRect()
      
      // カードがどのリストに属しているか判定
      const currentList = lists.find(list => list.taskIds.includes(activeId))
      if (currentList) {
        // リスト要素を取得
        const listElement = document.querySelector(`[data-list-id="${currentList.id}"]`)
        if (listElement) {
          const listRect = listElement.getBoundingClientRect()
          
          // カードの幅の1/3を計算
          const cardWidth = cardRect.width
          const oneThirdCardWidth = cardWidth / 3
          
          // カードがリストの左境界から1/3以上はみ出しているか
          const isOverflowingLeft = cardRect.left < listRect.left - oneThirdCardWidth
          
          // カードがリストの右境界から1/3以上はみ出しているか
          const isOverflowingRight = cardRect.right > listRect.right + oneThirdCardWidth
          
          // 既存の自動スクロールをクリア
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current)
            autoScrollIntervalRef.current = null
          }
          
          if (isOverflowingLeft || isOverflowingRight) {
            const scrollSpeed = isMobile ? 25 : 20
            
            if (isOverflowingLeft) {
              // 左にスクロール（隣のリストが見えるように）
              autoScrollIntervalRef.current = setInterval(() => {
                if (desktopScrollContainerRef.current && activeId) {
                  desktopScrollContainerRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' })
                } else if (autoScrollIntervalRef.current) {
                  clearInterval(autoScrollIntervalRef.current)
                  autoScrollIntervalRef.current = null
                }
              }, 10)
            } else if (isOverflowingRight) {
              // 右にスクロール（隣のリストが見えるように）
              autoScrollIntervalRef.current = setInterval(() => {
                if (desktopScrollContainerRef.current && activeId) {
                  desktopScrollContainerRef.current.scrollBy({ left: scrollSpeed, behavior: 'auto' })
                } else if (autoScrollIntervalRef.current) {
                  clearInterval(autoScrollIntervalRef.current)
                  autoScrollIntervalRef.current = null
                }
              }, 10)
            }
            
            return // カード要素が見つかり、はみ出しが検出されたら処理終了
          }
        }
      }
    }
    
    // フォールバック: 画面端に近い場合の従来の動作
    const scrollThreshold = isMobile ? 100 : 150
    const scrollSpeed = isMobile ? 25 : 15
    
    // 既存の自動スクロールをクリア
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
      autoScrollIntervalRef.current = null
    }
    
    if (pointerX < containerRect.left + scrollThreshold) {
      // 左端に近い場合、左にスクロール（スムーズに）
      autoScrollIntervalRef.current = setInterval(() => {
        if (desktopScrollContainerRef.current && activeId) {
          desktopScrollContainerRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' })
        } else if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current)
          autoScrollIntervalRef.current = null
        }
      }, 10) // 約100fpsでよりスムーズに
    } else if (pointerX > containerRect.right - scrollThreshold) {
      // 右端に近い場合、右にスクロール（スムーズに、特にモバイルで速く）
      const rightScrollSpeed = isMobile ? 30 : 20 // モバイルではより速くスクロール
      autoScrollIntervalRef.current = setInterval(() => {
        if (desktopScrollContainerRef.current && activeId) {
          desktopScrollContainerRef.current.scrollBy({ left: rightScrollSpeed, behavior: 'auto' })
        } else if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current)
          autoScrollIntervalRef.current = null
        }
      }, 10) // 約100fpsでよりスムーズに
    }
  }
  
  // ドラッグ終了時に自動スクロールを停止
  useEffect(() => {
    if (!activeId && autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
      autoScrollIntervalRef.current = null
    }
  }, [activeId])

  return (
    <div className={isMobile ? '' : 'h-full flex flex-col'}>
      <div className={`flex items-center ${isMobile ? 'justify-center' : 'justify-end'} mb-4 flex-shrink-0`}>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className={isMobile ? "h-8 px-3 gap-2" : "h-8 gap-2"}
          >
            <LayoutGrid className="w-4 h-4" />
            カード
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={isMobile ? "h-8 px-3 gap-2" : "h-8 gap-2"}
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
        onDragOver={handleDragOverWithAutoScroll}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null)
          // モバイルの場合のクリーンアップ（現在は不要だが、将来の拡張用に残す）
          if (isMobile) {
            // 距離ベースのアクティベーションにより、bodyのtouchAction変更は不要
          }
        }}
      >
        {/* モバイル・PC共通: 横スクロール表示（スムーズスクロール、リスト幅固定） */}
        {/* PCでは最下部に横スクロールバーを設置 */}
        <div 
          ref={desktopScrollContainerRef}
          className={`flex gap-4 md:gap-6 overflow-x-auto pb-4 scroll-smooth ${!isMobile ? 'flex-1 min-h-0' : ''}`}
          style={{
            scrollBehavior: 'smooth',
            touchAction: isMobile ? 'pan-x pan-y pinch-zoom' : 'auto', // モバイルでは横スクロールと縦スクロールの両方を許可（親要素の縦スクロールも有効化）
            WebkitOverflowScrolling: 'touch', // iOSでのスムーズスクロール
            overscrollBehaviorX: 'contain', // 横スクロールのオーバースクロールを抑制
          }}
        >
          {lists.length > 0 ? (
            <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => {
                const listTasks = list.taskIds?.map((id) => tasksById[id]).filter(Boolean) || []
                // 折りたたみ状態をlocalStorageから取得（collapseUpdateTriggerで再レンダリングを促す）
                const isCollapsed = typeof window !== 'undefined' ? 
                  (() => {
                    // 常時運用タスクリストはデフォルトで畳んだ状態
                    if ((list.name || list.title) === "常時運用タスク") {
                      const saved = localStorage.getItem(`list-collapsed-${list.id}`)
                      return saved === 'true' || saved === null
                    }
                    const saved = localStorage.getItem(`list-collapsed-${list.id}`)
                    return saved === 'true'
                  })() : false
                // collapseUpdateTriggerを参照して再レンダリングを促す
                void collapseUpdateTrigger
                
                return (
                  <div
                    key={list.id}
                    data-list-id={list.id}
                    style={{
                      width: isCollapsed ? '48px' : '320px', // 折りたたみ時は48px（w-12）、展開時は320px
                      minWidth: isCollapsed ? '48px' : '320px', // 折りたたみ時は48px、展開時は320px
                    }}
                    className="flex-shrink-0 px-2 md:px-0"
                  >
                    <KanbanColumn
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
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      activeId={activeId}
                      isMobile={isMobile}
                    />
                  </div>
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
              <div className="flex-shrink-0 w-[320px] px-2 md:px-0">
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
          {activeId && typeof activeId === 'string' && activeTask && activeTask.id && tasksById[activeTask.id] && activeTask.id === activeId ? (
            <div 
              className="cursor-grabbing"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3)) brightness(1.05)',
                zIndex: 1000,
                opacity: 0.8, // 移動中のカードを透過
                transform: 'rotate(2deg) scale(1.05)',
                transition: 'none', // ドラッグ中はアニメーションを無効化
                animation: 'dragStart 0.2s ease-out forwards',
                cursor: 'grabbing', // グーに握ったカーソル
              }}
            >
              {viewMode === "list" ? (
                <CompactTaskCard task={activeTask} onClick={() => {}} isDragging={false} isMobile={isMobile} activeId={activeId} />
              ) : (
                <TaskCard task={activeTask} onClick={() => {}} isDragging={false} isMobile={isMobile} activeId={activeId} />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

               {selectedTask && (
                 <TaskDetailDialog 
                   task={selectedTask} 
                   open={dialogOpen} 
                   onOpenChange={(open) => {
                     console.log('TaskDetailDialog onOpenChange:', open, 'task:', selectedTask?.id)
                     setDialogOpen(open)
                   }}
                   onRefresh={onRefresh}
                   onTaskUpdate={handleTaskUpdate}
                 />
               )}
      
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
