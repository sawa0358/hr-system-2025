"use client"

import type React from "react"

// マウス座標を追跡するための型定義
declare global {
  interface Window {
    mouseX?: number
    mouseY?: number
  }
}

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
// import { employees } from "@/lib/mock-data" // 実際のデータベースから取得するように変更
import { useAuth } from "@/lib/auth-context"
import { checkCardPermissions, getPermissionErrorMessage } from "@/lib/permissions"

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
  boardId?: string
}

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
  onTaskUpdate?: (updatedTask: Task) => void
}

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

const PRESET_LABELS: Label[] = [
  { id: "label-1", name: "緊急", color: "#ef4444" },
  { id: "label-2", name: "重要", color: "#f59e0b" },
  { id: "label-3", name: "バグ", color: "#dc2626" },
  { id: "label-4", name: "機能追加", color: "#3b82f6" },
  { id: "label-5", name: "改善", color: "#10b981" },
  { id: "label-6", name: "ドキュメント", color: "#8b5cf6" },
]

// カード色用（不透明な色調）
const CARD_COLORS = [
  { name: "なし", value: "" },
  ...COLOR_PALETTE.map(color => ({
    name: color.name,
    value: color.value === "#ffffff" ? "#ffffff" : 
           color.value === "#000000" ? "#f8fafc" : 
           color.value === "#6b7280" ? "#f1f5f9" : 
           color.value // 透明度を適用せず、元の色をそのまま使用
  }))
]

// ヘックスカラーをRGBAに変換する関数
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
]

// デフォルトの状態オプション（削除不可）
const DEFAULT_STATUS_OPTIONS = [
  { value: "operational", label: "常時運用タスク", isDefault: true },
  { value: "scheduled", label: "予定リスト", isDefault: true },
  { value: "in-progress", label: "進行中", isDefault: true },
  { value: "done", label: "完了", isDefault: true },
]

// カスタム状態オプション（削除可能）
// デフォルトと重複しないもののみ
const CUSTOM_STATUS_OPTIONS = [
  { value: "todo", label: "未着手", isDefault: false },
  { value: "review", label: "レビュー", isDefault: false },
]

export function TaskDetailDialog({ task, open, onOpenChange, onRefresh, onTaskUpdate }: TaskDetailDialogProps) {
  const { currentUser } = useAuth()
  
  // カード権限をチェック
  const cardPermissions = task && currentUser ? checkCardPermissions(
    currentUser.role as any,
    currentUser.id,
    task.createdBy || '',
    task.members?.map((m: any) => m.id) || []
  ) : null
  
  // 実際の社員データを取得（ワークスペースメンバーのみ）
  const [employees, setEmployees] = useState<any[]>([])
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // タスクが所属するワークスペースのメンバーのみを取得
        if (task?.boardId) {
          // まずボード情報を取得してワークスペースIDを取得
          const boardResponse = await fetch(`/api/boards/${task.boardId}`, {
            headers: {
              'x-employee-id': currentUser?.id || ''
            }
          })
          
          if (boardResponse.ok) {
            const boardData = await boardResponse.json()
            const workspaceId = boardData.board?.workspaceId
            
            if (workspaceId) {
              // ワークスペース情報を取得（メンバー情報を含む）
              const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`, {
                headers: {
                  'x-employee-id': currentUser?.id || ''
                }
              })
              
              if (workspaceResponse.ok) {
                const workspaceData = await workspaceResponse.json()
                const workspaceMembers = workspaceData.workspace?.members || []
                
                // ワークスペースメンバーの社員情報を取得
                const memberEmployees = workspaceMembers.map((member: any) => member.employee).filter(Boolean)
                console.log('Workspace members loaded:', memberEmployees.length, 'members')
                setEmployees(memberEmployees)
                return
              }
            }
          }
        }
        
        // フォールバック: 全社員を取得
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          console.log('All employees loaded as fallback:', data.employees?.length || 0, 'employees')
          setEmployees(data.employees || [])
        }
      } catch (error) {
        console.error('社員データの取得に失敗しました:', error)
      }
    }
    
    // ダイアログが開いているときのみ、最新のメンバーリストを取得
    if (open && task && currentUser) {
      fetchEmployees()
    }
  }, [open, task?.boardId, task?.id, currentUser?.id])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  
  // 締切日設定ハンドラー
  const handleSetDueDate = (date: Date | undefined) => {
    console.log("setDueDate called with:", date)
    setDueDate(date)
  }
  const [priority, setPriority] = useState("medium")
  const [status, setStatus] = useState("scheduled")
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cardColor, setCardColor] = useState("")
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [showLabelSelector, setShowLabelSelector] = useState(false)
  
  // localStorageからラベルを取得
  const getStoredLabels = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('task-custom-labels')
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return PRESET_LABELS
  }
  
  const [customLabels, setCustomLabels] = useState<Label[]>(getStoredLabels)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")

  // ファイル管理の状態（ユーザー詳細を参考にした実装）
  const [folders, setFolders] = useState<string[]>(["資料", "画像", "参考資料"])
  const [currentFolder, setCurrentFolder] = useState(folders[0] || "資料")
  const [files, setFiles] = useState<File[]>([]) // アップロード中のファイル
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]) // アップロード済みファイル
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isAddingFileFolder, setIsAddingFileFolder] = useState(false)
  const [newFileFolderName, setNewFileFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  
  // タスクが開かれた時にフォルダ情報を読み込み、ファイルを取得
  useEffect(() => {
    if (open && task?.id) {
      // localStorageからフォルダ情報を読み込み
      if (typeof window !== 'undefined') {
        const savedFolders = localStorage.getItem(`task-folders-${task.id}`)
        if (savedFolders) {
          const parsedFolders = JSON.parse(savedFolders)
          setFolders(parsedFolders)
          setCurrentFolder(parsedFolders[0] || "資料")
        }
      }
      fetchUploadedFiles(task.id)
    }
  }, [open, task?.id])

  // フォルダが変更されたらlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && task?.id) {
      localStorage.setItem(`task-folders-${task.id}`, JSON.stringify(folders))
    }
  }, [folders, task?.id])

  const [showPriorityManager, setShowPriorityManager] = useState(false)
  const [showStatusManager, setShowStatusManager] = useState(false)
  
  // localStorageから優先度オプションを取得
  const getStoredPriorityOptions = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('task-priority-options')
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return PRIORITY_OPTIONS
  }
  
  // localStorageから状態オプションを取得
  const getStoredStatusOptions = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('task-status-options')
      if (stored) {
        const customOptions = JSON.parse(stored)
        // デフォルトオプションの値と重複しないカスタムオプションのみをフィルタリング
        const defaultValues = DEFAULT_STATUS_OPTIONS.map(opt => opt.value)
        const filteredCustomOptions = customOptions.filter((option: any) => 
          !defaultValues.includes(option.value)
        )
        // デフォルトオプションとフィルタリングされたカスタムオプションをマージ
        return [...DEFAULT_STATUS_OPTIONS, ...filteredCustomOptions]
      }
    }
    // 初回時はデフォルト + カスタムオプション（重複チェック済み）
    return [...DEFAULT_STATUS_OPTIONS, ...CUSTOM_STATUS_OPTIONS]
  }
  
  const [priorityOptions, setPriorityOptions] = useState(getStoredPriorityOptions)
  const [statusOptions, setStatusOptions] = useState(() => {
    const options = getStoredStatusOptions()
    // 初回読み込み時に重複をクリーンアップ
    const defaultValues = DEFAULT_STATUS_OPTIONS.map(opt => opt.value)
    const cleanedOptions = options.filter((option, index, self) => {
      // デフォルト値との重複をチェック
      if (defaultValues.includes(option.value) && !option.isDefault) {
        return false
      }
      // 配列内での重複をチェック
      return index === self.findIndex(opt => opt.value === option.value)
    })
    
    // クリーンアップされたカスタムオプションをlocalStorageに保存
    if (typeof window !== 'undefined' && cleanedOptions.length !== options.length) {
      const customOptions = cleanedOptions.filter(s => !s.isDefault)
      localStorage.setItem('task-status-options', JSON.stringify(customOptions))
    }
    
    return cleanedOptions
  })
  const [newPriorityLabel, setNewPriorityLabel] = useState("")
  const [newStatusLabel, setNewStatusLabel] = useState("")

  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false)
  const [showCalendarSelector, setShowCalendarSelector] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")

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
        id: member.id || member.employee?.id || member.employeeId || "",
        name: member.name || member.employee?.name || "未設定",
        email: member.email || member.employee?.email || "",
      }))
      console.log("Processing task members:", task.members, "->", processedMembers)
      setMembers(processedMembers)
      
      setCardColor(task.cardColor || "")
      
      // ファイル情報を復元（新しい実装）
      if (task.attachments && Array.isArray(task.attachments)) {
        console.log("Restoring files from task:", task.attachments)
        
        // ファイルをアップロード済みファイルリストに設定
        const fileList = task.attachments.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          uploadDate: file.uploadDate,
          size: file.size,
          folderName: file.folderName || '資料'
        }))
        
        setUploadedFiles(fileList)
      }
      
      console.log("TaskDetailDialog - Task loaded:", task)
      console.log("TaskDetailDialog - Task attachments:", task.attachments)
      console.log("TaskDetailDialog - Processed members:", processedMembers)
    }
  }, [task])

  // モーダルが閉じられる際に設定やメンバー追加の状態をリセット
  useEffect(() => {
    if (!open) {
      // 設定系の状態をリセット
      setShowLabelManager(false)
      setShowLabelSelector(false)
      setShowPriorityManager(false)
      setShowStatusManager(false)
      setShowEmployeeSelector(false)
      setShowCalendarSelector(false)
      
      // 入力中の状態をリセット
      setNewLabelName("")
      setNewLabelColor("#3b82f6")
      setNewPriorityLabel("")
      setNewStatusLabel("")
      setEmployeeSearch("")
      setIsAddingFileFolder(false)
      setNewFileFolderName("")
      setIsDragging(false)
    }
  }, [open])

  // スクロール時に設定やメンバー追加の状態をリセット（カーソルが設定パネル上にある時は除外）
  useEffect(() => {
    const handleScroll = () => {
      // 設定パネルが表示されているかチェック
      const hasOpenPanels = showLabelManager || showLabelSelector || showPriorityManager || 
                           showStatusManager || showEmployeeSelector || showCalendarSelector
      
      if (!hasOpenPanels) {
        return // 設定パネルが開いていない場合は何もしない
      }

      // カーソルが設定パネル上にあるかチェック
      const mouseX = window.mouseX || 0
      const mouseY = window.mouseY || 0
      
      // 設定パネルの要素を取得してカーソル位置をチェック
      const labelManagerEl = document.querySelector('[data-panel="label-manager"]')
      const labelSelectorEl = document.querySelector('[data-panel="label-selector"]')
      const priorityManagerEl = document.querySelector('[data-panel="priority-manager"]')
      const statusManagerEl = document.querySelector('[data-panel="status-manager"]')
      const employeeSelectorEl = document.querySelector('[data-panel="employee-selector"]')
      const calendarSelectorEl = document.querySelector('[data-panel="calendar-selector"]')
      
      const isOverPanel = [labelManagerEl, labelSelectorEl, priorityManagerEl, 
                          statusManagerEl, employeeSelectorEl, calendarSelectorEl]
        .some(el => {
          if (!el) return false
          const rect = el.getBoundingClientRect()
          return mouseX >= rect.left && mouseX <= rect.right && 
                 mouseY >= rect.top && mouseY <= rect.bottom
        })
      
      // カーソルが設定パネル上にない場合のみ状態をリセット
      if (!isOverPanel) {
        setShowLabelManager(false)
        setShowLabelSelector(false)
        setShowPriorityManager(false)
        setShowStatusManager(false)
        setShowEmployeeSelector(false)
        setShowCalendarSelector(false)
      }
    }

    // マウス位置を追跡
    const handleMouseMove = (e: MouseEvent) => {
      window.mouseX = e.clientX
      window.mouseY = e.clientY
    }

    // イベントリスナーを追加
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('mousemove', handleMouseMove)
    
    // クリーンアップ
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [showLabelManager, showLabelSelector, showPriorityManager, showStatusManager, showEmployeeSelector, showCalendarSelector])

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
      const newLabels = [...customLabels, newLabel]
      setCustomLabels(newLabels)
      setNewLabelName("")
      setNewLabelColor("#3b82f6")
      
      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-custom-labels', JSON.stringify(newLabels))
      }
    }
  }

  const handleDeleteLabel = (labelId: string) => {
    const newLabels = customLabels.filter((l) => l.id !== labelId)
    setCustomLabels(newLabels)
    setSelectedLabels(selectedLabels.filter((l) => l.id !== labelId))
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('task-custom-labels', JSON.stringify(newLabels))
    }
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
    // メンバー追加権限をチェック
    if (cardPermissions && !cardPermissions.canAddMembers) {
      alert(getPermissionErrorMessage("店長"))
      return
    }
    
    setMembers(members.filter((m) => m.id !== memberId))
  }

  const handleAddFileFolder = () => {
    if (newFileFolderName.trim()) {
      const newFolders = [...folders, newFileFolderName.trim()]
      setFolders(newFolders)
      setCurrentFolder(newFileFolderName.trim())
      setNewFileFolderName("")
      setIsAddingFileFolder(false)
      
      // localStorageに保存
      if (typeof window !== 'undefined' && task?.id) {
        localStorage.setItem(`task-folders-${task.id}`, JSON.stringify(newFolders))
      }
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

  // ファイルアップロード処理（ユーザー詳細を参考にした実装）
  const handleFileUpload = async (selectedFiles: File[]) => {
    if (!currentUser || !task?.id) {
      alert("ユーザー情報またはタスク情報が取得できません")
      return
    }

    // 一時的にローカルファイルリストに追加（アップロード中表示用）
    setFiles([...files, ...selectedFiles])

    // 各ファイルをアップロード
    for (const file of selectedFiles) {
      try {
        console.log('ファイルアップロード開始:', file.name)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'task')
        formData.append('folder', currentFolder)
        formData.append('taskId', task.id)
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-employee-id': currentUser.id,
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('ファイルアップロード成功:', result)
          
          // アップロード成功したファイルをローカルリストから削除
          setFiles(prevFiles => prevFiles.filter(f => f !== file))
          
          // アップロード済みファイルリストを再取得
          setTimeout(() => {
            fetchUploadedFiles(task.id)
          }, 500)
        } else {
          const errorText = await response.text()
          console.error('ファイルアップロード失敗:', response.status, errorText)
          // エラーの場合もローカルリストから削除
          setFiles(prevFiles => prevFiles.filter(f => f !== file))
        }
      } catch (error) {
        console.error('ファイルアップロードエラー:', error)
        // エラーの場合もローカルリストから削除
        setFiles(prevFiles => prevFiles.filter(f => f !== file))
      }
    }
  }

  // アップロード済みファイルを取得
  const fetchUploadedFiles = async (taskId: string) => {
    if (!currentUser) return
    
    setLoadingFiles(true)
    try {
      const response = await fetch(`/api/files/task/${taskId}`, {
        headers: {
          'x-employee-id': currentUser.id,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('取得したファイル:', data)
        setUploadedFiles(data)
      } else {
        console.error('ファイル取得失敗:', response.status)
        // エラーの場合はタスクのattachmentsから取得を試行
        if (task?.attachments && Array.isArray(task.attachments)) {
          const fileList = task.attachments.map((file: any) => ({
            id: file.id,
            name: file.name,
            type: file.type,
            uploadDate: file.uploadDate,
            size: file.size,
            folderName: file.folderName || '資料'
          }))
          setUploadedFiles(fileList)
        }
      }
    } catch (error) {
      console.error('ファイル取得エラー:', error)
      // エラーの場合はタスクのattachmentsから取得を試行
      if (task?.attachments && Array.isArray(task.attachments)) {
        const fileList = task.attachments.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          uploadDate: file.uploadDate,
          size: file.size,
          folderName: file.folderName || '資料'
        }))
        setUploadedFiles(fileList)
      }
    } finally {
      setLoadingFiles(false)
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
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({ taskId: task.id }),
      })

      if (response.ok) {
        console.log("File deleted successfully")
        // アップロード済みファイルリストから削除
        setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId))
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
    if (newPriorityLabel.trim()) {
      // 値は自動生成（ラベルの最初の文字を小文字にしたもの）
      const autoValue = newPriorityLabel.toLowerCase().replace(/\s+/g, '-')
      const newOptions = [...priorityOptions, { value: autoValue, label: newPriorityLabel.trim() }]
      
      setPriorityOptions(newOptions)
      setNewPriorityLabel("")
      
      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-priority-options', JSON.stringify(newOptions))
      }
    }
  }

  const handleDeletePriority = (value: string) => {
    const newOptions = priorityOptions.filter((p) => p.value !== value)
    setPriorityOptions(newOptions)
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('task-priority-options', JSON.stringify(newOptions))
    }
  }

  const handleAddStatus = () => {
    if (newStatusLabel.trim()) {
      // 値は自動生成（ラベルの最初の文字を小文字にしたもの）
      const autoValue = newStatusLabel.toLowerCase().replace(/\s+/g, '-')
      
      // 重複チェック
      const defaultValues = DEFAULT_STATUS_OPTIONS.map(opt => opt.value)
      if (defaultValues.includes(autoValue)) {
        alert('この状態はすでにデフォルトで存在します。別の名前を使用してください。')
        return
      }
      
      // 既存のオプションとの重複チェック
      const existingOption = statusOptions.find(opt => opt.value === autoValue || opt.label === newStatusLabel.trim())
      if (existingOption) {
        alert('同じ名前の状態が既に存在します。別の名前を使用してください。')
        return
      }
      
      const newCustomOption = { value: autoValue, label: newStatusLabel.trim(), isDefault: false }
      const newOptions = [...statusOptions, newCustomOption]
      
      setStatusOptions(newOptions)
      setNewStatusLabel("")
      
      // カスタムオプションのみlocalStorageに保存
      const customOptions = newOptions.filter(s => !s.isDefault)
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-status-options', JSON.stringify(customOptions))
      }
    }
  }

  const handleDeleteStatus = (value: string) => {
    // デフォルトオプションは削除できない
    const option = statusOptions.find(s => s.value === value)
    if (option?.isDefault) {
      alert('この状態は削除できません。')
      return
    }
    
    const newOptions = statusOptions.filter((s) => s.value !== value)
    setStatusOptions(newOptions)
    
    // カスタムオプションのみlocalStorageに保存
    const customOptions = newOptions.filter(s => !s.isDefault)
    if (typeof window !== 'undefined') {
      localStorage.setItem('task-status-options', JSON.stringify(customOptions))
    }
  }

  const handleAddEmployee = (employee: any) => {
    if (!members.find((m) => m.id === employee.id)) {
      setMembers([...members, { id: employee.id, name: employee.name }])
    }
    // ダイアログは開いたままにして、複数人選択できるようにする
    // setShowEmployeeSelector(false)
    setEmployeeSearch("")
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      !emp.isInvisibleTop && // 見えないTOP社員を除外
      emp.showInOrgChart !== false && // 組織図に表示する社員のみ
      (emp.status === 'active' || emp.status === 'leave') && // 在籍中・休職中のみ
      emp.status !== 'copy' && // コピー社員を除外
      (emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.position.toLowerCase().includes(employeeSearch.toLowerCase())),
  )

  const handleMakeTemplate = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    if (!task.boardId) {
      alert("ボード情報が取得できません")
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

      console.log("Creating template for board:", task.boardId, templateData)
      // テンプレートデータをlocalStorageに保存（ボードごと）
      const storageKey = `cardTemplates-${task.boardId}`
      const templates = JSON.parse(localStorage.getItem(storageKey) || '[]')
      templates.push({
        id: `template-${Date.now()}`,
        ...templateData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        boardId: task.boardId,
      })
      localStorage.setItem(storageKey, JSON.stringify(templates))
      
      alert("テンプレートとして保存しました")
    } catch (error) {
      console.error("Error creating template:", error)
      alert("テンプレートの保存に失敗しました")
    }
  }


  const handleArchive = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    try {
      // カードをアーカイブ状態に設定（リストは移動しない）
      const response = await fetch(`/api/cards/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({
          isArchived: true,
        }),
      })

      if (response.ok) {
        console.log("Card archived successfully")
        alert("カードをアーカイブしました")
        onRefresh?.()
        onOpenChange(false)
      } else {
        const error = await response.json()
        console.error("Failed to archive card:", error)
        alert(`アーカイブに失敗しました: ${error.error || '不明なエラー'}`)
      }
    } catch (error) {
      console.error("Error archiving card:", error)
      alert("アーカイブに失敗しました")
    }
  }

  const handleSave = async () => {
    if (!task || !currentUser) {
      alert("ユーザー情報が取得できません")
      return
    }

    // カード編集権限をチェック
    if (cardPermissions && !cardPermissions.canEdit) {
      alert(cardPermissions.reason || "このカードを編集する権限がありません")
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
        cardColor: cardColor || null,
        isArchived: isArchived || false,
        members: members || [],
        attachments: uploadedFiles || [], // ファイル情報を追加
      }
      
      console.log("Sending card update request:", {
        cardId: task.id,
        userId: currentUser.id,
        requestBody
      })
      console.log("Files being sent:", uploadedFiles)

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
        console.log("Saved card attachments:", result.card?.attachments)
        
        // 保存されたカードデータでローカル状態を更新
        if (result.card) {
          // レスポンスからメンバー情報を正しく処理
          const processedMembers = (result.card.members || []).map((member: any) => ({
            id: member.employee?.id || member.employeeId || member.id || "",
            name: member.employee?.name || member.name || "未設定",
            email: member.employee?.email || member.email || "",
          }))
          
          console.log("Card saved - received members:", result.card.members)
          console.log("Card saved - processed members:", processedMembers)

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
            const fileList = result.card.attachments.map((file: any) => ({
              id: file.id,
              name: file.name,
              type: file.type,
              uploadDate: file.uploadDate,
              size: file.size,
              folderName: file.folderName || '資料'
            }))
            setUploadedFiles(fileList)
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

  // currentFileFolderは不要になったので削除

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: cardColor && cardColor !== "" ? cardColor : "white"
        }}
      >
        <DialogHeader>
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-white"
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
              {/* 総務・管理者のみ編集ボタンを表示 */}
              {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                <Button variant="ghost" size="sm" onClick={() => setShowLabelManager(!showLabelManager)}>
                  <Edit2 className="w-3 h-3 mr-1" />
                  管理
                </Button>
              )}
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
              <div className="mt-4 p-4 border rounded-lg bg-slate-50" data-panel="label-manager">
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
                    className="bg-white"
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
              className="bg-white"
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
            </div>
          </div>

          {/* Priority and Status with Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">重要度</label>
                {/* 総務・管理者のみ編集ボタンを表示 */}
                {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                  <Button variant="ghost" size="sm" onClick={() => setShowPriorityManager(!showPriorityManager)}>
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
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
                <div className="mt-3 p-3 border rounded-lg bg-slate-50" data-panel="priority-manager">
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
                      placeholder="重要度の表示名（例：最高）"
                      value={newPriorityLabel}
                      onChange={(e) => setNewPriorityLabel(e.target.value)}
                      className="text-sm flex-1 bg-white"
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
                {/* 総務・管理者のみ編集ボタンを表示 */}
                {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                  <Button variant="ghost" size="sm" onClick={() => setShowStatusManager(!showStatusManager)}>
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
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
                <div className="mt-3 p-3 border rounded-lg bg-slate-50" data-panel="status-manager">
                  <h4 className="font-medium mb-2 text-sm">状態管理</h4>
                  <div className="space-y-2 mb-3">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{option.label}</span>
                          {option.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              デフォルト
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteStatus(option.value)}
                          disabled={option.isDefault}
                          className={option.isDefault ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="状態の表示名（例：保留中）"
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      className="text-sm flex-1 bg-white"
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
                  {cardPermissions?.canAddMembers && (
                    <button onClick={() => handleRemoveMember(member.id)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {cardPermissions?.canAddMembers && (
              <Button variant="outline" size="sm" onClick={() => setShowEmployeeSelector(true)}>
                <Plus className="w-3 h-3 mr-1" />
                メンバーを追加
              </Button>
            )}

            {showEmployeeSelector && (
              <div className="mt-3 p-4 border rounded-lg bg-white shadow-lg" data-panel="employee-selector">
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
                    className="pl-10 bg-white"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredEmployees.map((employee) => {
                    const isSelected = members.find((m) => m.id === employee.id)
                    return (
                      <button
                        key={employee.id}
                        onClick={() => handleAddEmployee(employee)}
                        className={`w-full text-left p-3 rounded hover:bg-slate-50 flex items-center gap-3 transition-colors ${
                          isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'border border-transparent'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-sm ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(employee.name || "未").slice(0, 3)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{employee.name}</p>
                          <p className="text-xs text-slate-500">
                            {employee.department} / {employee.position}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs">
                            ✓ 選択済み
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                  {filteredEmployees.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">該当する社員が見つかりません</p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowEmployeeSelector(false)
                      setEmployeeSearch("")
                    }}
                  >
                    完了
                  </Button>
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
                  <div key={checklist.id} className="border rounded-lg p-4 bg-white">
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
            {/* フォルダタブ */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {folders.map((folder) => {
                    const fileCount = uploadedFiles.filter(file => file.folderName === folder).length
                    return (
                      <Button
                        key={folder}
                        variant={currentFolder === folder ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentFolder(folder)}
                        className="relative"
                      >
                        {folder}
                        {fileCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                            {fileCount}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
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
                      className="w-32 h-8 text-sm bg-white"
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
            </div>

            {/* ファイルアップロードエリア */}
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
                    const selectedFiles = Array.from((e.target as HTMLInputElement).files || [])
                    handleFileUpload(selectedFiles)
                  }
                  input.click()
                }}
              >
                <Upload className="w-3 h-3 mr-1" />
                ファイルを選択
              </Button>
            </div>

            {/* ファイル一覧 */}
            <div className="mt-4 space-y-2">
              {loadingFiles ? (
                <div className="text-sm text-slate-500">ファイルを読み込み中...</div>
              ) : files.length === 0 && uploadedFiles.filter(file => file.folderName === currentFolder).length === 0 ? (
                <div className="text-sm text-slate-500">ファイルがありません</div>
              ) : (
                <div className="space-y-2">
                  {/* ローカルファイル（アップロード中） */}
                  {files.map((file, index) => (
                    <div key={`local-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2 flex-1">
                        <Upload className="w-4 h-4 text-blue-400" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-blue-600">
                          ({(file.size / 1024).toFixed(1)} KB) - アップロード中...
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* アップロード済みファイル */}
                  {uploadedFiles
                    .filter(file => file.folderName === currentFolder)
                    .map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-slate-500">
                            {file.size} - {file.uploadDate}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!currentUser) {
                                alert("ユーザー情報が取得できません")
                                return
                              }

                              try {
                                console.log("Downloading file:", file.id, file.name)
                                
                                const response = await fetch(`/api/files/${file.id}/download`, {
                                  method: 'GET',
                                  headers: {
                                    'x-employee-id': currentUser.id,
                                  },
                                })

                                if (!response.ok) {
                                  const error = await response.json()
                                  console.error("Download failed:", error)
                                  alert(`ダウンロードに失敗しました: ${error.error || '不明なエラー'}`)
                                  return
                                }

                                // レスポンスからファイルデータを取得
                                const blob = await response.blob()
                                
                                // ダウンロードリンクを作成
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement("a")
                                link.href = url
                                link.download = file.name
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                                
                                console.log("File downloaded successfully:", file.name)
                              } catch (error) {
                                console.error("Download error:", error)
                                alert("ダウンロードに失敗しました")
                              }
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Color */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              カードの色
            </label>
            <div className="space-y-3">
              {/* カラーピッカー */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">カスタム色を選択</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="customCardColor"
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    onChange={(e) => {
                      setCardColor(e.target.value)
                    }}
                  />
                  <span className="text-sm text-gray-600">カスタム色を選択</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCardColor("")}
                    className="text-xs"
                  >
                    色をリセット
                  </Button>
                </div>
              </div>
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
        <DialogContent className="max-w-md" data-panel="label-selector">
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
        <DialogContent className="max-w-sm" data-panel="calendar-selector">
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
