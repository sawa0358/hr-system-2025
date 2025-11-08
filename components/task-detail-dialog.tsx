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
  Check,
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
  employeeType?: string
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
  { id: "label-1", name: "販促関係", color: "#3b82f6" },     // blue
  { id: "label-2", name: "求人関係", color: "#06b6d4" },     // cyan
  { id: "label-3", name: "契約関係", color: "#8b5cf6" },     // purple
  { id: "label-4", name: "会社全体", color: "#10b981" },     // emerald
  { id: "label-5", name: "その他",   color: "#64748b" },     // slate
  { id: "label-6", name: "緊急",     color: "#ef4444" },     // red
  { id: "label-7", name: "重要",     color: "#f59e0b" },     // amber
  { id: "label-8", name: "個人",     color: "#ec4899" },     // pink
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
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "A3", label: "A3" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "B3", label: "B3" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "C3", label: "C3" },
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
const CUSTOM_STATUS_OPTIONS: { value: string; label: string; isDefault: boolean }[] = []

export function TaskDetailDialog({ task, open, onOpenChange, onRefresh, onTaskUpdate }: TaskDetailDialogProps) {
  const { currentUser } = useAuth()
  
  // カード権限をチェック（総務・管理者は全てのカードを開くことができる）
  const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  const cardPermissions = task && currentUser ? checkCardPermissions(
    currentUser.role as any,
    currentUser.id,
    task.createdBy || '',
    task.members?.map((m: any) => m.id) || []
  ) : null
  
  // 総務・管理者の場合は権限を強制的にtrueに設定
  if (isAdminOrHr && cardPermissions) {
    cardPermissions.canOpen = true
    cardPermissions.canEdit = true
  }
  
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
                console.log('Workspace members detail:', memberEmployees)
                
                // 各メンバーの詳細情報をログ出力
                memberEmployees.forEach((emp: any, index: number) => {
                  console.log(`Member ${index}:`, {
                    id: emp.id,
                    name: emp.name,
                    email: emp.email,
                    department: emp.department,
                    position: emp.position,
                    status: emp.status,
                    statusType: typeof emp.status,
                    statusValue: JSON.stringify(emp.status),
                    isInvisibleTop: emp.isInvisibleTop,
                    showInOrgChart: emp.showInOrgChart
                  })
                })
                
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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
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
  
  // ラベルを取得（APIから取得 + localStorageからカスタムラベルをマージ）
  const getStoredLabels = async (): Promise<Label[]> => {
    try {
      // まずAPIからデフォルト設定を取得
      if (currentUser) {
        const response = await fetch('/api/default-card-settings', {
          headers: {
            'x-employee-id': currentUser.id,
          },
        })

        if (response.ok) {
          const data = await response.json()
          let defaultLabels: Label[] = data.labels || []
          
          // カスタムラベルを取得（個別ユーザー用）
          if (typeof window !== 'undefined') {
            const customStored = localStorage.getItem('task-custom-labels')
            let customLabels: Label[] = []
            if (customStored) {
              try {
                customLabels = JSON.parse(customStored)
              } catch (e) {
                console.error('Failed to parse task-custom-labels:', e)
              }
            }
            
            // デフォルトラベルとカスタムラベルをマージ（重複を除去）
            const allLabels = [...defaultLabels]
            customLabels.forEach((customLabel) => {
              if (!allLabels.find((l) => l.id === customLabel.id && l.name === customLabel.name)) {
                allLabels.push(customLabel)
              }
            })
            
            if (allLabels.length > 0) {
              return allLabels
            }
          }
          
          if (defaultLabels.length > 0) {
            return defaultLabels
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch default card settings:', error)
    }
    
    // フォールバック: localStorageから取得
    if (typeof window !== 'undefined') {
      const defaultSettings = localStorage.getItem('default-card-settings')
      if (defaultSettings) {
        try {
          const settings = JSON.parse(defaultSettings)
          const defaultLabels = settings.labels || []
          if (defaultLabels.length > 0) {
            return defaultLabels
          }
        } catch (e) {
          console.error('Failed to parse default-card-settings:', e)
        }
      }
    }
    
    return PRESET_LABELS
  }
  
  const [customLabels, setCustomLabels] = useState<Label[]>(PRESET_LABELS)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")
  
  // ラベルリストを初期化・更新
  useEffect(() => {
    const loadLabels = async () => {
      const labels = await getStoredLabels()
      setCustomLabels(labels)
    }
    
    if (currentUser && open) {
      loadLabels()
    }
  }, [currentUser, open])
  
  // default-card-settingsが変更されたときにラベルリストを更新
  useEffect(() => {
    const handleDefaultSettingsChange = async () => {
      const updatedLabels = await getStoredLabels()
      setCustomLabels(updatedLabels)
    }
    
    window.addEventListener('defaultCardSettingsChanged', handleDefaultSettingsChange)
    
    return () => {
      window.removeEventListener('defaultCardSettingsChanged', handleDefaultSettingsChange)
    }
  }, [currentUser])

  // ファイル管理の状態（ユーザー詳細を参考にした実装）
  const [folders, setFolders] = useState<string[]>(["資料", "画像", "参考資料"])
  const [currentFolder, setCurrentFolder] = useState(folders[0] || "資料")
  const [files, setFiles] = useState<File[]>([]) // アップロード中のファイル
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]) // アップロード済みファイル
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isAddingFileFolder, setIsAddingFileFolder] = useState(false)
  const [newFileFolderName, setNewFileFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  // チェックリスト入力用の状態変数
  const [isAddingChecklist, setIsAddingChecklist] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState("")
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("")
  const [addingItemToChecklistId, setAddingItemToChecklistId] = useState<string | null>(null)
  const [newChecklistItemText, setNewChecklistItemText] = useState("")
  const [isComposingNewChecklistTitle, setIsComposingNewChecklistTitle] = useState(false)
  const [isIMEActiveNewChecklistTitle, setIsIMEActiveNewChecklistTitle] = useState(false)
  const [isComposingEditChecklistTitle, setIsComposingEditChecklistTitle] = useState(false)
  const [isIMEActiveEditChecklistTitle, setIsIMEActiveEditChecklistTitle] = useState(false)
  const [isComposingChecklistItemInput, setIsComposingChecklistItemInput] = useState(false)
  const [isIMEActiveChecklistItemInput, setIsIMEActiveChecklistItemInput] = useState(false)
  
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
  
  // APIから優先度・状態オプションを取得
  const loadDefaultSettings = async () => {
    try {
      if (currentUser) {
        const response = await fetch('/api/default-card-settings', {
          headers: {
            'x-employee-id': currentUser.id,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[TaskDetailDialog] Loaded default settings from API:', data)
          
          // 優先度オプションを設定（APIからのデータを優先）
          if (data.priorities && Array.isArray(data.priorities) && data.priorities.length > 0) {
            console.log('[TaskDetailDialog] Setting priority options from API:', data.priorities)
            setPriorityOptions(data.priorities)
            // APIから取得できた場合はlocalStorageも更新（同期）
            if (typeof window !== 'undefined') {
              localStorage.setItem('task-priority-options', JSON.stringify(data.priorities))
            }
          } else {
            // APIからデータがない場合のみフォールバック
            console.log('[TaskDetailDialog] No priority options from API, using fallback')
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('task-priority-options')
              if (stored) {
                setPriorityOptions(JSON.parse(stored))
              } else {
                setPriorityOptions(PRIORITY_OPTIONS)
              }
            } else {
              setPriorityOptions(PRIORITY_OPTIONS)
            }
          }
          
          // 状態オプションを設定（APIからのデータを優先）
          if (data.statuses && Array.isArray(data.statuses) && data.statuses.length > 0) {
            // デフォルトオプションとマージ
            const defaultValues = DEFAULT_STATUS_OPTIONS.map(opt => opt.value)
            const filteredCustomStatuses = data.statuses.filter((option: any) => 
              !defaultValues.includes(option.value)
            )
            const mergedStatusOptions = [...DEFAULT_STATUS_OPTIONS, ...filteredCustomStatuses]
            console.log('[TaskDetailDialog] Setting status options from API:', mergedStatusOptions)
            setStatusOptions(mergedStatusOptions)
            // APIから取得できた場合はlocalStorageも更新（同期）
            if (typeof window !== 'undefined') {
              localStorage.setItem('task-status-options', JSON.stringify(filteredCustomStatuses))
            }
          } else {
            // APIからデータがない場合のみフォールバック
            console.log('[TaskDetailDialog] No status options from API, using fallback')
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('task-status-options')
              if (stored) {
                const customOptions = JSON.parse(stored)
                const defaultValues = DEFAULT_STATUS_OPTIONS.map(opt => opt.value)
                const filteredCustomOptions = customOptions.filter((option: any) => 
                  !defaultValues.includes(option.value)
                )
                setStatusOptions([...DEFAULT_STATUS_OPTIONS, ...filteredCustomOptions])
              } else {
                setStatusOptions([...DEFAULT_STATUS_OPTIONS, ...CUSTOM_STATUS_OPTIONS])
              }
            } else {
              setStatusOptions([...DEFAULT_STATUS_OPTIONS, ...CUSTOM_STATUS_OPTIONS])
            }
          }
        } else {
          console.error('[TaskDetailDialog] Failed to fetch default settings:', response.status)
          // フォールバック: コード定義のデフォルトを使用（localStorageは無視）
          setPriorityOptions(PRIORITY_OPTIONS)
          setStatusOptions([...DEFAULT_STATUS_OPTIONS])
        }
      }
    } catch (error) {
      console.error('[TaskDetailDialog] Failed to load default settings:', error)
      // フォールバック: コード定義のデフォルトを使用（localStorageは無視）
      setPriorityOptions(PRIORITY_OPTIONS)
      setStatusOptions([...DEFAULT_STATUS_OPTIONS])
    }
  }

  const [priorityOptions, setPriorityOptions] = useState(PRIORITY_OPTIONS)
  const [statusOptions, setStatusOptions] = useState([...DEFAULT_STATUS_OPTIONS, ...CUSTOM_STATUS_OPTIONS])
  
  // ダイアログが開いたときにAPIから設定を取得
  useEffect(() => {
    if (open && currentUser) {
      loadDefaultSettings()
    }
  }, [open, currentUser])
  
  // APIから取得した設定がlocalStorageより優先されるようにする
  // default-card-settingsが変更されたときに再読み込み
  useEffect(() => {
    const handleDefaultSettingsChange = async () => {
      await loadDefaultSettings()
    }
    
    window.addEventListener('defaultCardSettingsChanged', handleDefaultSettingsChange)
    
    return () => {
      window.removeEventListener('defaultCardSettingsChanged', handleDefaultSettingsChange)
    }
  }, [currentUser])
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
      setPriority(task.priority || "A")
      setStatus(task.status || "todo")
      setSelectedLabels(task.labels || [])
      setChecklists(task.checklists || [])
      
      // membersの構造を正しく処理
      const processedMembers = (task.members || []).map((member: any) => ({
        id: member.id || member.employee?.id || member.employeeId || "",
        name: member.name || member.employee?.name || "未設定",
        email: member.email || member.employee?.email || "",
        employee: member.employee, // employeeオブジェクト全体を保持
      }))
      console.log("Processing task members:", task.members, "->", processedMembers)
      setMembers(processedMembers)
      
      setCardColor(task.cardColor || "")
      
      // ファイル情報を復元（新しい実装）
      if (task.attachments && Array.isArray(task.attachments)) {
        console.log("Restoring files from task:", task.attachments)
        
        // フォルダ情報とファイル情報を分離
        const foldersMetadata = task.attachments.find((item: any) => item.id === '_folders_metadata' && item.isMetadata)
        if (foldersMetadata && foldersMetadata.folders && Array.isArray(foldersMetadata.folders)) {
          setFolders(foldersMetadata.folders)
          setCurrentFolder(foldersMetadata.folders[0] || "資料")
        }
        
        // ファイルをアップロード済みファイルリストに設定（メタデータを除く）
        const fileList = task.attachments
          .filter((file: any) => !file.isMetadata && file.id !== '_folders_metadata')
          .map((file: any) => ({
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
      // チェックリスト入力用の状態変数もリセット
      setIsAddingChecklist(false)
      setNewChecklistTitle("")
      setEditingChecklistId(null)
      setEditingChecklistTitle("")
      setAddingItemToChecklistId(null)
      setNewChecklistItemText("")
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
    setIsAddingChecklist(true)
    setNewChecklistTitle("")
    setIsComposingNewChecklistTitle(false)
    setIsIMEActiveNewChecklistTitle(false)
  }

  const handleConfirmAddChecklist = () => {
    if (newChecklistTitle.trim()) {
      const newChecklist: Checklist = {
        id: `checklist-${Date.now()}`,
        title: newChecklistTitle.trim(),
        items: [],
      }
      setChecklists([...checklists, newChecklist])
      setIsAddingChecklist(false)
      setNewChecklistTitle("")
      setIsComposingNewChecklistTitle(false)
      setIsIMEActiveNewChecklistTitle(false)
    }
  }

  const handleAddChecklistItem = (checklistId: string) => {
    setAddingItemToChecklistId(checklistId)
    setNewChecklistItemText("")
    setIsComposingChecklistItemInput(false)
    setIsIMEActiveChecklistItemInput(false)
  }

  const handleConfirmAddChecklistItem = () => {
    if (addingItemToChecklistId && newChecklistItemText.trim()) {
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === addingItemToChecklistId
            ? {
                ...checklist,
                items: [...checklist.items, { id: `item-${Date.now()}`, text: newChecklistItemText.trim(), completed: false }],
              }
            : checklist,
        ),
      )
      setAddingItemToChecklistId(null)
      setNewChecklistItemText("")
      setIsComposingChecklistItemInput(false)
      setIsIMEActiveChecklistItemInput(false)
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

  const handleEditChecklistTitle = (checklistId: string, currentTitle: string) => {
    setEditingChecklistId(checklistId)
    setEditingChecklistTitle(currentTitle)
    setIsComposingEditChecklistTitle(false)
    setIsIMEActiveEditChecklistTitle(false)
  }

  const handleConfirmEditChecklistTitle = () => {
    if (editingChecklistId && editingChecklistTitle.trim() !== "") {
      setChecklists(
        checklists.map((checklist) =>
          checklist.id === editingChecklistId
            ? { ...checklist, title: editingChecklistTitle.trim() }
            : checklist,
        ),
      )
      setEditingChecklistId(null)
      setEditingChecklistTitle("")
      setIsComposingEditChecklistTitle(false)
      setIsIMEActiveEditChecklistTitle(false)
    }
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

  const handleAddPriority = async () => {
    if (!currentUser || !newPriorityLabel.trim()) return
    
    // 管理者・総務のみ追加可能
    if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
      alert("重要度の追加は管理者・総務のみ可能です。")
      return
    }
    
    try {
      // 値は自動生成（ラベルの最初の文字を小文字にしたもの）
      const autoValue = newPriorityLabel.toLowerCase().replace(/\s+/g, '-')
      const newOptions = [...priorityOptions, { value: autoValue, label: newPriorityLabel.trim() }]
      
      // PostgreSQLに保存（デフォルトカード設定として）
      const response = await fetch('/api/default-card-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({
          labels: customLabels,
          priorities: newOptions,
          statuses: statusOptions.filter(s => !s.isDefault),
          defaultCardColor: "",
          defaultListColor: "",
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存に失敗しました')
      }
      
      setPriorityOptions(newOptions)
      setNewPriorityLabel("")
      
      // localStorageにも保存（フォールバック用）
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-priority-options', JSON.stringify(newOptions))
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('defaultCardSettingsChanged'))
      }
    } catch (error) {
      console.error('Failed to save priority:', error)
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeletePriority = async (value: string) => {
    if (!currentUser) return
    
    // 管理者・総務のみ削除可能
    if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
      alert("重要度の削除は管理者・総務のみ可能です。")
      return
    }
    
    try {
      const newOptions = priorityOptions.filter((p) => p.value !== value)
      
      // PostgreSQLに保存（デフォルトカード設定として）
      const response = await fetch('/api/default-card-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({
          labels: customLabels,
          priorities: newOptions,
          statuses: statusOptions.filter(s => !s.isDefault),
          defaultCardColor: "",
          defaultListColor: "",
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存に失敗しました')
      }
      
      setPriorityOptions(newOptions)
      
      // localStorageにも保存（フォールバック用）
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-priority-options', JSON.stringify(newOptions))
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('defaultCardSettingsChanged'))
      }
    } catch (error) {
      console.error('Failed to delete priority:', error)
      alert(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleAddStatus = async () => {
    if (!currentUser || !newStatusLabel.trim()) return
    
    // 管理者・総務のみ追加可能
    if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
      alert("状態の追加は管理者・総務のみ可能です。")
      return
    }
    
    try {
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
      
      // PostgreSQLに保存（デフォルトカード設定として）
      const response = await fetch('/api/default-card-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({
          labels: customLabels,
          priorities: priorityOptions,
          statuses: newOptions.filter(s => !s.isDefault),
          defaultCardColor: "",
          defaultListColor: "",
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存に失敗しました')
      }
      
      setStatusOptions(newOptions)
      setNewStatusLabel("")
      
      // カスタムオプションのみlocalStorageに保存（フォールバック用）
      const customOptions = newOptions.filter(s => !s.isDefault)
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-status-options', JSON.stringify(customOptions))
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('defaultCardSettingsChanged'))
      }
    } catch (error) {
      console.error('Failed to save status:', error)
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeleteStatus = async (value: string) => {
    if (!currentUser) return
    
    // デフォルトオプションは削除できない
    const option = statusOptions.find(s => s.value === value)
    if (option?.isDefault) {
      alert('この状態は削除できません。')
      return
    }
    
    // 管理者・総務のみ削除可能
    if (currentUser.role !== 'admin' && currentUser.role !== 'hr') {
      alert("状態の削除は管理者・総務のみ可能です。")
      return
    }
    
    try {
      const newOptions = statusOptions.filter((s) => s.value !== value)
      
      // PostgreSQLに保存（デフォルトカード設定として）
      const response = await fetch('/api/default-card-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id,
        },
        body: JSON.stringify({
          labels: customLabels,
          priorities: priorityOptions,
          statuses: newOptions.filter(s => !s.isDefault),
          defaultCardColor: "",
          defaultListColor: "",
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存に失敗しました')
      }
      
      setStatusOptions(newOptions)
      
      // カスタムオプションのみlocalStorageに保存（フォールバック用）
      const customOptions = newOptions.filter(s => !s.isDefault)
      if (typeof window !== 'undefined') {
        localStorage.setItem('task-status-options', JSON.stringify(customOptions))
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('defaultCardSettingsChanged'))
      }
    } catch (error) {
      console.error('Failed to delete status:', error)
      alert(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    (emp) => {
      const isNotInvisibleTop = !emp.isInvisibleTop
      const isShownInOrgChart = emp.showInOrgChart !== false
      const isActiveOrLeave = (emp.status === 'active' || emp.status === 'leave' || emp.status === undefined || emp.status === null)
      const isNotCopy = emp.status !== 'copy'
      const matchesSearch = (emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.department?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.position?.toLowerCase().includes(employeeSearch.toLowerCase()))
      
      const result = isNotInvisibleTop && isShownInOrgChart && isActiveOrLeave && isNotCopy && matchesSearch
      
      // デバッグログ
      if (!result) {
        console.log(`Employee ${emp.name} filtered out:`, {
          isNotInvisibleTop,
          isShownInOrgChart,
          isActiveOrLeave,
          isNotCopy,
          matchesSearch,
          emp
        })
      }
      
      return result
    }
  )
  
  console.log('Filtered employees count:', filteredEmployees.length)
  console.log('Employee search term:', employeeSearch)

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
      // フォルダ情報をattachmentsに含める（メタデータとして）
      const attachmentsWithFolders = [
        ...uploadedFiles,
        // フォルダ情報をメタデータとして追加（先頭に特殊オブジェクトとして保存）
        ...(folders.length > 0 ? [{ 
          id: '_folders_metadata',
          type: '_metadata',
          folders: folders,
          isMetadata: true
        }] : [])
      ]

      const requestBody = {
        title: title || "",
        description: description || "",
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority: priority || "A",
        status: status || "todo",
        labels: selectedLabels || [],
        checklists: checklists || [],
        cardColor: cardColor || null,
        isArchived: isArchived || false,
        members: members || [],
        attachments: attachmentsWithFolders, // ファイル情報とフォルダ情報を含める
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
            employee: member.employee, // employeeオブジェクト全体を保持
          }))
          
          console.log("Card saved - received members:", result.card.members)
          console.log("Card saved - processed members:", processedMembers)

          setTitle(result.card.title || "")
          setDescription(result.card.description || "")
          setDueDate(result.card.dueDate ? new Date(result.card.dueDate) : undefined)
          setPriority(result.card.priority || "A")
          setStatus(result.card.status || "todo")
          setSelectedLabels(result.card.labels || [])
          setChecklists(result.card.checklists || [])
          setMembers(processedMembers)
          setCardColor(result.card.cardColor || "")
          
          // ファイル情報も更新
          if (result.card.attachments && Array.isArray(result.card.attachments)) {
            // フォルダ情報を復元
            const foldersMetadata = result.card.attachments.find((item: any) => item.id === '_folders_metadata' && item.isMetadata)
            if (foldersMetadata && foldersMetadata.folders && Array.isArray(foldersMetadata.folders)) {
              setFolders(foldersMetadata.folders)
              setCurrentFolder(foldersMetadata.folders[0] || "資料")
            }
            
            // ファイル情報を復元（メタデータを除く）
            const fileList = result.card.attachments
              .filter((file: any) => !file.isMetadata && file.id !== '_folders_metadata')
              .map((file: any) => ({
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
              priority: result.card.priority || "A",
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
        
        // カード変更イベントを発火（S3自動保存用）
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cardChanged'))
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
          
          // カード変更イベントを発火（S3自動保存用）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cardChanged'))
          }
          
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

  // デバッグ用：openとtaskの状態をログ出力
  useEffect(() => {
    console.log('TaskDetailDialog render:', { open, task: task?.id, taskTitle: task?.title })
  }, [open, task])

  if (!task) {
    console.log('TaskDetailDialog: task is null, returning null')
    return null
  }

  // currentFileFolderは不要になったので削除

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] !max-w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden z-[100] !top-[5%] !translate-y-0 !translate-x-[-50%] pointer-events-auto sm:w-auto sm:!max-w-5xl"
        showCloseButton={false}
        style={{ 
          backgroundColor: cardColor && cardColor !== "" ? cardColor : "white",
          zIndex: 100,
          pointerEvents: 'auto'
        }}
      >
        {/* カスタム閉じるボタン（わかりやすく大きく表示） */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 shadow-md"
          aria-label="閉じる"
        >
          <X className="w-5 h-5 text-slate-700" />
        </Button>
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8 min-w-0 w-full">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false)
                    // 元のタイトルに戻す（必要に応じて）
                  }
                }}
                className="text-2xl font-bold border-2 border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 px-3 py-2 w-full max-w-full"
                placeholder="タスク名"
                autoFocus
              />
            ) : (
              <DialogTitle className="text-2xl font-bold text-slate-900 flex-1 pr-4 break-words min-w-0">
                {title || "タスク名なし"}
              </DialogTitle>
            )}
            {!isEditingTitle && cardPermissions?.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(true)}
                className="mt-1"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                編集
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-x-hidden w-full max-w-full break-words">
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
              onClick={(e) => {
                e.stopPropagation()
                console.log('ラベル追加ボタンクリック')
                setShowLabelSelector(true)
              }}
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
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="ラベル名"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="bg-white flex-1 min-w-0"
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
                className="bg-white w-full max-w-full resize-none"
              />
          </div>

          {/* Due Date with Google Calendar Sync */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              締切日
            </label>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1 justify-start bg-transparent pointer-events-auto min-w-0 overflow-hidden text-ellipsis"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('締切日ボタンクリック')
                  setShowCalendarSelector(true)
                }}
              >
                <span className="truncate">{dueDate ? format(dueDate, "PPP", { locale: ja }) : "日付を選択"}</span>
              </Button>
            </div>
          </div>

          {/* Priority and Status with Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="重要度の表示名（例：最高）"
                      value={newPriorityLabel}
                      onChange={(e) => setNewPriorityLabel(e.target.value)}
                      className="text-sm flex-1 min-w-0 bg-white"
                    />
                    <Button size="sm" onClick={handleAddPriority} className="flex-shrink-0">
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
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="状態の表示名（例：保留中）"
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      className="text-sm flex-1 min-w-0 bg-white"
                    />
                    <Button size="sm" onClick={handleAddStatus} className="flex-shrink-0">
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
              {members.map((member) => {
                // ローカルストレージから画像の文字列を取得
                const avatarText = typeof window !== 'undefined' 
                  ? localStorage.getItem(`employee-avatar-text-${member.id}`) || (member.name || "未").slice(0, 3)
                  : (member.name || "未").slice(0, 3)
                
                return (
                  <div key={member.id} className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 min-w-0">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback 
                        employeeType={member.employee?.employeeType}
                        className={`font-semibold whitespace-nowrap overflow-hidden ${
                          /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-sm' : 'text-xs'
                        }`}
                      >
                        {avatarText.slice(0, 3)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate min-w-0">{member.name}</span>
                    {cardPermissions?.canAddMembers && (
                      <button onClick={() => handleRemoveMember(member.id)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              })}
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
                  {(() => {
                    console.log('Rendering filtered employees:', filteredEmployees.length)
                    return filteredEmployees.map((employee) => {
                      const isSelected = members.find((m) => m.id === employee.id)
                      console.log('Rendering employee:', employee.name, 'isSelected:', isSelected)
                      return (
                        <button
                          key={employee.id}
                          onClick={() => handleAddEmployee(employee)}
                          className={`w-full text-left p-3 rounded hover:bg-slate-50 flex items-center gap-3 transition-colors ${
                            isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'border border-transparent'
                          }`}
                        >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback 
                            employeeType={employee.employeeType}
                            className={`font-semibold whitespace-nowrap overflow-hidden ${
                              /^[a-zA-Z\s]+$/.test((employee.name || "未").slice(0, 3)) ? 'text-sm' : 'text-xs'
                            } ${
                              isSelected ? 'bg-blue-600 text-white' : ''
                            }`}
                          >
                            {(() => {
                              const avatarText = typeof window !== 'undefined' 
                                ? localStorage.getItem(`employee-avatar-text-${employee.id}`) || (employee.name || "未").slice(0, 3)
                                : (employee.name || "未").slice(0, 3)
                              return avatarText.slice(0, 3)
                            })()}
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
                  })
                  })()}
                  {filteredEmployees.length === 0 && (
                    <p className="text-center text-slate-500 py-4 text-sm">
                      {employees.length === 0 
                        ? 'ワークスペースにメンバーが登録されていません。ワークスペース設定からメンバーを追加してください。' 
                        : '該当する社員が見つかりません'}
                    </p>
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
              {!isAddingChecklist ? (
                <Button variant="outline" size="sm" onClick={handleAddChecklist}>
                  <Plus className="w-3 h-3 mr-1" />
                  チェックリストを追加
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="チェックリスト名を入力"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onCompositionStart={() => {
                      setIsComposingNewChecklistTitle(true)
                      setIsIMEActiveNewChecklistTitle(true)
                    }}
                    onCompositionEnd={() => {
                      setIsComposingNewChecklistTitle(false)
                      setTimeout(() => setIsIMEActiveNewChecklistTitle(false), 100)
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement
                      if (target.composing || target.isComposing) {
                        setIsIMEActiveNewChecklistTitle(true)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (isComposingNewChecklistTitle || isIMEActiveNewChecklistTitle) {
                          e.preventDefault()
                          return
                        }
                        e.preventDefault()
                        handleConfirmAddChecklist()
                      }
                    }}
                    className="bg-blue-50 border-blue-300 border-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleConfirmAddChecklist} className="flex-shrink-0">
                    追加
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingChecklist(false)
                      setNewChecklistTitle("")
                      setIsComposingNewChecklistTitle(false)
                      setIsIMEActiveNewChecklistTitle(false)
                    }}
                    className="flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {checklists.map((checklist) => {
                const completedCount = checklist.items.filter((item) => item.completed).length
                const totalCount = checklist.items.length
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

                return (
                  <div key={checklist.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {editingChecklistId === checklist.id ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Input
                              value={editingChecklistTitle}
                              onChange={(e) => setEditingChecklistTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (isComposingEditChecklistTitle || isIMEActiveEditChecklistTitle) {
                                    e.preventDefault()
                                    return
                                  }
                                  e.preventDefault()
                                  handleConfirmEditChecklistTitle()
                                } else if (e.key === "Escape") {
                                  setEditingChecklistId(null)
                                  setEditingChecklistTitle("")
                                  setIsComposingEditChecklistTitle(false)
                                  setIsIMEActiveEditChecklistTitle(false)
                                }
                              }}
                              onCompositionStart={() => {
                                setIsComposingEditChecklistTitle(true)
                                setIsIMEActiveEditChecklistTitle(true)
                              }}
                              onCompositionEnd={() => {
                                setIsComposingEditChecklistTitle(false)
                                setTimeout(() => setIsIMEActiveEditChecklistTitle(false), 100)
                              }}
                              onInput={(e) => {
                                const target = e.target as HTMLInputElement
                                if (target.composing || target.isComposing) {
                                  setIsIMEActiveEditChecklistTitle(true)
                                }
                              }}
                              className="flex-1 min-w-0 bg-blue-50 border-blue-300 border-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleConfirmEditChecklistTitle}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingChecklistId(null)
                                setEditingChecklistTitle("")
                                  setIsComposingEditChecklistTitle(false)
                                  setIsIMEActiveEditChecklistTitle(false)
                              }}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-medium break-words flex-1 min-w-0">{checklist.title}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditChecklistTitle(checklist.id, checklist.title)}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
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
                        <div key={item.id} className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleChecklistItem(checklist.id, item.id)}
                            className="flex-shrink-0"
                          />
                          <span className={`flex-1 text-sm min-w-0 break-words ${item.completed ? "line-through text-slate-500" : ""}`}>
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
                    {addingItemToChecklistId === checklist.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          placeholder="チェック項目を入力"
                          value={newChecklistItemText}
                          onChange={(e) => setNewChecklistItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (isComposingChecklistItemInput || isIMEActiveChecklistItemInput) {
                                e.preventDefault()
                                return
                              }
                              e.preventDefault()
                              handleConfirmAddChecklistItem()
                            } else if (e.key === "Escape") {
                              setAddingItemToChecklistId(null)
                              setNewChecklistItemText("")
                              setIsComposingChecklistItemInput(false)
                              setIsIMEActiveChecklistItemInput(false)
                            }
                          }}
                          onCompositionStart={() => {
                            setIsComposingChecklistItemInput(true)
                            setIsIMEActiveChecklistItemInput(true)
                          }}
                          onCompositionEnd={() => {
                            setIsComposingChecklistItemInput(false)
                            setTimeout(() => setIsIMEActiveChecklistItemInput(false), 100)
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement
                            if (target.composing || target.isComposing) {
                              setIsIMEActiveChecklistItemInput(true)
                            }
                          }}
                          className="flex-1 bg-blue-50 border-blue-300 border-2 focus-visible:ring-blue-400 focus-visible:border-blue-400"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleConfirmAddChecklistItem} className="flex-shrink-0">
                          追加
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAddingItemToChecklistId(null)
                            setNewChecklistItemText("")
                            setIsComposingChecklistItemInput(false)
                            setIsIMEActiveChecklistItemInput(false)
                          }}
                          className="flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddChecklistItem(checklist.id)}
                        className="mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        項目を追加
                      </Button>
                    )}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      placeholder="フォルダ名"
                      value={newFileFolderName}
                      onChange={(e) => setNewFileFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFileFolder()}
                      className="flex-1 min-w-0 sm:w-32 h-8 text-sm bg-white"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddFileFolder} className="flex-shrink-0">
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingFileFolder(false)
                        setNewFileFolderName("")
                      }}
                      className="flex-shrink-0"
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
                                
                                // 安全に削除（ブラウザが処理するまで少し待つ）
                                setTimeout(() => {
                                  if (link.parentNode === document.body) {
                                    document.body.removeChild(link)
                                  }
                                  window.URL.revokeObjectURL(url)
                                }, 100)
                                
                                console.log("File downloaded successfully:", file.name)
                              } catch (error) {
                                console.error("Download error:", error)
                                if (error instanceof Error && error.message.includes('fetch')) {
                                  alert("ネットワークエラーが発生しました。ファイルサーバーに接続できません。")
                                } else {
                                  alert("ファイルのダウンロードに失敗しました")
                                }
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
          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t pb-6 sm:pb-0 w-full">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-red-200 flex-1 sm:flex-initial min-w-0"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </Button>
              <Button variant="outline" onClick={handleMakeTemplate} className="gap-2 bg-transparent flex-1 sm:flex-initial min-w-0">
                <FileText className="w-4 h-4" />
                <span className="truncate">テンプレート化</span>
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
                キャンセル
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

    </Dialog>

    {/* ラベル選択ダイアログ - 親Dialogの外に配置 */}
    <Dialog open={showLabelSelector} onOpenChange={setShowLabelSelector}>
      <DialogContent className="max-w-md z-[110]" data-panel="label-selector" style={{ zIndex: 110 }}>
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

    {/* カレンダー選択ダイアログ - 親Dialogの外に配置 */}
    <Dialog open={showCalendarSelector} onOpenChange={setShowCalendarSelector}>
      <DialogContent className="max-w-sm z-[110]" data-panel="calendar-selector" style={{ zIndex: 110 }}>
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
    </>
  )
}
