import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

interface VacationStatsProps {
  userRole: "employee" | "admin"
  employeeId?: string
}

export function VacationStats({ userRole, employeeId }: VacationStatsProps) {
  const [statsData, setStatsData] = useState<{
    totalRemaining: number
    used: number
    pending: number
    totalGranted: number
    joinDate?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!employeeId || userRole !== "employee") return
      setLoading(true)
      try {
        const res = await fetch(`/api/vacation/stats/${employeeId}`)
        if (res.ok) {
          const json = await res.json()
          setStatsData({
            totalRemaining: json.totalRemaining ?? 0,
            used: json.used ?? 0,
            pending: json.pending ?? 0,
            totalGranted: json.totalGranted ?? 0,
            joinDate: json.joinDate,
          })
        } else {
          setStatsData({ totalRemaining: 0, used: 0, pending: 0, totalGranted: 0 })
        }
      } finally {
        setLoading(false)
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
  }, [employeeId, userRole])

  const employeeStats: Array<{
    title: string
    value: string
    icon: any
    color: string
    subtitle?: string
  }> = [
    {
      title: "残り有給日数",
      value: loading ? "-" : (() => {
        // 総付与数 - 取得済み - 申請中 = 残り有給日数
        const totalGranted = statsData?.totalGranted ?? 0
        const used = statsData?.used ?? 0
        const pending = statsData?.pending ?? 0
        const calculated = Math.max(0, totalGranted - used - pending)
        return `${calculated.toFixed(1)}日`
      })(),
      icon: Calendar,
      color: "text-chart-1",
      subtitle: statsData?.totalGranted !== undefined && statsData?.used !== undefined && statsData?.pending !== undefined
        ? `総付与: ${statsData.totalGranted.toFixed(1)}日 - 取得済み: ${statsData.used.toFixed(1)}日 - 申請中: ${statsData.pending.toFixed(1)}日`
        : undefined,
    },
    {
      title: "取得済み",
      value: loading ? "-" : `${(statsData?.used ?? 0).toFixed(1)}日`,
      icon: CheckCircle,
      color: "text-chart-2",
      subtitle: statsData?.totalGranted ? `使用率: ${((statsData.used / statsData.totalGranted) * 100).toFixed(1)}%` : undefined,
    },
    {
      title: "申請中",
      value: loading ? "-" : `${(statsData?.pending ?? 0).toFixed(1)}日`,
      icon: Clock,
      color: "text-chart-3",
      subtitle: statsData?.totalRemaining !== undefined ? `承認後残り: ${(statsData.totalRemaining - (statsData.pending || 0)).toFixed(1)}日` : undefined,
    },
    {
      title: "総付与数",
      value: loading ? "-" : `${(statsData?.totalGranted ?? 0).toFixed(1)}日`,
      icon: Calendar,
      color: "text-chart-4",
      subtitle: statsData?.joinDate ? `入社: ${new Date(statsData.joinDate).toISOString().slice(0,10).replaceAll('-', '/')}` : undefined,
    },
  ]

  const [adminStatsData, setAdminStatsData] = useState<{
    pending: number
    approvedThisMonth: number
    rejected: number
    alerts: number
  } | null>(null)

  useEffect(() => {
    const loadAdminStats = async () => {
      if (userRole !== "admin") return
      setLoading(true)
      try {
        const res = await fetch("/api/vacation/admin/stats")
        if (res.ok) {
          const json = await res.json()
          setAdminStatsData({
            pending: json.pending ?? 0,
            approvedThisMonth: json.approvedThisMonth ?? 0,
            rejected: json.rejected ?? 0,
            alerts: json.alerts ?? 0,
          })
        } else {
          setAdminStatsData({ pending: 0, approvedThisMonth: 0, rejected: 0, alerts: 0 })
        }
      } catch (error) {
        console.error("管理者統計取得エラー:", error)
        setAdminStatsData({ pending: 0, approvedThisMonth: 0, rejected: 0, alerts: 0 })
      } finally {
        setLoading(false)
      }
    }
    loadAdminStats()
  }, [userRole])

  const adminStats: Array<{
    title: string
    value: string
    icon: any
    color: string
    subtitle?: string
  }> = [
    {
      title: "承認待ち",
      value: loading ? "-" : `${adminStatsData?.pending ?? 0}件`,
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "今月承認済み",
      value: loading ? "-" : `${adminStatsData?.approvedThisMonth ?? 0}件`,
      icon: CheckCircle,
      color: "text-chart-2",
    },
    {
      title: "却下",
      value: loading ? "-" : `${adminStatsData?.rejected ?? 0}件`,
      icon: XCircle,
      color: "text-destructive",
    },
    {
      title: "アラート数",
      value: loading ? "-" : `${adminStatsData?.alerts ?? 0}名`,
      icon: AlertTriangle,
      color: "text-orange-500",
    },
  ]

  const stats = userRole === "employee" ? employeeStats : adminStats

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {userRole === "employee" && (
        <div className="md:col-span-2 lg:col-span-4 -mb-2 text-sm text-muted-foreground">
          {statsData?.joinDate && (
            <span>入社日: {new Date(statsData.joinDate).toISOString().slice(0,10).replaceAll('-', '/')}</span>
          )}
        </div>
      )}
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            {stat.subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{stat.subtitle}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
