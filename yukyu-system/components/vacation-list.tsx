"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Calendar, AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { VacationPatternSelector } from "./vacation-pattern-selector"
import { useToast } from "@/hooks/use-toast"

interface VacationListProps {
  userRole: "employee" | "admin"
  filter: "pending" | "all"
  onEmployeeClick?: (employeeId: string, employeeName: string) => void
  employeeId?: string // 表示する社員ID（社員モードで使用）
}

export function VacationList({ userRole, filter, onEmployeeClick, employeeId }: VacationListProps) {
  const { toast } = useToast()
  // 管理者用: APIから全社員の有給統計を取得
  const [adminEmployees, setAdminEmployees] = useState<
    { id: string; name: string; joinDate?: string; remaining: number; used: number; pending: number; granted: number; requestId?: string }[]
  >([])
  // 社員用: APIから申請一覧を取得
  const [employeeRequests, setEmployeeRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "status" | "days">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => {
    const load = async () => {
      if (userRole === "admin") {
        setLoading(true)
        try {
          const res = await fetch("/api/vacation/admin/applicants")
          if (res.ok) {
            const json = await res.json()
            setAdminEmployees(json.employees || [])
          } else {
            setAdminEmployees([])
          }
        } finally {
          setLoading(false)
        }
      } else if (userRole === "employee" && employeeId) {
        // 社員モードの場合、特定社員の申請一覧を取得
        setLoading(true)
        try {
          const res = await fetch(`/api/vacation/requests?employeeId=${employeeId}`)
          if (res.ok) {
            const json = await res.json()
            setEmployeeRequests(json.requests || [])
          } else {
            setEmployeeRequests([])
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
  }, [userRole, employeeId])
  const mockRequests = [
    {
      id: 1,
      employee: "山田太郎",
      hireDate: "2020/04/01",
      startDate: "2025-11-01",
      endDate: "2025-11-03",
      days: 3,
      reason: "家族旅行",
      status: "pending",
      remaining: 8,
      used: 7,
      pending: 3,
      granted: 18,
      nextGrantDate: "2026/04/01",
      nextGrantDays: 20,
    },
    {
      id: 2,
      employee: "佐藤花子",
      hireDate: "2018/07/15",
      startDate: "2025-11-10",
      endDate: "2025-11-12",
      days: 3,
      reason: "私用",
      status: "pending",
      remaining: 3,
      used: 12,
      pending: 3,
      granted: 18,
      nextGrantDate: "2026/07/15",
      nextGrantDays: 20,
    },
    {
      id: 3,
      employee: "鈴木一郎",
      hireDate: "2015/10/01",
      startDate: "2025-10-20",
      endDate: "2025-10-22",
      days: 3,
      reason: "通院",
      status: "approved",
      remaining: 10,
      used: 5,
      pending: 0,
      granted: 15,
      nextGrantDate: "2026/10/01",
      nextGrantDays: 20,
    },
    {
      id: 4,
      employee: "田中美咲",
      hireDate: "2022/01/10",
      startDate: "2025-10-15",
      endDate: "2025-10-15",
      days: 1,
      reason: "私用",
      status: "rejected",
      remaining: 14,
      used: 4,
      pending: 0,
      granted: 18,
      nextGrantDate: "2026/01/10",
      nextGrantDays: 18,
    },
  ]

  const filteredRequests = filter === "pending" ? mockRequests.filter((req) => req.status === "pending") : mockRequests

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      const current = (window as any).CURRENT_USER as { id?: string } | undefined
      const approverId = current?.id

      const res = await fetch(`/api/vacation/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverId }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || "承認に失敗しました")
      }

      toast({
        title: "承認完了",
        description: "有給申請を承認しました",
      })

      // データを再読み込み
      if (userRole === "admin") {
        const res = await fetch("/api/vacation/admin/applicants")
        if (res.ok) {
          const json = await res.json()
          setAdminEmployees(json.employees || [])
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

  // 却下処理
  const handleReject = async (requestId: string) => {
    const reason = prompt("却下理由を入力してください（省略可）:")
    if (reason === null) {
      // キャンセルされた場合
      return
    }

    try {
      setProcessingRequestId(requestId)
      const current = (window as any).CURRENT_USER as { id?: string } | undefined
      const approverId = current?.id

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
        description: "有給申請を却下しました",
      })

      // データを再読み込み
      if (userRole === "admin") {
        const res = await fetch("/api/vacation/admin/applicants")
        if (res.ok) {
          const json = await res.json()
          setAdminEmployees(json.employees || [])
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

  const needsFiveDayAlert = (remaining: number, used: number, granted: number) => {
    return granted >= 10 && used < 5
  }

  // 社員用申請一覧のフィルタリングとソート
  const filteredAndSortedEmployeeRequests = employeeRequests
    .filter((req: any) => {
      if (statusFilter === "all") return true
      return req.status?.toLowerCase() === statusFilter
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

  const adminVisible = userRole === "admin" ? (filter === "pending" ? adminEmployees.filter(e => (e.pending ?? 0) > 0) : adminEmployees) : []

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2`}>
      {loading && userRole === "admin" && (
        <Card className="col-span-full">
          <CardContent className="py-6 text-center text-muted-foreground">読み込み中...</CardContent>
        </Card>
      )}
      {userRole === "employee" && employeeRequests.length > 0 && (
        <div className="col-span-full flex gap-2 items-center mb-2">
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
      {(userRole === "admin" ? adminVisible : (filteredAndSortedEmployeeRequests.length > 0 ? filteredAndSortedEmployeeRequests : filteredRequests)).map((request: any) => (
        <Card
          key={request.id}
          className="flex flex-col min-h-[92px] p-0 cursor-pointer"
          onClick={() => {
            if (userRole === "admin" && onEmployeeClick) {
              onEmployeeClick(String(request.id), request.employee || request.name)
            }
          }}
        >
          <CardContent className="py-2 px-2 flex-1 flex flex-col justify-between">
            {userRole === "admin" ? (
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-foreground">{request.employee || request.name}</div>
                  <div className="text-[10px] text-muted-foreground">入社日: {(request.hireDate || (request.joinDate ? String(request.joinDate).slice(0,10).replaceAll('-', '/') : '不明'))}</div>
                  {userRole === "admin" && (
                    <VacationPatternSelector
                      employeeId={String(request.id)}
                      employeeType={request.employeeType || null}
                      currentPattern={request.vacationPattern || null}
                      currentWeeklyPattern={request.weeklyPattern || null}
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
                      <div className="text-[10px] font-semibold text-foreground leading-tight">{request.nextGrantDate || '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">付与日数</div>
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
                    {request.reason && <div className="text-[9px] text-muted-foreground line-clamp-2 mt-1">理由: {request.reason}</div>}
                  </div>
                </div>

                {needsFiveDayAlert(request.remaining ?? 0, request.used ?? 0, request.granted ?? 0) && (
                  <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 py-1.5">
                    <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    <AlertDescription className="text-[10px] text-orange-800 dark:text-orange-300 leading-tight">
                      5日消化義務未達成
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5 mt-auto">
                  {request.status && getStatusBadge(request.status)}
                  {request.status === "pending" && request.requestId && (
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
                  )}
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
                  日数: {`${request.days || 0}日`}
                </div>
                <div className="text-[11px] text-muted-foreground">理由: {request.reason || "-"}</div>
                <div className="mt-1">{getStatusBadge(request.status || "pending")}</div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {(userRole === "admin" ? adminVisible.length === 0 : (filteredAndSortedEmployeeRequests.length === 0 && filteredRequests.length === 0)) && !loading && (
        <Card className="col-span-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">データがありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
