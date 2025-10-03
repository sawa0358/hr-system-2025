"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Plus, ChevronLeft, ChevronRight, FileText, LayoutGrid, List, GripVertical } from "lucide-react"
import { kanbanTasks, taskTemplates } from "@/lib/mock-data"
import { TaskDetailDialog } from "./task-detail-dialog"
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
  dueDate: string
  priority: "low" | "medium" | "high"
  comments: number
  attachments: number
  status: string
  cardColor?: string
  labels?: { id: string; name: string; color: string }[]
}

interface KanbanList {
  id: string
  title: string
  taskIds: string[]
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
        return priority
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-1"
        onClick={onClick}
        style={{ backgroundColor: task.cardColor || "white" }}
      >
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-slate-900 text-xs truncate block">{task.title}</span>
            </div>
            <Badge variant="secondary" className={`text-xs flex-shrink-0 ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">{task.dueDate}</span>
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
        return priority
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-2"
        onClick={onClick}
        style={{ backgroundColor: task.cardColor || "white" }}
      >
        <CardContent className="p-2">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm leading-relaxed">{task.title}</h3>
                <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </Badge>
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
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                    {task.assignee.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{task.dueDate}</span>
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
        return priority
    }
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={onClick}
      style={{ backgroundColor: task.cardColor || "white" }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-900 text-sm truncate">{task.title}</h3>
      </div>
      <Badge variant="secondary" className={`text-xs flex-shrink-0 ${getPriorityColor(task.priority)}`}>
        {getPriorityLabel(task.priority)}
      </Badge>
      <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0 min-w-[90px]">
        <Calendar className="w-3 h-3" />
        <span>{task.dueDate}</span>
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
}: {
  list: KanbanList
  tasks: Task[]
  viewMode: "card" | "list"
  onTaskClick: (task: Task) => void
  onAddCard: () => void
  onAddFromTemplate: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (isCollapsed) {
    return (
      <div ref={setNodeRef} style={style} className="flex-shrink-0 w-12">
        <div className="bg-slate-100 rounded-lg p-2 h-full min-h-[400px] flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
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
    <div ref={setNodeRef} style={style} className="flex-1 min-w-[300px]">
      <div className="bg-slate-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-slate-500" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold text-slate-900">{list.title}</h2>
          </div>
          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
            {tasks.length}
          </Badge>
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
            {taskTemplates.map((template) => (
              <Card
                key={template.id}
                className="border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                onClick={() => {
                  onAddFromTemplate()
                  setShowTemplateDialog(false)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{template.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      テンプレート
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                  {template.labels && template.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.labels.map((label) => (
                        <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white text-xs">
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {taskTemplates.length === 0 && <p className="text-center text-slate-500 py-8">テンプレートがありません</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function KanbanBoard() {
  const [viewMode, setViewMode] = useState<"card" | "list">("card")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const [lists, setLists] = useState<KanbanList[]>([
    { id: "todo", title: "未着手", taskIds: kanbanTasks.filter((t) => t.status === "todo").map((t) => t.id) },
    {
      id: "in-progress",
      title: "進行中",
      taskIds: kanbanTasks.filter((t) => t.status === "in-progress").map((t) => t.id),
    },
    { id: "review", title: "レビュー", taskIds: kanbanTasks.filter((t) => t.status === "review").map((t) => t.id) },
    { id: "done", title: "完了", taskIds: kanbanTasks.filter((t) => t.status === "done").map((t) => t.id) },
  ])

  const [tasksById, setTasksById] = useState<Record<string, Task>>(
    kanbanTasks.reduce((acc, task) => ({ ...acc, [task.id]: task }), {}),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a list
    if (lists.find((list) => list.id === activeId)) {
      const oldIndex = lists.findIndex((list) => list.id === activeId)
      const newIndex = lists.findIndex((list) => list.id === overId)

      if (oldIndex !== newIndex) {
        setLists(arrayMove(lists, oldIndex, newIndex))
      }
      return
    }

    // Check if dragging a task within the same list
    if (tasksById[activeId] && activeId !== overId) {
      const list = lists.find((list) => list.taskIds.includes(activeId))
      if (!list) return

      const oldIndex = list.taskIds.indexOf(activeId)
      const newIndex = list.taskIds.indexOf(overId)

      if (oldIndex !== newIndex) {
        setLists((lists) =>
          lists.map((l) => {
            if (l.id === list.id) {
              return { ...l, taskIds: arrayMove(l.taskIds, oldIndex, newIndex) }
            }
            return l
          }),
        )
      }
    }
  }

  const handleAddList = () => {
    const listName = prompt("リスト名を入力してください")
    if (listName) {
      const newList: KanbanList = {
        id: `list-${Date.now()}`,
        title: listName,
        taskIds: [],
      }
      setLists([...lists, newList])
      console.log("[v0] Creating new list:", listName)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
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
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => {
              const listTasks = list.taskIds.map((id) => tasksById[id]).filter(Boolean)
              return (
                <KanbanColumn
                  key={list.id}
                  list={list}
                  tasks={listTasks}
                  viewMode={viewMode}
                  onTaskClick={handleTaskClick}
                  onAddCard={() => console.log("[v0] Adding card to:", list.title)}
                  onAddFromTemplate={() => console.log("[v0] Adding from template to:", list.title)}
                />
              )
            })}
          </SortableContext>

          <div className="flex-shrink-0 w-[300px]">
            <button
              onClick={handleAddList}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 h-full min-h-[120px]"
            >
              <Plus className="w-5 h-5" />
              リストを追加
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            viewMode === "list" ? (
              <CompactTaskCard task={activeTask} onClick={() => {}} isDragging />
            ) : (
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailDialog task={selectedTask} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
