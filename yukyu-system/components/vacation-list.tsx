"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Calendar, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VacationListProps {
  userRole: "employee" | "admin"
  filter: "pending" | "all"
  onEmployeeClick?: (employeeId: number, employeeName: string) => void
}

export function VacationList({ userRole, filter, onEmployeeClick }: VacationListProps) {
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

  const needsFiveDayAlert = (remaining: number, used: number, granted: number) => {
    return granted >= 10 && used < 5
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {filteredRequests.map((request) => (
        <Card
          key={request.id}
          className={`flex flex-col ${userRole === "admin" ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
          onClick={() => {
            if (userRole === "admin" && onEmployeeClick) {
              onEmployeeClick(request.id, request.employee)
            }
          }}
        >
          <CardContent className="pt-4 pb-4 px-4 flex-1 flex flex-col">
            {userRole === "admin" ? (
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-foreground">{request.employee}</div>
                  <div className="text-[10px] text-muted-foreground">入社日: {request.hireDate}</div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">残り</div>
                    <div className="text-base font-bold text-foreground">{request.remaining}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">取得済</div>
                    <div className="text-base font-bold text-chart-2">{request.used}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">申請中</div>
                    <div className="text-base font-bold text-chart-3">{request.pending}日</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="text-[9px] text-muted-foreground mb-0.5">総付与数</div>
                    <div className="text-base font-bold text-muted-foreground">{request.granted}日</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-muted/50 p-1.5 space-y-1">
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">次回付与日</div>
                      <div className="text-[10px] font-semibold text-foreground leading-tight">
                        {request.nextGrantDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">付与日数</div>
                      <div className="text-base font-bold text-chart-1">{request.nextGrantDays}日</div>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/50 p-1.5">
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div className="leading-tight">
                        <div className="text-[9px]">{request.startDate}</div>
                        <div className="text-[9px]">〜 {request.endDate}</div>
                        <div className="text-foreground font-medium text-[10px]">({request.days}日間)</div>
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground line-clamp-2 mt-1">理由: {request.reason}</div>
                  </div>
                </div>

                {needsFiveDayAlert(request.remaining, request.used, request.granted) && (
                  <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 py-1.5">
                    <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    <AlertDescription className="text-[10px] text-orange-800 dark:text-orange-300 leading-tight">
                      5日消化義務未達成
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5 mt-auto">
                  {getStatusBadge(request.status)}
                  {request.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-7 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        承認
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[11px] bg-transparent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        却下
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {request.startDate} 〜 {request.endDate}
                    </span>
                    <span className="text-foreground font-medium">({request.days}日間)</span>
                  </div>
                  <div className="text-sm text-muted-foreground">理由: {request.reason}</div>
                </div>

                <div className="flex items-center justify-center mt-auto">{getStatusBadge(request.status)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {filteredRequests.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">申請がありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
