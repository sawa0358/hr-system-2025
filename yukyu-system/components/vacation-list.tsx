"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Calendar, AlertTriangle, Loader2, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { VacationPatternSelector } from "./vacation-pattern-selector"
import { VacationRequestForm } from "./vacation-request-form"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getPermissions } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface VacationListProps {
  userRole: "employee" | "admin"
  filter: "pending" | "all"
  onEmployeeClick?: (employeeId: string, employeeName: string) => void
  employeeId?: string // 表示する社員ID（社員モードで使用）
  onPendingCountChange?: (count: number) => void // 承認待ちの申請数を通知するコールバック
  supervisorId?: string // 上司ID（「ほか一覧」画面で使用）
  disableCardClick?: boolean // カードクリックを無効化（店長・マネージャー用）
  filters?: {
    searchQuery: string
    department: string
    status: string
    employeeType: string
    position: string
    showInOrgChart: string
  }
}

export function VacationList({ userRole, filter, onEmployeeClick, employeeId, filters, onPendingCountChange, supervisorId, disableCardClick }: VacationListProps) {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  // 管理者用: APIから全社員の有給統計を取得
  const [adminEmployees, setAdminEmployees] = useState<
    { id: string; name: string; employeeNumber?: string; joinDate?: string; employeeType?: string; department?: string; position?: string; organization?: string; employeeStatus?: string; status?: string; showInOrgChart?: boolean; remaining: number; used: number; pending: number; granted: number; latestGrantDays?: number; requestId?: string }[]
  >([])
  // 社員用: APIから申請一覧を取得
  const [employeeRequests, setEmployeeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "status" | "days">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [periodFilter, setPeriodFilter] = useState<"all" | "current" | "last" | "twoYearsAgo" | "next">("current") // デフォルトは今期
  const [periodData, setPeriodData] = useState<{
    current?: { startDate: string; endDate: string }
    last?: { startDate: string; endDate: string }
    twoYearsAgo?: { startDate: string; endDate: string }
    next?: { startDate: string; endDate: string | null }
  } | null>(null)
  const [editingRequest, setEditingRequest] = useState<any | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [minGrantDaysForAlert, setMinGrantDaysForAlert] = useState(10) // デフォルト: 10日
  const [minLegalUseDaysPerYear, setMinLegalUseDaysPerYear] = useState(5) // デフォルト: 5日（法定最低取得日数）
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordDialogAction, setPasswordDialogAction] = useState<'edit' | 'delete' | null>(null)
  const [passwordDialogRequestId, setPasswordDialogRequestId] = useState<string | null>(null)
  const [passwordDialogEditingRequest, setPasswordDialogEditingRequest] = useState<any | null>(null)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [finalizingRequestId, setFinalizingRequestId] = useState<string | null>(null)
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false) // 決済処理中フラグ

  useEffect(() => {
    const load = async () => {
      // 設定を読み込んでアラート判定の閾値を取得
      try {
        const configRes = await fetch('/api/vacation/config')
        if (configRes.ok) {
          const config = await configRes.json()
          if (config.alert?.minGrantDaysForAlert !== undefined) {
            setMinGrantDaysForAlert(config.alert.minGrantDaysForAlert)
          }
          if (config.minLegalUseDaysPerYear !== undefined) {
            setMinLegalUseDaysPerYear(config.minLegalUseDaysPerYear)
          }
        }
      } catch (error) {
        console.warn('[有給管理] 設定読み込みエラー:', error)
        // エラー時はデフォルト値を使用
      }
      
      if (userRole === "admin") {
        setLoading(true)
        try {
          // 現在のview（pending or all）を取得
          const currentView = filter === "pending" ? "pending" : "all"
          // supervisorIdが指定されている場合は、supervisorIdでフィルタリング
          const url = supervisorId 
            ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
            : `/api/vacation/admin/applicants?view=${currentView}`
          const res = await fetch(url)
          if (res.ok) {
            const json = await res.json()
            console.log(`[有給管理] 社員データ取得: ${json.employees?.length || 0}件${supervisorId ? ` (supervisorId: ${supervisorId})` : ''}`)
            setAdminEmployees(json.employees || [])
          } else {
            console.error(`[有給管理] APIエラー: ${res.status}`)
            setAdminEmployees([])
          }
        } finally {
          setLoading(false)
        }
      } else if (userRole === "employee" && employeeId) {
        // 社員モードの場合、特定社員の申請一覧を取得
        setLoading(true)
        try {
          console.log(`[VacationList] 申請一覧取得開始: employeeId=${employeeId}`)
          const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
          if (res.ok) {
            const json = await res.json()
            console.log(`[VacationList] 申請一覧取得成功: requests=${json.requests?.length || 0}`)
            setEmployeeRequests(json.requests || [])
          } else {
            const errorText = await res.text().catch(() => "Unknown error")
            console.error(`[VacationList] 申請一覧取得エラー: status=${res.status}, error=${errorText}`)
            setEmployeeRequests([])
          }
          
          // 期間データを取得（期間フィルター用）
          const periodRes = await fetch(`/api/vacation/grant-calculation/${employeeId}`)
          if (periodRes.ok) {
            const periodJson = await periodRes.json()
            const periods: {
              current?: { startDate: string; endDate: string }
              last?: { startDate: string; endDate: string }
              twoYearsAgo?: { startDate: string; endDate: string }
              next?: { startDate: string; endDate: string | null }
            } = {}
            
            if (periodJson.currentYear) {
              periods.current = {
                startDate: periodJson.currentYear.startDate,
                endDate: periodJson.currentYear.endDate || new Date().toISOString().slice(0, 10),
              }
            }
            if (periodJson.lastYear) {
              periods.last = {
                startDate: periodJson.lastYear.startDate,
                endDate: periodJson.lastYear.endDate,
              }
            }
            if (periodJson.twoYearsAgo) {
              periods.twoYearsAgo = {
                startDate: periodJson.twoYearsAgo.startDate,
                endDate: periodJson.twoYearsAgo.endDate,
              }
            }
            if (periodJson.nextYear) {
              periods.next = {
                startDate: periodJson.nextYear.startDate,
                endDate: periodJson.nextYear.endDate,
              }
            }
            
            setPeriodData(periods)
          }
        } catch (error) {
          console.error("申請一覧取得エラー:", error)
          setEmployeeRequests([])
        } finally {
          setLoading(false)
        }
      }
    }
    load()
    
    // 申請更新イベントをリッスン
    const handleUpdate = () => {
      load()
    }
    window.addEventListener('vacation-request-updated', handleUpdate)
    return () => {
      window.removeEventListener('vacation-request-updated', handleUpdate)
    }
  }, [userRole, employeeId, filter, supervisorId])

  const getStatusBadge = (status: string, approvedBy?: string | null, finalizedBy?: string | null) => {
    // 決済済み（approved + finalizedBy != null）
    if (status?.toLowerCase() === "approved" && finalizedBy != null && finalizedBy !== "") {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 text-white">
          <CheckCircle className="h-3 w-3" />
          決済済み
        </Badge>
      )
    }
    
    // 決済待ち（approved + approvedBy != null + finalizedBy == null）
    if (status?.toLowerCase() === "approved" && approvedBy != null && approvedBy !== "" && (!finalizedBy || finalizedBy === "")) {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
          <Clock className="h-3 w-3" />
          決済待ち
        </Badge>
      )
    }
    
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            申請中
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-chart-2 text-white">
            <CheckCircle className="h-3 w-3" />
            承認済み
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            却下
          </Badge>
        )
      default:
        return null
    }
  }

  // 承認処理
  const handleApprove = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId)
      const approverId = currentUser?.id

      const res = await fetch(`/api/vacation/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverId }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "承認に失敗しました")
      }

      const data = await res.json()
      if (data.finalized) {
        toast({
          title: "決済完了",
          description: "有給申請を決済しました。申請中の日数が取得済みに加算され、残り有給日数から減算されました。",
        })
      } else {
        toast({
          title: "承認完了",
          description: "有給申請を承認しました。決済待ちです。",
        })
      }

      // データを再読み込み
      window.dispatchEvent(new Event('vacation-request-updated'))
      if (userRole === "admin") {
        // 現在のview（pending or all）を取得
        const currentView = filter === "pending" ? "pending" : "all"
        // supervisorIdが指定されている場合は、supervisorIdでフィルタリング
        const url = supervisorId 
          ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
          : `/api/vacation/admin/applicants?view=${currentView}`
        console.log(`[有給管理] 承認後のデータ取得開始: url=${url}, filter=${filter}, supervisorId=${supervisorId || 'なし'}`)
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          console.log(`[有給管理] 承認後の社員データ取得: ${json.employees?.length || 0}件${supervisorId ? ` (supervisorId: ${supervisorId})` : ''}`)
          console.log(`[有給管理] 承認後のデータ詳細:`, json.employees?.map((e: any) => ({ name: e.name, requestId: e.requestId, status: e.status, approvedBy: e.approvedBy, finalizedBy: e.finalizedBy, supervisorId: e.supervisorId })))
          setAdminEmployees(json.employees || [])
        } else {
          console.error(`[有給管理] 承認後のAPIエラー: ${res.status}`)
          setAdminEmployees([])
        }
      } else {
        // 社員モードの場合は申請一覧を再読み込み
        if (employeeId) {
          const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
          if (res.ok) {
            const json = await res.json()
            setEmployeeRequests(json.requests || [])
          }
        }
      }
    } catch (error: any) {
      console.error("承認エラー:", error)
      toast({
        title: "承認エラー",
        description: error?.message || "承認に失敗しました",
        variant: "destructive",
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  // 決済処理
  const handleFinalize = async (requestId: string) => {
    // 既に処理中の場合は重複実行を防ぐ
    if (isFinalizing) {
      return
    }
    
    try {
      setIsFinalizing(true) // 決済処理開始
      const approverId = currentUser?.id

      const res = await fetch(`/api/vacation/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverId }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "決済に失敗しました")
      }

      toast({
        title: "決済完了",
        description: "有給申請を決済しました。申請中の日数が取得済みに加算され、残り有給日数から減算されました。",
      })

      // データを再読み込み
      window.dispatchEvent(new Event('vacation-request-updated'))
      if (userRole === "admin") {
        // 現在のview（pending or all）を取得
        const currentView = filter === "pending" ? "pending" : "all"
        // supervisorIdが指定されている場合は、supervisorIdでフィルタリング
        const url = supervisorId 
          ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
          : `/api/vacation/admin/applicants?view=${currentView}`
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          console.log(`[有給管理] 決済後の社員データ取得: ${json.employees?.length || 0}件${supervisorId ? ` (supervisorId: ${supervisorId})` : ''}`)
          setAdminEmployees(json.employees || [])
        } else {
          console.error(`[有給管理] 決済後のAPIエラー: ${res.status}`)
          setAdminEmployees([])
        }
      } else {
        // 社員モードの場合は申請一覧を再読み込み
        if (employeeId) {
          const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
          if (res.ok) {
            const json = await res.json()
            setEmployeeRequests(json.requests || [])
          }
        }
      }
    } catch (error: any) {
      console.error("決済エラー:", error)
      toast({
        title: "決済エラー",
        description: error?.message || "決済に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsFinalizing(false) // 決済処理完了
      setFinalizingRequestId(null)
      setIsFinalizeDialogOpen(false)
    }
  }

  // 来期申請エラーメッセージの状態
  const [nextPeriodError, setNextPeriodError] = useState<string | null>(null)
  const [isNextPeriodErrorDialogOpen, setIsNextPeriodErrorDialogOpen] = useState(false)

  // 決済確認ダイアログの表示（来期チェック付き）
  const handleFinalizeClick = async (requestId: string, request: any) => {
    // 来期の申請かどうかをチェック
    const employeeIdForCheck = request.employeeId || request.id
    const startDate = request.startDate
    
    if (employeeIdForCheck && startDate) {
      try {
        // 来期チェック用のAPIを呼び出す（決済APIを呼んでエラーを確認）
        const res = await fetch(`/api/vacation/requests/${requestId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approverId: currentUser?.id }),
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          if (errorData.isNextPeriodRequest) {
            // 来期の申請の場合、エラーメッセージを表示
            setNextPeriodError(errorData.error || "来期中の申請のため、決済できません")
            setIsNextPeriodErrorDialogOpen(true)
            return
          }
          // 他のエラーの場合はtoastで表示
          toast({
            title: "決済エラー",
            description: errorData.error || "決済に失敗しました",
            variant: "destructive",
          })
          return
        }
        
        // 成功した場合（来期チェックを通過して決済完了）
        toast({
          title: "決済完了",
          description: "有給申請を決済しました。申請中の日数が取得済みに加算され、残り有給日数から減算されました。",
        })
        
        // データを再読み込み
        window.dispatchEvent(new Event('vacation-request-updated'))
        if (userRole === "admin") {
          const currentView = filter === "pending" ? "pending" : "all"
          const url = supervisorId 
            ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
            : `/api/vacation/admin/applicants?view=${currentView}`
          const reloadRes = await fetch(url)
          if (reloadRes.ok) {
            const json = await reloadRes.json()
            setAdminEmployees(json.employees || [])
          }
        }
        return
      } catch (error: any) {
        console.error("決済チェックエラー:", error)
        toast({
          title: "エラー",
          description: "決済処理中にエラーが発生しました",
          variant: "destructive",
        })
        return
      }
    }
    
    // フォールバック: 従来の確認ダイアログを表示
    setFinalizingRequestId(requestId)
    setIsFinalizeDialogOpen(true)
    setIsFinalizing(false)
  }

  // 決済確認ダイアログのキャンセル
  const handleFinalizeCancel = () => {
    if (!isFinalizing) { // 決済処理中でない場合のみキャンセル可能
      setFinalizingRequestId(null)
      setIsFinalizeDialogOpen(false)
    }
  }

  // 却下処理
  const handleReject = async (requestId: string) => {
    const reason = prompt("却下理由を入力してください（省略可）:")
    if (reason === null) {
      // キャンセルされた場合
      return
    }

    try {
      setProcessingRequestId(requestId)
      const approverId = currentUser?.id

      const res = await fetch(`/api/vacation/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason: reason || "管理者による却下",
          approverId,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "却下に失敗しました")
      }

      toast({
        title: "却下完了",
        description: "有給申請を却下しました。申請中の日数が残り有給日数に戻りました。",
      })

      // データを再読み込み
      window.dispatchEvent(new Event('vacation-request-updated'))
      if (userRole === "admin") {
        // 現在のview（pending or all）を取得
        const currentView = filter === "pending" ? "pending" : "all"
        // supervisorIdが指定されている場合は、supervisorIdでフィルタリング
        const url = supervisorId 
          ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
          : `/api/vacation/admin/applicants?view=${currentView}`
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          console.log(`[有給管理] 却下後の社員データ取得: ${json.employees?.length || 0}件${supervisorId ? ` (supervisorId: ${supervisorId})` : ''}`)
          setAdminEmployees(json.employees || [])
        } else {
          console.error(`[有給管理] 却下後のAPIエラー: ${res.status}`)
          setAdminEmployees([])
        }
      } else {
        // 社員モードの場合は申請一覧を再読み込み
        const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
        if (res.ok) {
          const json = await res.json()
          setEmployeeRequests(json.requests || [])
        }
      }
    } catch (error: any) {
      console.error("却下エラー:", error)
      toast({
        title: "却下エラー",
        description: error?.message || "却下に失敗しました",
        variant: "destructive",
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  // 修正処理
  const handleEdit = (request: any) => {
    // 承認済み・却下の申請の編集は、パスワード確認ダイアログ経由で実行される
    // ここでは通常の編集（承認待ち）のみ処理
    const status = request.status?.toLowerCase()
    if (status === "approved" || status === "rejected") {
      // 承認済み・却下の申請は、パスワード確認ダイアログ経由で編集される
      // ここでは通常の編集（承認待ち）のみ処理する
      toast({
        title: "エラー",
        description: "承認済み・却下の申請は、パスワード確認後に編集できます",
        variant: "destructive",
      })
      return
    }
    setEditingRequest(request)
    setIsEditDialogOpen(true)
  }

  // 削除処理
  const handleDelete = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId)
      const res = await fetch(`/api/vacation/requests/${requestId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser?.id }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "削除に失敗しました")
      }

      toast({
        title: "削除完了",
        description: "有給申請を削除しました。申請中の日数が残り有給日数に戻りました。",
      })

      // データを再読み込み
      window.dispatchEvent(new Event('vacation-request-updated'))
      if (userRole === "employee" && employeeId) {
        const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
        if (res.ok) {
          const json = await res.json()
          setEmployeeRequests(json.requests || [])
        }
      }
    } catch (error: any) {
      console.error("削除エラー:", error)
      toast({
        title: "削除エラー",
        description: error?.message || "削除に失敗しました",
        variant: "destructive",
      })
      } finally {
        setProcessingRequestId(null)
        setIsDeleteDialogOpen(false)
        setDeletingRequestId(null)
      }
    }

  // 削除処理（承認済み・却下用）
  const handleDeleteApprovedOrRejected = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId)
      const res = await fetch(`/api/vacation/requests/${requestId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": currentUser?.id || "",
        },
        body: JSON.stringify({ 
          employeeId: currentUser?.id,
          force: true, // 承認済み・却下の削除フラグ
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "削除に失敗しました")
      }

      toast({
        title: "削除完了",
        description: "有給申請を削除しました。承認済みの場合は消化された有給が戻りました。",
      })

      // データを再読み込み
      window.dispatchEvent(new Event('vacation-request-updated'))
      if (userRole === "employee" && employeeId) {
        const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
        if (res.ok) {
          const json = await res.json()
          setEmployeeRequests(json.requests || [])
        }
      }
    } catch (error: any) {
      console.error("削除エラー:", error)
      toast({
        title: "削除エラー",
        description: error?.message || "削除に失敗しました",
        variant: "destructive",
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  const needsFiveDayAlert = (latestGrantDays: number | undefined, used: number) => {
    // 最新の付与日での付与日数が設定値（minGrantDaysForAlert）以上で、
    // かつ取得済みが法定最低取得日数（minLegalUseDaysPerYear）未満の場合にアラート表示
    // latestGrantDaysが未定義の場合は、後方互換性のため総付与数（granted）を使用
    if (latestGrantDays !== undefined) {
      return latestGrantDays >= minGrantDaysForAlert && used < minLegalUseDaysPerYear
    }
    // 後方互換性: latestGrantDaysが未定義の場合は、grantedを使用（既存のロジック）
    return false // latestGrantDaysがない場合はアラートを表示しない（安全のため）
  }

  // 次の付与日までの期間を計算して、アラートの色を決定
  const getAlertColor = (nextGrantDate: string | null | undefined) => {
    if (!nextGrantDate) {
      // 次の付与日が設定されていない場合は黄色（安全のため）
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: 'text-yellow-600 dark:text-yellow-400',
      }
    }

    const today = new Date()
    const nextGrant = new Date(nextGrantDate)
    const diffMs = nextGrant.getTime() - today.getTime()
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30) // 簡易計算: 30日=1ヶ月

    // 3ヶ月未満の場合は赤色、それ以上は黄色
    if (diffMonths < 3) {
      return {
        border: 'border-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-800 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-400',
      }
    } else {
      return {
        border: 'border-[#f4b907]',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: 'text-[#f4b907] dark:text-yellow-400',
      }
    }
  }

  // 期間フィルター判定関数
  const isRequestInPeriod = (request: any, period: "all" | "current" | "last" | "twoYearsAgo" | "next"): boolean => {
    if (period === "all") return true
    if (!periodData) return true // 期間データが取得できない場合はすべて表示
    
    const periodInfo = period === "current" ? periodData.current : 
                      period === "last" ? periodData.last : 
                      period === "twoYearsAgo" ? periodData.twoYearsAgo : 
                      period === "next" ? periodData.next : null
    
    if (!periodInfo) return false
    
    const requestStart = new Date(request.startDate)
    const requestEnd = new Date(request.endDate)
    const periodStart = new Date(periodInfo.startDate)
    // 来期の場合、終了日がnullの場合は非常に遠い未来日を設定
    const periodEnd = periodInfo.endDate ? new Date(periodInfo.endDate) : 
                      period === "next" ? new Date('2099-12-31') : new Date()
    
    // 申請の開始日または終了日が期間内にあるかを判定
    return (requestStart >= periodStart && requestStart <= periodEnd) ||
           (requestEnd >= periodStart && requestEnd <= periodEnd) ||
           (requestStart <= periodStart && requestEnd >= periodEnd) // 期間をまたぐ申請も含む
  }

  // 社員用申請一覧のフィルタリングとソート
  const filteredAndSortedEmployeeRequests = employeeRequests
    .filter((req: any) => {
      // ステータスフィルター
      if (statusFilter !== "all" && req.status?.toLowerCase() !== statusFilter) {
        return false
      }
      
      // 期間フィルター
      if (!isRequestInPeriod(req, periodFilter)) {
        return false
      }
      
      return true
    })
    .sort((a: any, b: any) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          const dateA = new Date(a.startDate || a.createdAt || 0).getTime()
          const dateB = new Date(b.startDate || b.createdAt || 0).getTime()
          comparison = dateA - dateB
          break
        case "status":
          const statusOrder = { pending: 1, approved: 2, rejected: 3, cancelled: 4 }
          comparison = (statusOrder[a.status?.toLowerCase() as keyof typeof statusOrder] || 99) - 
                       (statusOrder[b.status?.toLowerCase() as keyof typeof statusOrder] || 99)
          break
        case "days":
          comparison = (a.days || 0) - (b.days || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  // 管理者画面でのフィルタリング
  const filteredAdminEmployees = userRole === "admin" && filters ? adminEmployees.filter((emp: any) => {
    // 検索クエリフィルター
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      // department, position, organizationは文字列またはJSON文字列の可能性があるため、パースして処理
      const parseJsonArray = (value: string | null | undefined): string[] => {
        if (!value) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          return [value]
        }
      }
      
      const departments = parseJsonArray(emp.department)
      const positions = parseJsonArray(emp.position)
      const organizations = parseJsonArray(emp.organization)
      
      const searchableText = [
        emp.name,
        emp.employeeNumber || emp.id,
        ...departments,
        ...positions,
        ...organizations,
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) {
        return false
      }
    }
    
    // 雇用形態フィルター
    if (filters.employeeType !== "all" && emp.employeeType !== filters.employeeType) {
      return false
    }
    
    // 部署フィルター
    if (filters.department !== "all") {
      const parseJsonArray = (value: string | null | undefined): string[] => {
        if (!value) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          return [value]
        }
      }
      const departments = parseJsonArray(emp.department)
      if (!departments.includes(filters.department)) {
        return false
      }
    }
    
    // 役職フィルター
    if (filters.position !== "all") {
      const parseJsonArray = (value: string | null | undefined): string[] => {
        if (!value) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          return [value]
        }
      }
      const positions = parseJsonArray(emp.position)
      if (!positions.includes(filters.position)) {
        return false
      }
    }
    
    // ステータスフィルター（社員のステータスでフィルタリング）
    if (filters.status !== "all") {
      // employeeStatusが存在する場合はそれを使用、なければstatusを使用（後方互換性のため）
      const employeeStatus = emp.employeeStatus || emp.status
      if (employeeStatus !== filters.status) {
        return false
      }
    }
    
    // 組織図表示フィルター
    if (filters.showInOrgChart !== "all") {
      const shouldShow = filters.showInOrgChart === "1"
      if (emp.showInOrgChart !== shouldShow) {
        return false
      }
    }
    
    return true
  }) : adminEmployees

  const adminVisible = userRole === "admin" ? (filter === "pending" ? filteredAdminEmployees.filter((e: any) => {
    // 承認待ち画面では、各申請ごとにカードが生成されるので、requestIdが存在するか、またはpending > 0で判断
    // 承認後はpendingが0になるが、決済待ち（approved + approvedBy != null + finalizedBy == null）の場合はカードを表示
    const hasRequest = e.requestId != null && e.requestId !== ""
    const isPending = (e.pending ?? 0) > 0
    const isPendingFinalization = e.status === 'approved' && e.approvedBy != null && e.approvedBy !== "" && (!e.finalizedBy || e.finalizedBy === "")
    return hasRequest && (isPending || isPendingFinalization)
  }) : filteredAdminEmployees) : []
  
  // 承認待ちの申請カード数を計算（管理者画面のみ）
  // 承認待ち画面に実際に表示されているカード数を計算
  useEffect(() => {
    if (userRole === "admin" && onPendingCountChange) {
      // 承認待ち画面では、各申請ごとにカードが生成される
      // 実際に表示されるカード数は adminVisible の長さ（承認待ち画面の場合）
      // 全社員画面にいる場合でも、承認待ちの申請カード数を別途取得する必要がある
      if (filter === "pending") {
        // 承認待ち画面では、各申請ごとにカードが生成される
        const pendingCardCount = adminVisible.length
        onPendingCountChange(pendingCardCount)
      } else {
        // 全社員画面にいる場合、承認待ちの申請カード数を別途取得する
        fetch(`/api/vacation/admin/applicants?view=pending`)
          .then((res) => {
            if (res.ok) {
              return res.json()
            }
            throw new Error('API呼び出しに失敗しました')
          })
          .then((json) => {
            // 承認待ち画面では各申請ごとにカードが生成されるため、レスポンスのカード数が承認待ちの申請カード数
            const pendingCardCount = json.employees?.length || 0
            onPendingCountChange(pendingCardCount)
          })
          .catch((error) => {
            console.error('[有給管理] 承認待ちカード数取得エラー:', error)
            // エラー時は0を設定
            onPendingCountChange(0)
          })
      }
    }
  }, [adminVisible, userRole, onPendingCountChange, filter])
  
  // デバッグ用ログ（開発環境のみ）
  if (userRole === "admin" && typeof window !== "undefined") {
    console.log(`[有給管理] 表示データ: adminEmployees=${adminEmployees.length}, filteredAdminEmployees=${filteredAdminEmployees.length}, adminVisible=${adminVisible.length}, filter=${filter}`)
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2`} style={{ backgroundColor: '#b4d5e7' }}>
      {loading && userRole === "admin" && (
        <Card className="col-span-full">
          <CardContent className="py-6 text-center text-muted-foreground">読み込み中...</CardContent>
        </Card>
      )}
      {userRole === "employee" && employeeRequests.length > 0 && (
        <div className="col-span-full flex gap-2 items-center mb-2">
          {/* 期間フィルター */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">全期間</option>
            <option value="next">来期</option>
            <option value="current">今期</option>
            <option value="last">昨年</option>
            <option value="twoYearsAgo">一昨年</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">全て</option>
            <option value="pending">承認待ち</option>
            <option value="approved">承認済み</option>
            <option value="rejected">却下</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="date">日付順</option>
            <option value="status">ステータス順</option>
            <option value="days">日数順</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="text-sm border rounded px-2 py-1"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      )}
      {(userRole === "admin" ? adminVisible : filteredAndSortedEmployeeRequests).map((request: any) => {
        // 管理者画面: 申請中カードの背景色を#dbeafeにする（承認待ち画面・全社員画面ともに）
        const hasPendingRequest = userRole === "admin" && (request.pending ?? 0) > 0
        const adminPendingBackground = hasPendingRequest ? "#dbeafe" : undefined
        
        // 社員画面: 状態に応じて背景色を設定
        let employeeCardBackground: string | undefined = undefined
        if (userRole === "employee") {
          const status = request.status?.toLowerCase()
          const endDate = request.endDate ? new Date(request.endDate) : null
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // 決済待ち（approved + approvedBy != null + finalizedBy == null）
          const isPendingFinalization = status === "approved" && 
            request.approvedBy != null && 
            request.approvedBy !== "" && 
            (!request.finalizedBy || request.finalizedBy === "")
          
          if (status === "pending") {
            // 申請中の場合
            employeeCardBackground = "#dbeafe"
          } else if (isPendingFinalization) {
            // 決済待ちの場合
            employeeCardBackground = "#fef3c7" // 黄色系の背景
          } else if (status === "approved" && endDate && endDate < today) {
            // 消化(日付が過ぎる)された場合
            employeeCardBackground = "#f1f5f9"
          } else if (status === "rejected") {
            // 却下された場合
            employeeCardBackground = "#e3e4e5"
          }
          // それ以外（承認中で日付が到来していない）は現状のまま（undefined）
        }
        
        const cardBackgroundColor = adminPendingBackground || employeeCardBackground
        
        // カードクリックでナビゲーション可能なのは「総務・管理者」のみ
        const canClickCard = (currentUser?.role === 'hr' || currentUser?.role === 'admin') && onEmployeeClick
        
        return (
        <Card
          key={request.id}
          className={`flex flex-col min-h-[92px] p-0 ${canClickCard ? 'cursor-pointer' : ''}`}
          style={cardBackgroundColor ? { backgroundColor: cardBackgroundColor } : undefined}
          onClick={(e) => {
            // ダイアログやSelect内のクリックは無視
            if ((e.target as HTMLElement).closest('[role="dialog"]') || 
                (e.target as HTMLElement).closest('[role="listbox"]') ||
                (e.target as HTMLElement).closest('button') ||
                (e.target as HTMLElement).closest('input')) {
              return
            }
            // 「総務・管理者」のみカードクリックでナビゲーション可能
            if (canClickCard) {
              // 「承認待ち」画面では employeeId が存在するのでそれを使用、「全社員」画面では id を使用
              const targetEmployeeId = request.employeeId || request.id
              onEmployeeClick(String(targetEmployeeId), request.employee || request.name)
            }
          }}
        >
          <CardContent className="py-2 px-2 flex-1 flex flex-col justify-between">
            {userRole === "admin" ? (
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      {(() => {
                        const targetEmployeeId = String(request.employeeId || request.id)
                        const avatarText = typeof window !== 'undefined' 
                          ? localStorage.getItem(`employee-avatar-text-${targetEmployeeId}`) || (request.employee || request.name || '未').slice(0, 3)
                          : (request.employee || request.name || '未').slice(0, 3)
                        return (
                          <>
                            {request.avatar && (
                              <AvatarImage src={request.avatar} alt={request.employee || request.name} />
                            )}
                            <AvatarFallback 
                              employeeType={request.employeeType}
                              className={`font-semibold whitespace-nowrap overflow-hidden ${
                                /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
                              }`}
                            >
                              {avatarText.slice(0, 3)}
                            </AvatarFallback>
                          </>
                        )
                      })()}
                    </Avatar>
                    <div className="font-semibold text-sm text-foreground">{request.employee || request.name}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">入社日: {(request.hireDate || (request.joinDate ? String(request.joinDate).slice(0,10).replaceAll('-', '/') : '不明'))}</div>
                  {userRole === "admin" && (
                    <VacationPatternSelector
                      employeeId={String(request.employeeId || request.id)}
                      employeeType={request.employeeType || null}
                      currentPattern={request.vacationPattern || null}
                      currentWeeklyPattern={request.weeklyPattern || null}
                      employeeName={request.employee || request.name}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">残り</div>
                    <div className="text-base font-bold text-foreground">{request.remaining ?? 0}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">取得済</div>
                    <div className="text-base font-bold text-chart-2">{request.used ?? 0}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">申請中</div>
                    <div className="text-base font-bold text-chart-3">{request.pending ?? 0}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">総付与数</div>
                    <div className="text-base font-bold text-muted-foreground">{request.granted ?? 0}日</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-muted/50 p-1.5 space-y-1">
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">次回付与日</div>
                      <div className="text-[10px] font-semibold text-foreground leading-tight">{request.nextGrantDate ? request.nextGrantDate.replaceAll('-', '/') : '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">付与予定日数</div>
                      <div className="text-base font-bold text-chart-1">{request.nextGrantDays ?? '-'}{request.nextGrantDays ? '日' : ''}</div>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div className="leading-tight">
                        <div className="text-[9px]">{request.startDate || '-'}</div>
                        <div className="text-[9px]">〜 {request.endDate || '-'}</div>
                        {request.days && <div className="text-foreground font-medium text-[10px]">({request.days}日間)</div>}
                      </div>
                    </div>
                    {request.reason && (
                      <div className="text-[9px] text-muted-foreground break-words whitespace-pre-wrap mt-1">
                        理由: {request.reason}
                      </div>
                    )}
                  </div>
                </div>

                {needsFiveDayAlert(request.latestGrantDays, request.used ?? 0) && (() => {
                  const alertColors = getAlertColor(request.nextGrantDate)
                  return (
                    <Alert variant="destructive" className={`${alertColors.border} ${alertColors.bg} py-1.5`}>
                      <AlertTriangle className={`h-3 w-3 ${alertColors.icon}`} />
                      <AlertDescription className={`text-[10px] ${alertColors.text} leading-tight`}>
                        5日消化義務未達成
                      </AlertDescription>
                    </Alert>
                  )
                })()}

                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex items-center justify-between">
                    {request.status && getStatusBadge(request.status, request.approvedBy, request.finalizedBy)}
                    {/* 管理者画面：申請中・決済待ちの編集ボタン */}
                    {currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr') && (
                      <div className="flex gap-1">
                        {(request.status?.toLowerCase() === "pending" || (request.status?.toLowerCase() === "approved" && !request.finalizedBy)) && request.requestId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('[VacationList] 編集ボタンクリック:', {
                                requestId: request.requestId,
                                employeeId: request.employeeId || request.id,
                                status: request.status,
                              })
                              // 申請データを構築
                              const editRequest = {
                                id: request.requestId,
                                employeeId: request.employeeId || request.id,
                                startDate: request.startDate,
                                endDate: request.endDate,
                                reason: request.reason,
                                status: request.status,
                                totalDays: request.days || request.totalDays,
                                unit: request.unit || 'DAY',
                                hoursPerDay: request.hoursPerDay || 8,
                                supervisorId: request.supervisorId || '',
                              }
                              console.log('[VacationList] 編集データ:', editRequest)
                              handleEdit(editRequest)
                            }}
                            title="申請の更新"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {(() => {
                    // 承認待ち（pending）の場合
                    const isPending = request.status?.toLowerCase() === "pending"
                    const isSelectedSupervisor = request.supervisorId === currentUser?.id
                    const isHrOrAdmin = currentUser?.role === 'hr' || currentUser?.role === 'admin'
                    // 選択された上司 または 総務・管理者の場合は承認できる
                    const canApprove = isPending && (isSelectedSupervisor || isHrOrAdmin) && request.requestId

                    // 決済待ち（approved + approvedBy != null + finalizedBy == null）かつ総務・管理者の場合
                    const isApproved = request.status?.toLowerCase() === "approved"
                    const hasApprovedBy = request.approvedBy != null && request.approvedBy !== ""
                    const hasNoFinalizedBy = !request.finalizedBy || request.finalizedBy === ""
                    const isPendingFinalization = isApproved && hasApprovedBy && hasNoFinalizedBy
                    const canFinalize = isPendingFinalization && isHrOrAdmin && request.requestId

                    if (canApprove) {
                      // 上司または総務・管理者が承認する場合
                      return (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 h-7 text-[11px]"
                            disabled={processingRequestId === request.requestId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(request.requestId)
                            }}
                          >
                            {processingRequestId === request.requestId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "承認"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-[11px] bg-transparent"
                            disabled={processingRequestId === request.requestId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(request.requestId)
                            }}
                          >
                            {processingRequestId === request.requestId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "却下"
                            )}
                          </Button>
                        </div>
                      )
                    } else if (canFinalize) {
                      // 総務・管理者が決済する場合
                      return (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 h-7 text-[11px]"
                            disabled={finalizingRequestId === request.requestId}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFinalizeClick(request.requestId, request)
                            }}
                          >
                            {finalizingRequestId === request.requestId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "決済"
                            )}
                          </Button>
                        </div>
                      )
                    } else if (isPendingFinalization) {
                      // 決済待ち状態（決済権限がない場合）
                      return (
                        <div className="text-[10px] text-muted-foreground">
                          決済待ち
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 flex-1 text-xs">
                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {typeof request.startDate === 'string' 
                      ? request.startDate.replaceAll('-', '/')
                      : request.startDate}〜
                    {typeof request.endDate === 'string'
                      ? request.endDate.replaceAll('-', '/')
                      : request.endDate}
                  </span>
                </div>
                <div className="text-[11px] text-foreground font-semibold">
                  日数: {(() => {
                    // 日数を計算（totalDaysがない場合は期間から計算）
                    if (request.days || request.totalDays) {
                      return `${(request.days || request.totalDays || 0).toFixed(1)}日`
                    }
                    // 期間から計算
                    const start = new Date(request.startDate)
                    const end = new Date(request.endDate)
                    const diffMs = end.getTime() - start.getTime()
                    const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
                    return `${calculatedDays.toFixed(1)}日`
                  })()}
                </div>
                <div className="text-[11px] text-muted-foreground break-words whitespace-pre-wrap">
                  理由: {request.reason || "-"}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(request.status || "pending", request.approvedBy, request.finalizedBy)}
                  {request.status?.toLowerCase() === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(request)
                        }}
                        title="修正"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingRequestId(request.id)
                          setIsDeleteDialogOpen(true)
                        }}
                        disabled={processingRequestId === request.id}
                        title="削除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {/* 総務・管理者権限のみ表示: 承認済み・却下のカードに編集・削除アイコン */}
                  {userRole === "employee" && currentUser && (() => {
                    const userPermissions = getPermissions(currentUser.role as any)
                    const canEditOrDelete = userPermissions.editLeaveManagement || currentUser.role === "admin" || currentUser.role === "hr"
                    const status = request.status?.toLowerCase()
                    const isApprovedOrRejected = status === "approved" || status === "rejected"
                    
                    if (canEditOrDelete && isApprovedOrRejected) {
                      const isApproved = status === "approved"
                      const isRejected = status === "rejected"
                      
                      return (
                        <div className="flex gap-1">
                          {/* 承認済みの申請のみ編集アイコンを表示 */}
                          {isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPasswordDialogAction('edit')
                                setPasswordDialogRequestId(request.id)
                                setPasswordDialogEditingRequest(request)
                                setIsPasswordDialogOpen(true)
                              }}
                              title="編集"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {/* 削除アイコンは承認済み・却下両方に表示 */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPasswordDialogAction('delete')
                              setPasswordDialogRequestId(request.id)
                              setIsPasswordDialogOpen(true)
                            }}
                            disabled={processingRequestId === request.id}
                            title="削除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
                {/* 却下された申請の場合、説明テキストを表示 */}
                {request.status?.toLowerCase() === "rejected" && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    残り有給日数は減少しません
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )
      })}
      
      {/* 修正ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申請を修正</DialogTitle>
            <DialogDescription>申請内容を修正してください</DialogDescription>
          </DialogHeader>
          {editingRequest && (
            <VacationRequestForm
              initialData={{
                startDate: typeof editingRequest.startDate === 'string' 
                  ? editingRequest.startDate 
                  : editingRequest.startDate.toISOString().slice(0, 10),
                endDate: typeof editingRequest.endDate === 'string'
                  ? editingRequest.endDate
                  : editingRequest.endDate.toISOString().slice(0, 10),
                reason: editingRequest.reason || "",
                unit: editingRequest.unit || "DAY",
                usedDays: editingRequest.days || editingRequest.totalDays || 1,
                hoursPerDay: editingRequest.hoursPerDay || 8,
                hours: editingRequest.unit === "HOUR" ? (editingRequest.days || editingRequest.totalDays || 8) : 8,
                supervisorId: editingRequest.supervisorId || "", // 上司IDを初期データに含める
              } as any}
              requestId={editingRequest.id}
              proxyEmployeeId={editingRequest.employeeId} // 編集対象の社員ID
              force={editingRequest.status?.toLowerCase() === "approved" || editingRequest.status?.toLowerCase() === "rejected"}
              onSuccess={async () => {
                console.log('[VacationList] 申請更新成功 - onSuccessコールバック実行')
                
                // ダイアログを閉じる
                setIsEditDialogOpen(false)
                setEditingRequest(null)
                
                // データを再読み込み
                window.dispatchEvent(new Event('vacation-request-updated'))
                
                if (userRole === "employee" && employeeId) {
                  // 社員画面の場合
                  console.log('[VacationList] 社員画面データを再読み込み中...')
                  try {
                    const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
                    if (res.ok) {
                      const json = await res.json()
                      setEmployeeRequests(json.requests || [])
                      console.log('[VacationList] 申請一覧を再読み込み:', json.requests.length, '件')
                    }
                  } catch (error) {
                    console.error('[VacationList] 申請一覧再読み込みエラー:', error)
                  }
                } else if (userRole === "admin") {
                  // 管理者画面の場合
                  console.log('[VacationList] 管理者画面データを再読み込み中...')
                  try {
                    const currentView = filter === "pending" ? "pending" : "all"
                    const url = supervisorId 
                      ? `/api/vacation/admin/applicants?view=${currentView}&supervisorId=${supervisorId}`
                      : `/api/vacation/admin/applicants?view=${currentView}`
                    console.log('[VacationList] 再読み込みURL:', url)
                    const res = await fetch(url)
                    if (res.ok) {
                      const json = await res.json()
                      setAdminEmployees(json.employees || [])
                      console.log('[VacationList] 管理者画面データを再読み込み完了:', json.employees?.length || 0, '件')
                    } else {
                      console.error('[VacationList] 管理者画面データ再読み込み失敗:', res.status)
                    }
                  } catch (error) {
                    console.error('[VacationList] 管理者画面データ再読み込みエラー:', error)
                  }
                }
                
                console.log('[VacationList] onSuccessコールバック完了')
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請を削除</DialogTitle>
            <DialogDescription>
              この申請を削除しますか？削除すると申請中の日数が残り有給日数に戻ります。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingRequestId(null)
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingRequestId) {
                  handleDelete(deletingRequestId)
                }
              }}
              disabled={processingRequestId === deletingRequestId}
            >
              {processingRequestId === deletingRequestId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* パスワード確認ダイアログ（承認済み・却下の編集・削除用） */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワード確認</DialogTitle>
            <DialogDescription>
              承認済み・却下の申請を{passwordDialogAction === 'edit' ? '編集' : '削除'}するにはパスワードが必要です。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError("")
                }}
                placeholder="パスワードを入力"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false)
                setPassword("")
                setPasswordError("")
                setPasswordDialogAction(null)
                setPasswordDialogRequestId(null)
                setPasswordDialogEditingRequest(null)
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={async () => {
                if (!currentUser?.id || !password) {
                  setPasswordError("パスワードを入力してください")
                  return
                }
                try {
                  const res = await fetch('/api/auth/verify-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId: currentUser.id, password: password }),
                  })
                  const result = await res.json()
                  if (!res.ok || !result.valid) {
                    setPasswordError("パスワードが正しくありません")
                    return
                  }
                  // パスワード確認成功
                  setIsPasswordDialogOpen(false)
                  setPassword("")
                  setPasswordError("")
                  
                  if (passwordDialogAction === 'edit') {
                    // 確認ダイアログを表示
                    if (confirm("本当に編集しますか？編集すると承認済みの場合は消化された有給が戻り、新しい申請として再処理されます。")) {
                      setEditingRequest(passwordDialogEditingRequest)
                      setIsEditDialogOpen(true)
                    }
                  } else if (passwordDialogAction === 'delete') {
                    // 確認ダイアログを表示
                    if (confirm("本当に削除しますか？")) {
                      if (passwordDialogRequestId) {
                        await handleDeleteApprovedOrRejected(passwordDialogRequestId)
                      }
                    }
                  }
                  
                  setPasswordDialogAction(null)
                  setPasswordDialogRequestId(null)
                  setPasswordDialogEditingRequest(null)
                } catch (error) {
                  console.error('パスワード検証エラー:', error)
                  setPasswordError("パスワード認証に失敗しました")
                }
              }}
            >
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 決済確認ダイアログ（フォールバック用、通常は使用されない） */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={(open) => {
        // 決済処理中はダイアログを閉じられないようにする
        if (!open && !isFinalizing) {
          setIsFinalizeDialogOpen(false)
          setFinalizingRequestId(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>決済確認</DialogTitle>
            <DialogDescription>
              このまま決済しますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleFinalizeCancel}
              disabled={isFinalizing}
            >
              いいえ
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (finalizingRequestId && !isFinalizing) {
                  handleFinalize(finalizingRequestId)
                }
              }}
              disabled={finalizingRequestId === null || isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  決済中...
                </>
              ) : (
                "はい"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 来期申請エラーダイアログ */}
      <Dialog open={isNextPeriodErrorDialogOpen} onOpenChange={setIsNextPeriodErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>決済できません</DialogTitle>
            <DialogDescription>
              {nextPeriodError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setIsNextPeriodErrorDialogOpen(false)
                setNextPeriodError(null)
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {(userRole === "admin" ? adminVisible.length === 0 : filteredAndSortedEmployeeRequests.length === 0) && !loading && (
        <Card className="col-span-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">データがありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
