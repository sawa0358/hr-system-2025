"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { getPermissions, checkWorkspacePermissions, checkBoardPermissions, checkListPermissions } from "@/lib/permissions"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { WorkspaceManagerDialog } from "@/components/workspace-manager-dialog"
import { BoardManagerDialog } from "@/components/board-manager-dialog"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskCalendar } from "@/components/task-calendar"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { TaskSearchFilters, type TaskFilters } from "@/components/task-search-filters"
import { ArchiveLargeView } from "@/components/archive-large-view"
import { Plus, Filter, LayoutGrid, Calendar, Settings, Edit, Trash2, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { employees } from "@/lib/mock-data" // モックデータの代わりに実際のデータベースから取得

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
  const [boardScale, setBoardScale] = useState(0.8) // 80%を初期値とする
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
  
  // 社員データ
  const [employees, setEmployees] = useState<any[]>([])

  // 社員データを取得
  useEffect(() => {
    fetchEmployees()
  }, [])

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

  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees from /api/employees")
      const response = await fetch("/api/employees")
      console.log("Response status:", response.status, "Response ok:", response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Raw response data:", data)
      
      // レスポンスが配列の場合とオブジェクトの場合の両方に対応
      const employeesArray = Array.isArray(data) ? data : data.employees || []
      
      if (employeesArray.length > 0) {
        setEmployees(employeesArray)
        console.log("Employees fetched successfully:", employeesArray.length, "employees")
      } else {
        console.warn("No employees found in response")
        setEmployees([])
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error)
      setEmployees([])
    }
  }

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
    // ダイアログを開く前に社員データを再取得
    fetchEmployees()
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
      // ダイアログを開く前に社員データを再取得
      fetchEmployees()
      setEditingWorkspace(workspace)
      setWorkspaceDialogOpen(true)
    }
  }

  const handleSaveWorkspace = async (data: { name: string; description: string; memberIds: string[] }) => {
    try {
      if (editingWorkspace?.id) {
        // 更新
        console.log("Updating workspace:", editingWorkspace.id, "with data:", data)
        const response = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          const result = await response.json()
          console.log("Workspace updated successfully:", result.workspace)
          await fetchWorkspaces() // ワークスペースリストを更新
          
          // 現在選択中のワークスペースの場合、ボードもリフレッシュ
          if (currentWorkspace === editingWorkspace.id && currentBoard) {
            await fetchBoardData()
          }
          
          setWorkspaceDialogOpen(false)
          setEditingWorkspace(null)
        } else {
          const errorData = await response.json()
          console.error("Failed to update workspace:", errorData)
          alert(`ワークスペースの更新に失敗しました: ${errorData.error || '不明なエラー'}`)
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
        console.log("Response status:", response.status)
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
                  { title: "常時運用タスク" },
                  { title: "予定リスト" },
                  { title: "進行中" },
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
        } else {
          const errorData = await response.json()
          console.error("Failed to create workspace:", errorData)
          alert(`ワークスペースの作成に失敗しました: ${errorData.error || '不明なエラー'}`)
        }
      }
    } catch (error) {
      console.error("Failed to save workspace:", error)
      alert(`ワークスペースの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
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
        // 新規作成 - 現在のボードをテンプレートとして使用
        const requestData = {
          ...data,
          templateBoardId: currentBoard || undefined, // 現在のボードIDをテンプレートとして送信
        }
        console.log("[v0] Creating new board with template:", requestData)
        
        const response = await fetch("/api/boards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser?.id || "",
          },
          body: JSON.stringify(requestData),
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

  // AIに渡すコンテキスト情報を構築
  const buildAIContext = () => {
    const workspace = workspaces.find(w => w.id === currentWorkspace)
    const board = boards.find(b => b.id === currentBoard)
    
    const filterDescriptions = []
    if (taskFilters.freeWord) filterDescriptions.push(`検索キーワード: ${taskFilters.freeWord}`)
    if (taskFilters.member !== 'all') filterDescriptions.push(`担当者: ${taskFilters.member}`)
    if (taskFilters.showArchived) filterDescriptions.push(`アーカイブ表示: ON`)
    if (taskFilters.dateFrom) filterDescriptions.push(`開始日: ${taskFilters.dateFrom}`)
    if (taskFilters.dateTo) filterDescriptions.push(`終了日: ${taskFilters.dateTo}`)

    const listNames = currentBoardData?.lists?.map((list: any) => list.title).join('、') || '未設定'
    const taskCount = currentBoardData?.lists?.reduce((acc: number, list: any) => acc + (list.cards?.length || 0), 0) || 0

    return `【現在のページ】タスク管理（カンバンボード）
【ページの説明】プロジェクト単位でタスクを管理するカンバンボードシステムです

【現在のユーザー】
- 名前: ${currentUser?.name || '不明'}
- 役職: ${currentUser?.position || '不明'}
- 部署: ${currentUser?.department || '不明'}
- 権限: ${currentUser?.role === 'admin' ? '管理者（全機能利用可）' : permissions?.createWorkspace ? 'リーダー（ワークスペース作成可）' : '一般ユーザー'}

【現在の状態】
- ワークスペース: ${workspace?.name || '未選択'}
- ボード: ${board?.name || '未選択'}
- リスト構成: ${listNames}
- タスク総数: ${taskCount}件
- カレンダー表示: ${showCalendar ? 'ON' : 'OFF'}
- フィルター表示: ${showFilters ? 'ON' : 'OFF'}

【現在適用されているフィルター】
${filterDescriptions.length > 0 ? filterDescriptions.join('\n') : 'フィルターなし'}

【利用可能な機能】
${permissions?.createWorkspace ? `- ワークスペースの作成・編集・削除
- ボードの作成・編集・削除
- タスクの作成・編集・削除
- タスクの割り当て` : `- ボードの閲覧
- タスクの閲覧
- タスクへのコメント`}
- カレンダービュー
- タスク検索・フィルター
- データエクスポート

【このページで質問できること】
- カンバンボードの使い方
- ワークスペースとボードの管理方法
- タスクの作成・編集・割り当て方法
- フィルター機能の使い方
- カレンダー機能の使い方
- 権限設定について
- その他、タスク管理に関する質問`
  }

  return (
    <main className="overflow-y-auto">
      {/* 上部セクション - 背景色#B4D5E7 */}
      <div className="px-8 py-6" style={{ backgroundColor: '#B4D5E7' }}>
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
            <AIAskButton context={buildAIContext()} />
          </div>
        </div>

        {/* ワークスペースとボード選択 */}
        <div className="flex items-center gap-6 mb-6">
          <WorkspaceSelector
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            currentUserId={currentUser?.id}
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
                workspace.members?.map((m: any) => m.employeeId) || [],
                workspace.name
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
                workspace.members?.map((m: any) => m.employeeId) || [],
                workspace.name
              ).canDelete
            })()}
            showSearch={currentUser?.role === 'admin'} // 管理者のみ検索機能を表示
          />
          
          {currentWorkspace && (
            <>
              <div className="flex items-center gap-3">
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
                  const board = boards.find(b => b.id === currentBoard)
                  return checkBoardPermissions(
                    currentUser.role,
                    currentUser.id,
                    board?.createdBy || workspace.createdBy || '',
                    workspace.name,
                    workspace.createdBy
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
                  const board = boards.find(b => b.id === currentBoard)
                  const boardPermissions = checkBoardPermissions(
                    currentUser.role,
                    currentUser.id,
                    board?.createdBy || workspace.createdBy || '',
                    workspace.name,
                    workspace.createdBy
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
                
                {/* ボードサイズ調整 */}
                <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">サイズ:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBoardScale(Math.max(0.5, boardScale - 0.1))}
                  disabled={boardScale <= 0.5}
                  className="h-8 w-8 p-0"
                >
                  <span className="text-sm">-</span>
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {Math.round(boardScale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBoardScale(Math.min(1.5, boardScale + 0.1))}
                  disabled={boardScale >= 1.5}
                  className="h-8 w-8 p-0"
                >
                  <span className="text-sm">+</span>
                </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* フィルターとカレンダー */}
        {currentWorkspace && (
          <>
            {showFilters && (
              <div className="mb-6">
                <TaskSearchFilters onFilterChange={(filters) => {
                  console.log("Task filters changed:", filters)
                  setTaskFilters(filters)
                }} />
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
          </>
        )}
      </div>

      {/* アーカイブ表示またはカンバンボード */}
      <div style={{ backgroundColor: '#E6DDCD', padding: '0', width: '100%' }}>
        {taskFilters.showArchived && currentBoard ? (
          <ArchiveLargeView
            boardId={currentBoard}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            onRefresh={() => currentBoard && fetchBoardData(currentBoard)}
            onBack={() => {
              setTaskFilters(prev => ({ ...prev, showArchived: false }))
            }}
          />
        ) : currentBoard ? (
          <div 
            style={{ 
              transform: `scale(${boardScale})`,
              transformOrigin: 'top left',
              width: `${100 / boardScale}%`,
              height: `${100 / boardScale}%`,
              minWidth: '100%'
            }}
          >
            <KanbanBoard 
              ref={kanbanBoardRef}
              boardData={currentBoardData} 
              currentUserId={currentUser?.id}
              currentUserRole={currentUser?.role}
              workspaceData={workspaces.find(w => w.id === currentWorkspace)} // ワークスペース情報を渡す
              onRefresh={() => currentBoard && fetchBoardData(currentBoard)}
              showArchived={false}
              dateFrom={taskFilters.dateFrom}
              dateTo={taskFilters.dateTo}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2">ボードが選択されていません</p>
            <p className="text-sm">上からボードを選択するか、新しいボードを作成してください</p>
          </div>
        )}
      </div>

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
