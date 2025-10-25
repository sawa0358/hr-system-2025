"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getPermissions, checkWorkspacePermissions, checkBoardPermissions, checkListPermissions } from "@/lib/permissions"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { WorkspaceManagerDialog } from "@/components/workspace-manager-dialog"
import { BoardManagerDialog } from "@/components/board-manager-dialog"
import { TaskStructureGuide } from "@/components/task-structure-guide"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskCalendar } from "@/components/task-calendar"
import { AIAskButton } from "@/components/ai-ask-button"
import { Button } from "@/components/ui/button"
import { TaskSearchFilters, type TaskFilters } from "@/components/task-search-filters"
import { ArchiveLargeView } from "@/components/archive-large-view"
import { Plus, Filter, LayoutGrid, Calendar, Settings, Edit, Trash2, ChevronDown, Save, Download, Upload, History, Clock, ToggleLeft, ToggleRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"
// import { employees } from "@/lib/mock-data" // モックデータの代わりに実際のデータベースから取得

export default function TasksPage() {
  const { currentUser } = useAuth()
  const permissions = currentUser?.role ? getPermissions(currentUser.role) : null
  const { canManageTasks, canManageWorkspaces } = usePermissions()
  const kanbanBoardRef = useRef<any>(null)
  const { toast } = useToast()
  
  // デバッグ用ログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log("TasksPage - currentUser:", currentUser)
    console.log("TasksPage - permissions:", permissions)
  }

  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null)
  const [boards, setBoards] = useState<any[]>([])
  const [currentBoard, setCurrentBoard] = useState<string | null>(null)
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
  
  // S3保存・復元の状態
  // S3復元関連のstate
  const [isRestoringFromS3, setIsRestoringFromS3] = useState(false)
  const [availableBackups, setAvailableBackups] = useState<any[]>([])
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string>('')
  
  // 自動保存の状態
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  
  // 社員データ
  const [employees, setEmployees] = useState<any[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 社員データとワークスペースを並行して取得
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (currentUser) {
          // 並行してデータを取得
          await Promise.all([
            fetchEmployees(),
            fetchWorkspaces()
          ])
          
          // ワークスペース取得後に初期値を設定
          setTimeout(() => {
            if (!currentWorkspace && workspaces.length > 0) {
              // 保存されたワークスペースがない場合、マイワークスペースまたは最初のワークスペースを選択
              const myWorkspace = workspaces.find(w => w.name === `${currentUser.name}のマイワークスペース`)
              if (myWorkspace) {
                setCurrentWorkspace(myWorkspace.id)
              } else if (workspaces.length > 0) {
                setCurrentWorkspace(workspaces[0].id)
              }
            }
          }, 100)
        } else {
          // ユーザーが未ログインの場合は社員データのみ取得
          await fetchEmployees()
        }
      } catch (error) {
        console.error("初期データの読み込みに失敗:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }
    
    loadInitialData()
  }, [currentUser])

  // 認証完了後にワークスペースとボードの初期化を行う
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      // まずワークスペース・ボードの状態をリセット
      setCurrentWorkspace(null)
      setCurrentBoard(null)
      setCurrentBoardData(null)
      setBoards([])
      
      // localStorageからワークスペースを復元
      const storedWorkspace = localStorage.getItem('currentWorkspace')
      // 古いワークスペースIDをクリア
      const oldWorkspaceIds = [
        'cmgu9j0rv000c8zk87f9j152y',
        'cmgucgqpc00018zii5wvn9y8h'  // 新しい古いIDを追加
      ]
      if (storedWorkspace && oldWorkspaceIds.includes(storedWorkspace)) {
        localStorage.removeItem('currentWorkspace')
        return
      }
      
      // localStorageからボードを復元
      const storedBoard = localStorage.getItem('currentBoard')
      // 古いボードIDをクリア（古いワークスペースに関連するボードID）
      const oldBoardIds = [
        'cmgqp7gq7001m2r0lohbwodtd',
        'cmgucgqut000f8ziiozr0xjaw'  // 新しい古いボードIDを追加
      ]
      if (storedBoard && oldBoardIds.includes(storedBoard)) {
        localStorage.removeItem('currentBoard')
        return
      }

      // ワークスペースとボードを設定
      if (storedWorkspace) {
        setCurrentWorkspace(storedWorkspace)
      }
      if (storedBoard) {
        setCurrentBoard(storedBoard)
      }
    } else if (!currentUser) {
      // ユーザーがログアウトした場合は状態をリセット
      setCurrentWorkspace(null)
      setCurrentBoard(null)
      setCurrentBoardData(null)
      setBoards([])
    }
  }, [currentUser])

  // ワークスペースが変更されたらlocalStorageに保存し、ボード一覧を取得
  useEffect(() => {
    if (currentWorkspace && currentUser) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentWorkspace', currentWorkspace)
        // カスタムイベントを発火してS3に自動保存
        window.dispatchEvent(new CustomEvent('workspaceChanged'))
      }
      fetchBoards(currentWorkspace)
    } else if (!currentWorkspace && currentUser) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentWorkspace')
        // カスタムイベントを発火してS3に自動保存
        window.dispatchEvent(new CustomEvent('workspaceChanged'))
      }
      setBoards([])
      setCurrentBoard(null)
    }
  }, [currentWorkspace, currentUser])

  // ボード一覧取得後に初期ボードを設定
  useEffect(() => {
    if (boards.length > 0 && !currentBoard) {
      // 保存されたボードがない場合、マイボードまたは最初のボードを選択
      const myBoard = boards.find(b => b.name === `${currentUser?.name}のマイボード`)
      if (myBoard) {
        setCurrentBoard(myBoard.id)
      } else if (boards.length > 0) {
        setCurrentBoard(boards[0].id)
      }
    }
  }, [boards, currentBoard, currentUser])

  // ボード選択時にlocalStorageに保存し、データを取得
  useEffect(() => {
    if (currentBoard && currentUser) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentBoard', currentBoard)
        // カスタムイベントを発火してS3に自動保存
        window.dispatchEvent(new CustomEvent('boardChanged'))
      }
      // ボード変更時は現在のボードデータをクリアしてから新しいデータを取得
      setCurrentBoardData(null)
      fetchBoardData(currentBoard)
    } else if (!currentBoard && currentUser) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentBoard')
        // カスタムイベントを発火してS3に自動保存
        window.dispatchEvent(new CustomEvent('boardChanged'))
      }
      setCurrentBoardData(null)
    }
  }, [currentBoard, currentUser])

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
      if (!currentUser?.id) {
        console.log("No current user ID, skipping workspace fetch")
        return
      }
      
      console.log("Fetching workspaces for user:", currentUser.id)
      const response = await fetch("/api/workspaces", {
        headers: {
          "x-employee-id": currentUser.id,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Fetched workspaces:", data.workspaces?.length || 0)
      
      if (data.workspaces) {
        setWorkspaces(data.workspaces)
        
        // 現在のワークスペースが設定されていない場合のみ初期化
        if (!currentWorkspace && data.workspaces.length > 0) {
          // 保存されたワークスペースが存在するか確認
          const savedWorkspace = typeof window !== 'undefined' ? localStorage.getItem('currentWorkspace') : null
          const workspaceExists = savedWorkspace && data.workspaces.some((w: any) => w.id === savedWorkspace)
          
          if (workspaceExists) {
            console.log("Restoring saved workspace:", savedWorkspace)
            setCurrentWorkspace(savedWorkspace)
          } else {
            // マイワークスペースを優先的に選択
            const myWorkspace = data.workspaces.find((w: any) => w.name === `${currentUser.name}のマイワークスペース`)
            if (myWorkspace) {
              console.log("Setting my workspace:", myWorkspace.id)
              setCurrentWorkspace(myWorkspace.id)
            } else {
              console.log("Setting first workspace:", data.workspaces[0].id)
              setCurrentWorkspace(data.workspaces[0].id)
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
      setWorkspaces([])
    }
  }

  const fetchBoards = async (workspaceId: string) => {
    try {
      if (!currentUser?.id) {
        console.log("No current user ID, skipping board fetch")
        return
      }
      
      console.log("Fetching boards for workspace:", workspaceId, "user:", currentUser.id)
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: {
          "x-employee-id": currentUser.id,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Fetched boards:", data.workspace?.boards?.length || 0)
      
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
            // マイボードを優先的に選択
            const myBoard = data.workspace.boards.find((b: any) => b.name === `${currentUser.name}のマイボード`)
            if (myBoard) {
              setCurrentBoard(myBoard.id)
              fetchBoardData(myBoard.id)
              console.log("Auto-selected my board:", myBoard.name, "from workspace:", workspaceId)
            } else {
              // なければ最初のボードを選択
              const firstBoard = data.workspace.boards[0]
              setCurrentBoard(firstBoard.id)
              fetchBoardData(firstBoard.id)
              console.log("Auto-selected board:", firstBoard.name, "from workspace:", workspaceId)
            }
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
      } else if (data.error) {
        console.error("Board not found:", data.error)
        // ボードが見つからない場合、ボード選択をクリア
        setCurrentBoard(null)
        setCurrentBoardData(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentBoard')
        }
      }
    } catch (error) {
      console.error("Failed to fetch board data:", error)
      // エラーが発生した場合もボード選択をクリア
      setCurrentBoard(null)
      setCurrentBoardData(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentBoard')
      }
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
            await fetchBoardData(currentBoard)
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
          
          // デフォルトボードを作成（APIでデフォルトリストも自動作成される）
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
            }
          } catch (error) {
            console.error("Failed to create default board:", error)
          }
        } else {
          const errorData = await response.json()
          console.error("Failed to create workspace:", errorData)
          const errorMessage = errorData.details 
            ? `${errorData.error}: ${errorData.details}`
            : errorData.error || '不明なエラー'
          alert(`ワークスペースの作成に失敗しました: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error("Failed to save workspace:", error)
      alert(`ワークスペースの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  const handleDeleteWorkspace = async () => {
    // 編集中のワークスペースまたは現在選択中のワークスペースを削除
    const workspaceIdToDelete = editingWorkspace?.id || currentWorkspace
    if (!workspaceIdToDelete) return
    
    const workspace = workspaces.find(w => w.id === workspaceIdToDelete)
    const workspaceName = workspace?.name || "このワークスペース"
    
    if (!confirm(`${workspaceName}を削除してもよろしいですか？すべてのボードとカードも削除されます。`)) return

    try {
      const response = await fetch(`/api/workspaces/${workspaceIdToDelete}`, {
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
      } else {
        const errorData = await response.json()
        alert(`ワークスペースの削除に失敗しました: ${errorData.error || '不明なエラー'}`)
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
        // 新規作成 - デフォルトリストを使用
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
    // 編集中のボードまたは現在選択中のボードを削除
    const boardIdToDelete = editingBoard?.id || currentBoard
    if (!boardIdToDelete) return
    
    const board = boards.find(b => b.id === boardIdToDelete)
    const boardName = board?.name || "このボード"
    
    if (!confirm(`${boardName}を削除してもよろしいですか？すべてのカードも削除されます。`)) return

    try {
      const response = await fetch(`/api/boards/${boardIdToDelete}`, {
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
      } else {
        const errorData = await response.json()
        alert(`ボードの削除に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("Failed to delete board:", error)
      alert("ボードの削除に失敗しました")
    }
  }

  // S3保存・復元の関数
  const saveWorkspaceToS3 = async () => {
    if (!currentWorkspace) {
      toast({
        title: "エラー",
        description: "ワークスペースが選択されていません",
        variant: "destructive"
      })
      return
    }

    setIsSavingToS3(true)
    try {
      const response = await fetch('/api/workspaces/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId: currentWorkspace })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "保存完了",
          description: `ワークスペース「${result.data.workspaceName}」をS3に保存しました`,
        })
      } else {
        throw new Error(result.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('S3保存エラー:', error)
      toast({
        title: "保存エラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive"
      })
    } finally {
      setIsSavingToS3(false)
    }
  }

  const saveTaskManagementToS3 = async () => {
    setIsSavingToS3(true)
    try {
      const response = await fetch('/api/task-management/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "バックアップ完了",
          description: `タスク管理全体をS3にバックアップしました（${result.data.statistics.totalWorkspaces}ワークスペース、${result.data.statistics.totalCards}カード）`,
        })
      } else {
        throw new Error(result.error || 'バックアップに失敗しました')
      }
    } catch (error) {
      console.error('S3バックアップエラー:', error)
      toast({
        title: "バックアップエラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive"
      })
    } finally {
      setIsSavingToS3(false)
    }
  }

  const fetchAvailableBackups = async () => {
    try {
      const response = await fetch('/api/task-management/restore')
      const result = await response.json()
      
      if (result.success) {
        setAvailableBackups(result.backups)
      } else {
        throw new Error(result.error || 'バックアップ一覧の取得に失敗しました')
      }
    } catch (error) {
      console.error('バックアップ一覧取得エラー:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive"
      })
    }
  }

  const restoreTaskManagementFromS3 = async () => {
    if (!selectedBackup) {
      toast({
        title: "エラー",
        description: "復元するバックアップを選択してください",
        variant: "destructive"
      })
      return
    }

    if (!confirm('現在のタスク管理データがすべて削除され、選択したバックアップで置き換えられます。続行しますか？')) {
      return
    }

    setIsRestoringFromS3(true)
    try {
      const response = await fetch('/api/task-management/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          s3Key: selectedBackup,
          restoreMode: 'replace'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "復元完了",
          description: `タスク管理を復元しました（${result.data.restoredCounts.workspaces}ワークスペース、${result.data.restoredCounts.cards}カード）`,
        })
        
        // データを再読み込み
        await fetchWorkspaces()
        setShowRestoreDialog(false)
        setSelectedBackup('')
      } else {
        throw new Error(result.error || '復元に失敗しました')
      }
    } catch (error) {
      console.error('S3復元エラー:', error)
      toast({
        title: "復元エラー",
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: "destructive"
      })
    } finally {
      setIsRestoringFromS3(false)
    }
  }

  // 自動保存の関数（常に有効）
  const performAutoSave = useCallback(async (type: 'workspace' | 'full') => {
    try {
      console.log(`🔄 自動保存を開始: ${type}`)
      
      if (type === 'workspace' && currentWorkspace) {
        // ワークスペースの自動保存
        const response = await fetch('/api/workspaces/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-employee-id': currentUser?.id || '',
          },
          body: JSON.stringify({ workspaceId: currentWorkspace.id }),
        })
        
        if (response.ok) {
          setLastAutoSave(new Date())
          console.log(`✅ ワークスペース自動保存完了`)
        }
      } else if (type === 'full') {
        // 全体の自動保存
        const response = await fetch('/api/task-management/backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-employee-id': currentUser?.id || '',
          },
        })
        
        if (response.ok) {
          setLastAutoSave(new Date())
          console.log(`✅ 全体自動保存完了`)
        }
      }
    } catch (error) {
      console.error(`❌ 自動保存エラー (${type}):`, error)
    }
  }, [currentWorkspace, currentUser?.id])

  // 定期的な自動保存（1時間ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      performAutoSave('full')
    }, 60 * 60 * 1000) // 1時間

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [performAutoSave])

  // ワークスペース変更時の自動保存（デバウンス付き）
  useEffect(() => {
    if (!currentWorkspace) return

    const timeoutId = setTimeout(() => {
      performAutoSave('workspace')
    }, 10000) // 10秒後に自動保存

    return () => clearTimeout(timeoutId)
  }, [currentWorkspace, currentBoard, performAutoSave])

  // ページ離脱時の自動保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 同期的に保存（navigator.sendBeaconを使用）
      const data = JSON.stringify({ type: 'full' })
      navigator.sendBeacon('/api/task-management/backup', data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // データ変更検知による自動保存
  useEffect(() => {
    if (!currentBoardData) return

    const timeoutId = setTimeout(() => {
      // ボードデータが変更された場合の自動保存
      if (currentBoardData.lists?.some((list: any) => list.cards?.length > 0)) {
        performAutoSave('workspace')
      }
    }, 30000) // 30秒後に自動保存

    return () => clearTimeout(timeoutId)
  }, [currentBoardData, performAutoSave])

  // ボードデータからすべてのタスクを取得
  const allTasks = currentBoardData?.lists?.flatMap((list: any) => 
    list.cards?.map((card: any) => ({
      id: card.id,
      title: card.title,
      dueDate: card.dueDate || "",
      priority: card.priority || "medium",
      status: card.status || list.id,
      labels: card.labels || [],
      cardColor: card.cardColor,
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

  // 初期ローディング中の表示
  if (isInitialLoading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">データを読み込み中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="overflow-y-auto" style={{ backgroundColor: '#B4D5E7' }}>
      {/* 上部セクション - 背景色#B4D5E7 */}
      <div className="px-8 py-6 min-w-full">
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
            {/* 自動保存ステータス表示（読み取り専用） */}
            {lastAutoSave && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  最終保存: {lastAutoSave.toLocaleTimeString('ja-JP')}
                </span>
                <div className="text-xs text-green-600">
                  (自動保存: 1時間ごと・変更時・離脱時)
                </div>
              </div>
            )}

            {/* 管理者・総務のみ表示：復元ボタン */}
            {/* デバッグ情報 */}
            {(canManageTasks || canManageWorkspaces) && (
              <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchAvailableBackups()
                      setShowRestoreDialog(true)
                    }}
                    disabled={isRestoringFromS3}
                    className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isRestoringFromS3 ? "復元中..." : "復元"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>タスク管理の復元</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">復元するバックアップを選択</label>
                      <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="バックアップを選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBackups.map((backup) => (
                            <SelectItem key={backup.key} value={backup.key}>
                              <div className="flex flex-col">
                                <span className="font-medium">{backup.displayName}</span>
                                <span className="text-xs text-gray-500">
                                  {backup.lastModified ? new Date(backup.lastModified).toLocaleString('ja-JP') : '日時不明'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ 復元すると現在のタスク管理データがすべて削除され、選択したバックアップで置き換えられます。
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRestoreDialog(false)
                          setSelectedBackup('')
                        }}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={restoreTaskManagementFromS3}
                        disabled={!selectedBackup || isRestoringFromS3}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isRestoringFromS3 ? "復元中..." : "復元実行"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <TaskStructureGuide />
            <AIAskButton context={buildAIContext()} />
          </div>
        </div>

        {/* ワークスペースとボード選択 */}
        <div className="flex items-center gap-6 mb-3 min-w-full">
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
              console.log('[canEditWorkspace] Debug info:', {
                currentWorkspace,
                currentUserRole: currentUser?.role,
                currentUserId: currentUser?.id
              })
              
              if (!currentWorkspace || !currentUser?.role) {
                console.log('[canEditWorkspace] Early return: no workspace or role')
                return false
              }
              
              const workspace = workspaces.find(w => w.id === currentWorkspace)
              console.log('[canEditWorkspace] Found workspace:', workspace)
              
              if (!workspace) {
                console.log('[canEditWorkspace] Early return: workspace not found')
                return false
              }
              
              const permissions = checkWorkspacePermissions(
                currentUser.role,
                currentUser.id,
                workspace.createdBy || '',
                workspace.members?.map((m: any) => m.employeeId) || [],
                workspace.name
              )
              
              console.log('[canEditWorkspace] Final permissions:', permissions)
              console.log('[canEditWorkspace] canEdit result:', permissions.canEdit)
              
              return permissions.canEdit
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
          />
          
          {currentWorkspace && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
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
                {boards.find(b => b.id === currentBoard)?.description && (
                  <div className="ml-8 text-xs text-slate-500 max-w-[280px] break-words whitespace-pre-wrap">
                    {boards.find(b => b.id === currentBoard)?.description}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* フィルターとカレンダー */}
        {currentWorkspace && (
          <>
            {showFilters && (
              <div className="mb-3 min-w-full">
                <TaskSearchFilters onFilterChange={(filters) => {
                  console.log("Task filters changed:", filters)
                  setTaskFilters(filters)
                }} />
              </div>
            )}

            {showCalendar && (
              <div className="mb-4 min-w-full">
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
              onRefresh={() => currentBoard && fetchBoardData(currentBoard)}
              showArchived={false}
              dateFrom={taskFilters.dateFrom}
              dateTo={taskFilters.dateTo}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2 text-blue-800">ボードが選択されていません</p>
            <p className="text-sm text-blue-800">上からボードを選択するか、新しいボードを作成してください</p>
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
