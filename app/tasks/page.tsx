"use client"

import { useState } from "react"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskCalendar } from "@/components/task-calendar"
import { ExportMenu } from "@/components/export-menu"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { TaskSearchFilters, type TaskFilters } from "@/components/task-search-filters"
import { DefaultCardSettingsDialog } from "@/components/default-card-settings-dialog"
import { Plus, Filter, LayoutGrid, Calendar, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { kanbanTasks } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function TasksPage() {
  const [currentBoard, setCurrentBoard] = useState("my-tasks")
  const [showCalendar, setShowCalendar] = useState(false)
  const [boardMembersDialogOpen, setBoardMembersDialogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    freeWord: "",
    member: "all",
    showArchived: false,
    dateFrom: "",
    dateTo: "",
  })
  const isAdmin = true

  const [boards, setBoards] = useState([
    { id: "my-tasks", name: "自分のタスク", members: ["current-user"], isPersonal: true },
    { id: "all", name: "全体ボード", members: ["all"], isDefault: true },
    { id: "engineering", name: "エンジニアリング部", members: ["user1", "user2", "user3"] },
    { id: "sales", name: "営業部", members: ["user4", "user5"] },
    { id: "project1", name: "プロジェクトA", members: ["user1", "user4", "user6"] },
  ])

  const [selectedBoardMembers, setSelectedBoardMembers] = useState<string[]>([])

  const employees = [
    { id: "user1", name: "山田太郎" },
    { id: "user2", name: "佐藤花子" },
    { id: "user3", name: "鈴木一郎" },
    { id: "user4", name: "田中美咲" },
    { id: "user5", name: "高橋健太" },
    { id: "user6", name: "伊藤さくら" },
  ]

  const handleAddBoard = () => {
    const boardName = prompt("ボード名を入力してください")
    if (boardName) {
      const newBoard = {
        id: `board-${Date.now()}`,
        name: boardName,
        members: ["current-user"],
        isPersonal: false,
      }
      setBoards([...boards, newBoard])
      console.log("[v0] Creating new board:", boardName)
    }
  }

  const handleManageBoardMembers = () => {
    const currentBoardData = boards.find((b) => b.id === currentBoard)
    if (currentBoardData) {
      setSelectedBoardMembers(currentBoardData.members)
      setBoardMembersDialogOpen(true)
    }
  }

  const handleSaveBoardMembers = () => {
    setBoards(boards.map((board) => (board.id === currentBoard ? { ...board, members: selectedBoardMembers } : board)))
    setBoardMembersDialogOpen(false)
  }

  const toggleMember = (memberId: string) => {
    setSelectedBoardMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const allTasks = Object.values(kanbanTasks)
    .flat()
    .filter((task) => task.dueDate)

  const currentBoardData = boards.find((b) => b.id === currentBoard)
  const canEditBoard = isAdmin || currentBoardData?.members.includes("current-user")

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">タスク管理</h1>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <AIAskButton context="タスク管理" />
          </div>
          <div className="flex gap-3">
            <ExportMenu />
            <DefaultCardSettingsDialog />
            <Button
              variant={showCalendar ? "default" : "outline"}
              onClick={() => setShowCalendar(!showCalendar)}
              className={showCalendar ? "" : "border-slate-300"}
            >
              <Calendar className="w-4 h-4 mr-2" />
              カレンダー表示
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "" : "border-slate-300 bg-transparent"}
            >
              <Filter className="w-4 h-4 mr-2" />
              フィルター
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6">
            <TaskSearchFilters onFilterChange={setTaskFilters} />
          </div>
        )}

        {showCalendar && (
          <div className="mb-8">
            <TaskCalendar tasks={allTasks} />
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <LayoutGrid className="w-5 h-5 text-slate-600" />
          <Select value={currentBoard} onValueChange={setCurrentBoard}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                  {board.isPersonal && " 📌"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleAddBoard}>
            <Plus className="w-4 h-4 mr-2" />
            ボード追加
          </Button>

          {canEditBoard && !currentBoardData?.isPersonal && (
            <Dialog open={boardMembersDialogOpen} onOpenChange={setBoardMembersDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleManageBoardMembers}>
                  <Users className="w-4 h-4 mr-2" />
                  メンバー管理
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ボードメンバー管理</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    このボードにアクセスできるメンバーを選択してください。
                    <br />
                    選択されたメンバーのみがタスクに追加できます。
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={employee.id}
                          checked={selectedBoardMembers.includes(employee.id)}
                          onCheckedChange={() => toggleMember(employee.id)}
                        />
                        <Label htmlFor={employee.id} className="cursor-pointer">
                          {employee.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setBoardMembersDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleSaveBoardMembers} className="bg-blue-600 hover:bg-blue-700">
                      保存
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <span className="text-xs text-slate-500 ml-2">※ 管理者・総務はすべてのボードを閲覧・編集できます</span>
          )}
        </div>

        <KanbanBoard />
      </div>
    </main>
  )
}
