"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { getPermissions, checkWorkspacePermissions, checkBoardPermissions, checkListPermissions } from "@/lib/permissions"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { WorkspaceManagerDialog } from "@/components/workspace-manager-dialog"
import { BoardManagerDialog } from "@/components/board-manager-dialog"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskCalendar } from "@/components/task-calendar"
import { ExportMenu } from "@/components/export-menu"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { TaskSearchFilters, type TaskFilters } from "@/components/task-search-filters"
import { Plus, Filter, LayoutGrid, Calendar, Settings, Edit, Trash2, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { employees } from "@/lib/mock-data"

export default function TasksPage() {
  const { currentUser } = useAuth()
  const permissions = currentUser?.role ? getPermissions(currentUser.role) : null
  const kanbanBoardRef = useRef<any>(null)
  
  // デバッグ用ログ
  console.log("TasksPage - currentUser:", currentUser)
  console.log("TasksPage - permissions:", permissions)

  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentWorkspace')
    }
    return null
  })
  const [boards, setBoards] = useState<any[]>([])
  const [currentBoard, setCurrentBoard] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentBoard')
    }
    return null
  })
  const [currentBoardData, setCurrentBoardData] = useState<any>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    freeWord: "",
    member: "all",
    showArchived: false,
    dateFrom: "",
    dateTo: "",
  })

  // Dialog states
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false)
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null)
  const [editingBoard, setEditingBoard] = useState<any>(null)

  // ワークスペース一覧を取得
  useEffect(() => {
    if (currentUser) {
      fetchWorkspaces()
    }
  }, [currentUser])

  // ワークスペースが変更されたらlocalStorageに保存し、ボード一覧を取得
  useEffect(() => {
    if (currentWorkspace) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentWorkspace', currentWorkspace)
      }
      fetchBoards(currentWorkspace)
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentWorkspace')
      }
      setBoards([])
      setCurrentBoard(null)
    }
  }, [currentWorkspace])

  // ボード選択時にlocalStorageに保存し、データを取得
  useEffect(() => {
    if (currentBoard) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentBoard', currentBoard)
      }
      // ボード変更時は現在のボードデータをクリアしてから新しいデータを取得
      setCurrentBoardData(null)
      fetchBoardData(currentBoard)
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentBoard')
      }
    }
  }, [currentBoard])

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces", {
        headers: {
          "x-employee-id": currentUser?.id || "",
        },
      })
      const data = await response.json()
      if (data.workspaces) {
        setWorkspaces(data.workspaces)
        // 保存されたワークスペースが存在するか確認
        const savedWorkspace = typeof window !== 'undefined' ? localStorage.getItem('currentWorkspace') : null
        const workspaceExists = savedWorkspace && data.workspaces.some((w: any) => w.id === savedWorkspace)
        
        // 保存されたワークスペースが存在すれば復元、なければ最初のワークスペースを選択
        if (!currentWorkspace && data.workspaces.length > 0) {
          if (workspaceExists) {
            setCurrentWorkspace(savedWorkspace)
          } else {
            setCurrentWorkspace(data.workspaces[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    }
  }

  const fetchBoards = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: {
          "x-employee-id": currentUser?.id || "",
        },
      })
      const data = await response.json()
      if (data.workspace?.boards) {
        setBoards(data.workspace.boards)
        
        if (data.workspace.boards.length > 0) {
          // 保存されたボードが存在するか確認
          const savedBoard = typeof window !== 'undefined' ? localStorage.getItem('currentBoard') : null
          const boardExists = savedBoard && data.workspace.boards.some((b: any) => b.id === savedBoard)
          
          // 保存されたボードが存在し、かつ現在のワークスペースのボードであれば復元
          if (boardExists) {
            setCurrentBoard(savedBoard)
            fetchBoardData(savedBoard)
            console.log("Restored saved board:", savedBoard, "from workspace:", workspaceId)
          } else {
            // なければ最初のボードを選択
            const firstBoard = data.workspace.boards[0]
            setCurrentBoard(firstBoard.id)
            fetchBoardData(firstBoard.id)
            console.log("Auto-selected board:", firstBoard.name, "from workspace:", workspaceId)
          }
        } else {
          // ボードがない場合は現在のボードをクリア
          setCurrentBoard(null)
        }
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error)
    }
  }

  const fetchBoardData = async (boardId: string) => {
    try {
      console.log("Fetching board data for:", boardId)
      const response = await fetch(`/api/boards/${boardId}`, {
        headers: {
          "x-employee-id": currentUser?.id || "",
        },
      })
      const data = await response.json()
      console.log("Board data received:", data)
      
      if (data.board) {
        setCurrentBoardData(data.board)
        console.log("Current board data set:", data.board)
      }
    } catch (error) {
      console.error("Failed to fetch board data:", error)
    }
  }

  const handleCreateWorkspace = () => {
    setEditingWorkspace(null)
    setWorkspaceDialogOpen(true)
  }

  const handleWorkspaceChange = (workspaceId: string | null) => {
    console.log("Workspace changed to:", workspaceId)
    setCurrentWorkspace(workspaceId)
    // ワークスペース変更時は現在のボードとボードデータをクリア
    setCurrentBoard(null)
    setCurrentBoardData(null)
  }

  const handleEditWorkspace = () => {
    const workspace = workspaces.find((w) => w.id === currentWorkspace)
    if (workspace) {
      setEditingWorkspace(workspace)
      setWorkspaceDialogOpen(true)
    }
  }

  const handleSaveWorkspace = async (data: { name: string; description: string; memberIds: string[] }) => {
    try {
      if (editingWorkspace?.id) {
        // 更新
        const response = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          fetchWorkspaces()
        }
      } else {
        // 新規作成
        console.log("Creating workspace with user ID:", currentUser?.id)
        const response = await fetch("/api/workspaces", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          const result = await response.json()
          console.log("Workspace created successfully:", result.workspace)
          fetchWorkspaces()
          setCurrentWorkspace(result.workspace.id)
          setWorkspaceDialogOpen(false)
          setEditingWorkspace(null)
          console.log("Current workspace set to:", result.workspace.id)
          
          // デフォルトボードを作成
          try {
            const boardResponse = await fetch("/api/boards", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-employee-id": currentUser?.id || "",
              },
              body: JSON.stringify({
                name: "メインボード",
                description: "メインのタスクボードです",
                workspaceId: result.workspace.id,
              }),
            })
            
            if (boardResponse.ok) {
              const boardResult = await boardResponse.json()
              setCurrentBoard(boardResult.board.id)
              fetchBoards(result.workspace.id)
              
              // デフォルトリストを作成
              try {
                const defaultLists = [
                  { title: "未着手" },
                  { title: "進行中" },
                  { title: "レビュー" },
                  { title: "完了" }
                ]
                
                for (const listData of defaultLists) {
                  const listResponse = await fetch(`/api/boards/${boardResult.board.id}/lists`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-employee-id": currentUser?.id || "",
                    },
                    body: JSON.stringify(listData),
                  })
                  
                  if (listResponse.ok) {
                    console.log("Default list created:", listData.title)
                  }
                }
              } catch (error) {
                console.error("Failed to create default lists:", error)
              }
            }
          } catch (error) {
            console.error("Failed to create default board:", error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to save workspace:", error)
      alert("ワークスペースの保存に失敗しました")
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!editingWorkspace?.id) return
    if (!confirm("このワークスペースを削除してもよろしいですか？すべてのボードとカードも削除されます。")) return

    try {
      const response = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
        method: "DELETE",
        headers: {
          "x-employee-id": currentUser?.id || "",
        },
      })
      if (response.ok) {
        setWorkspaceDialogOpen(false)
        setEditingWorkspace(null)
        setCurrentWorkspace(null)
        fetchWorkspaces()
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error)
      alert("ワークスペースの削除に失敗しました")
    }
  }

  const handleCreateBoard = () => {
    if (!currentWorkspace) {
      alert("ワークスペースを選択してください")
      return
    }
    setEditingBoard(null)
    setBoardDialogOpen(true)
  }

  const handleEditBoard = () => {
    if (!currentBoard) return
    const board = boards.find((b) => b.id === currentBoard)
    if (board) {
      setEditingBoard(board)
      setBoardDialogOpen(true)
    }
  }

  const handleSaveBoard = async (data: { name: string; description: string; workspaceId: string }) => {
    try {
      if (editingBoard?.id) {
        // 更新
        const response = await fetch(`/api/boards/${editingBoard.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          fetchBoards(currentWorkspace!)
        }
      } else {
        // 新規作成
        const response = await fetch("/api/boards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          const result = await response.json()
          fetchBoards(currentWorkspace!)
          setCurrentBoard(result.board.id)
          setBoardDialogOpen(false)
          setEditingBoard(null)
        }
      }
    } catch (error) {
      console.error("Failed to save board:", error)
      alert("ボードの保存に失敗しました")
    }
  }

  const handleDeleteBoard = async () => {
    if (!editingBoard?.id) return
    if (!confirm("このボードを削除してもよろしいですか？すべてのカードも削除されます。")) return

    try {
      const response = await fetch(`/api/boards/${editingBoard.id}`, {
        method: "DELETE",
        headers: {
          "x-employee-id": currentUser?.id || "",
        },
      })
      if (response.ok) {
        setBoardDialogOpen(false)
        setEditingBoard(null)
        setCurrentBoard(null)
        fetchBoards(currentWorkspace!)
      }
    } catch (error) {
      console.error("Failed to delete board:", error)
      alert("ボードの削除に失敗しました")
    }
  }

  // ボードデータからすべてのタスクを取得
  const allTasks = currentBoardData?.lists?.flatMap((list: any) => 
    list.cards?.map((card: any) => ({
      id: card.id,
      title: card.title,
      dueDate: card.dueDate || "",
      priority: card.priority || "medium",
      status: card.status || list.id,
    })) || []
  ) || []

  return (
    <main className="overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">タスク管理</h1>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log("オプションボタンがクリックされました")
                  setShowCalendar(!showCalendar)
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {showCalendar ? "カレンダー非表示" : "カレンダー表示"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-2"
                onClick={() => {
                  console.log("フィルターボタンがクリックされました")
                  setShowFilters(!showFilters)
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "フィルター非表示" : "フィルター表示"}
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <AIAskButton context="タスク管理" />
            <ExportMenu />
          </div>
        </div>

        {/* ワークスペース選択 */}
        <div className="flex items-center justify-between mb-6">
          <WorkspaceSelector
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={handleWorkspaceChange}
            onCreateWorkspace={handleCreateWorkspace}
            onEditWorkspace={handleEditWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
            canCreateWorkspace={permissions?.createWorkspace || false}
            canEditWorkspace={(() => {
              if (!currentWorkspace || !currentUser?.role) return false
              const workspace = workspaces.find(w => w.id === currentWorkspace)
              if (!workspace) return false
              return checkWorkspacePermissions(
                currentUser.role,
                currentUser.id,
                workspace.createdBy || '',
                workspace.members?.map((m: any) => m.employeeId) || []
              ).canEdit
            })()}
            canDeleteWorkspace={(() => {
              if (!currentWorkspace || !currentUser?.role) return false
              const workspace = workspaces.find(w => w.id === currentWorkspace)
              if (!workspace) return false
              return checkWorkspacePermissions(
                currentUser.role,
                currentUser.id,
                workspace.createdBy || '',
                workspace.members?.map((m: any) => m.employeeId) || []
              ).canDelete
            })()}
          />
        </div>

        {/* ボード選択とフィルター */}
        {currentWorkspace && (
          <>

            {showFilters && (
              <div className="mb-6">
                <TaskSearchFilters onFilterChange={setTaskFilters} />
              </div>
            )}

            {showCalendar && (
              <div className="mb-8">
                <TaskCalendar 
                  tasks={allTasks} 
                  onTaskClick={(task) => {
                    // タスククリック時にカンバンボードからタスクを探して詳細ダイアログを開く
                    const fullTask = currentBoardData?.lists
                      ?.flatMap((list: any) => list.cards || [])
                      ?.find((card: any) => card.id === task.id)
                    
                    if (fullTask && kanbanBoardRef.current?.handleTaskClick) {
                      kanbanBoardRef.current.handleTaskClick(fullTask)
                    }
                  }}
                />
              </div>
            )}

            {/* ボード選択 */}
            <div className="flex items-center gap-3 mb-6">
              <LayoutGrid className="w-5 h-5 text-slate-600" />
              <Select value={currentBoard || undefined} onValueChange={setCurrentBoard}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="ボードを選択" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                if (!currentUser?.role) return false
                const workspace = workspaces.find(w => w.id === currentWorkspace)
                if (!workspace) return false
                return checkBoardPermissions(
                  currentUser.role,
                  currentUser.id,
                  workspace.createdBy || ''
                ).canCreate
              })() && (
                <Button variant="outline" size="sm" onClick={handleCreateBoard}>
                  <Plus className="w-4 h-4 mr-2" />
                  ボード追加
                </Button>
              )}
              {(() => {
                if (!currentUser?.role || !currentBoard) return null
                const workspace = workspaces.find(w => w.id === currentWorkspace)
                if (!workspace) return null
                const boardPermissions = checkBoardPermissions(
                  currentUser.role,
                  currentUser.id,
                  workspace.createdBy || ''
                )
                const canEdit = boardPermissions.canEdit
                const canDelete = boardPermissions.canDelete
                
                if (!canEdit && !canDelete) return null
                
                return (
                  canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log("ボード編集ボタンがクリックされました")
                        handleEditBoard()
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )
                )
              })()}
            </div>

            {/* カンバンボード */}
            {currentBoard ? (
              <KanbanBoard 
                ref={kanbanBoardRef}
                boardData={currentBoardData} 
                currentUserId={currentUser?.id}
                currentUserRole={currentUser?.role}
                onRefresh={() => currentBoard && fetchBoardData(currentBoard)}
              />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">ボードが選択されていません</p>
                <p className="text-sm">上からボードを選択するか、新しいボードを作成してください</p>
              </div>
            )}
          </>
        )}

        {/* ワークスペースが選択されていない場合 */}
        {!currentWorkspace && (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2">ワークスペースがありません</p>
            <p className="text-sm mb-6">新しいワークスペースを作成してタスク管理を始めましょう</p>
            {permissions?.createWorkspace && (
              <Button onClick={handleCreateWorkspace} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                ワークスペースを作成
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ダイアログ */}
      <WorkspaceManagerDialog
        open={workspaceDialogOpen}
        onOpenChange={setWorkspaceDialogOpen}
        workspace={editingWorkspace}
        employees={employees}
        onSave={handleSaveWorkspace}
        onDelete={handleDeleteWorkspace}
        canDelete={permissions?.deleteWorkspace || false}
      />

      {currentWorkspace && (
        <BoardManagerDialog
          open={boardDialogOpen}
          onOpenChange={setBoardDialogOpen}
          board={editingBoard}
          workspaceId={currentWorkspace}
          onSave={handleSaveBoard}
          onDelete={handleDeleteBoard}
          canDelete={(() => {
            if (!currentUser?.role || !editingBoard) return false
            const workspace = workspaces.find(w => w.id === currentWorkspace)
            if (!workspace) return false
            return checkBoardPermissions(
              currentUser.role,
              currentUser.id,
              workspace.createdBy || ''
            ).canDelete
          })()}
        />
      )}
    </main>
  )
}
