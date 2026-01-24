import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface VacationStatsProps {
  userRole: "employee" | "admin"
  employeeId?: string
}

export function VacationStats({ userRole, employeeId }: VacationStatsProps) {
  const router = useRouter()
  const { currentUser } = useAuth()
  const canViewCalculationDetails = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  const [statsData, setStatsData] = useState<{
    totalRemaining: number
    used: number
    pending: number        // 全申請中日数（今期+来期）
    currentPending: number // 今期の申請中日数
    nextPending: number    // 来期の申請中日数
    totalGranted: number
    joinDate?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  // 管理者用: 社員リストダイアログ
  const [showEmployeeListDialog, setShowEmployeeListDialog] = useState(false)
  const [selectedStatType, setSelectedStatType] = useState<string | null>(null)
  const [employeeList, setEmployeeList] = useState<any[]>([])
  const [loadingEmployeeList, setLoadingEmployeeList] = useState(false)

  // 社員用: 総付与数の計算詳細ダイアログ
  const [showTotalGrantedDialog, setShowTotalGrantedDialog] = useState(false)
  const [grantCalculationDetails, setGrantCalculationDetails] = useState<any>(null)
  const [loadingGrantDetails, setLoadingGrantDetails] = useState(false)

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
            currentPending: json.currentPending ?? json.pending ?? 0, // フォールバック
            nextPending: json.nextPending ?? 0,
            totalGranted: json.totalGranted ?? 0,
            joinDate: json.joinDate,
          })
        } else {
          setStatsData({ totalRemaining: 0, used: 0, pending: 0, currentPending: 0, nextPending: 0, totalGranted: 0 })
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
        title: "今期の残り有給日数",
        value: loading ? "-" : (() => {
          // 総付与数 - 取得済み - 今期の申請中 = 今期の残り有給日数
          // ※来期の申請中は今期の残りから引かない
          const totalGranted = statsData?.totalGranted ?? 0
          const used = statsData?.used ?? 0
          const currentPending = statsData?.currentPending ?? 0
          const calculated = Math.max(0, totalGranted - used - currentPending)
          return `${calculated.toFixed(1)}日`
        })(),
        icon: Calendar,
        color: "text-chart-1",
        subtitle: statsData?.totalGranted !== undefined && statsData?.used !== undefined && statsData?.currentPending !== undefined
          ? `総付与: ${statsData.totalGranted.toFixed(1)}日 - 取得済み: ${statsData.used.toFixed(1)}日 - 今期申請中: ${statsData.currentPending.toFixed(1)}日`
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
        subtitle: (() => {
          if (statsData?.totalGranted === undefined || statsData?.used === undefined || statsData?.pending === undefined) {
            return undefined
          }
          const nextPending = statsData.nextPending ?? 0
          const currentPending = statsData.currentPending ?? 0
          if (nextPending > 0) {
            return `今期: ${currentPending.toFixed(1)}日 / 来期: ${nextPending.toFixed(1)}日`
          }
          return `承認後残り: ${Math.max(0, (statsData.totalGranted ?? 0) - (statsData.used ?? 0) - currentPending).toFixed(1)}日`
        })(),
      },
      {
        title: "総付与数",
        value: loading ? "-" : `${(statsData?.totalGranted ?? 0).toFixed(1)}日`,
        icon: Calendar,
        color: "text-chart-4",
        subtitle: statsData?.joinDate ? `入社: ${new Date(statsData.joinDate).toISOString().slice(0, 10).replaceAll('-', '/')}` : undefined,
      },
    ]

  const [adminStatsData, setAdminStatsData] = useState<{
    pending: number
    approvedThisMonth: number
    rejected: number
    alerts: number
    alertEmployees?: Array<{
      id: string
      name: string
      department: string | null
      employeeNumber: string | null
      latestGrantDays: number
      used: number
      nextGrantDate: string | null
    }>
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
            alertEmployees: json.alertEmployees ?? [],
          })
        } else {
          setAdminStatsData({ pending: 0, approvedThisMonth: 0, rejected: 0, alerts: 0, alertEmployees: [] })
        }
      } catch (error) {
        console.error("管理者統計取得エラー:", error)
        setAdminStatsData({ pending: 0, approvedThisMonth: 0, rejected: 0, alerts: 0, alertEmployees: [] })
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

  // 管理者用: 統計カードクリック時の処理
  const handleStatCardClick = async (statType: string) => {
    if (userRole !== "admin") return

    setSelectedStatType(statType)
    setShowEmployeeListDialog(true)
    setLoadingEmployeeList(true)

    try {
      // アラートの場合は、stats APIから取得済みのリストを使用（計算ロジックの統一）
      if (statType === "alerts") {
        setEmployeeList(adminStatsData?.alertEmployees || [])
        setLoadingEmployeeList(false)
        return
      }

      let url = "/api/vacation/admin/applicants?view=pending"
      if (statType === "pending") {
        url = "/api/vacation/admin/applicants?view=pending&status=PENDING"
      } else if (statType === "approved") {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, "0")
        url = `/api/vacation/admin/applicants?status=APPROVED&month=${year}-${month}`
      } else if (statType === "rejected") {
        url = "/api/vacation/admin/applicants?status=REJECTED"
      }

      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setEmployeeList(json.employees || [])
      } else {
        setEmployeeList([])
      }
    } catch (error) {
      console.error("社員リスト取得エラー:", error)
      setEmployeeList([])
    } finally {
      setLoadingEmployeeList(false)
    }
  }

  // 社員用: 総付与数クリック時の処理
  const handleTotalGrantedClick = async () => {
    // 総務・管理者のみクリック可能
    if (!canViewCalculationDetails || userRole !== "employee" || !employeeId) return

    setShowTotalGrantedDialog(true)
    setLoadingGrantDetails(true)

    try {
      const res = await fetch(`/api/vacation/grant-calculation/${employeeId}`)
      if (res.ok) {
        const json = await res.json()
        setGrantCalculationDetails(json)
      } else {
        setGrantCalculationDetails(null)
      }
    } catch (error) {
      console.error("計算詳細取得エラー:", error)
      setGrantCalculationDetails(null)
    } finally {
      setLoadingGrantDetails(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {userRole === "employee" && (
        <div className="md:col-span-2 lg:col-span-4 -mb-2 text-sm text-muted-foreground">
          {statsData?.joinDate && (
            <span>入社日: {new Date(statsData.joinDate).toISOString().slice(0, 10).replaceAll('-', '/')}</span>
          )}
        </div>
      )}
      {stats.map((stat, index) => {
        const isClickable = userRole === "admin" || (userRole === "employee" && stat.title === "総付与数")
        const statTypes = ["pending", "approved", "rejected", "alerts"]
        const statType = userRole === "admin" ? statTypes[index] : null

        return (
          <Card
            key={stat.title}
            className={isClickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
            onClick={userRole === "admin" && statType ? () => handleStatCardClick(statType) : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {userRole === "employee" && stat.title === "総付与数" && canViewCalculationDetails ? (
                <div
                  className="text-3xl font-bold text-foreground cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTotalGrantedClick()
                  }}
                >
                  {stat.value}
                </div>
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
              {stat.subtitle && (
                <div className="text-xs text-muted-foreground mt-1">{stat.subtitle}</div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* 管理者用: 社員リストダイアログ */}
      <Dialog open={showEmployeeListDialog} onOpenChange={setShowEmployeeListDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedStatType === "pending" && "承認待ち"}
              {selectedStatType === "approved" && "今月承認済み"}
              {selectedStatType === "rejected" && "却下"}
              {selectedStatType === "alerts" && "アラート"}
            </DialogTitle>
            <DialogDescription>
              {selectedStatType === "pending" && "承認待ちの申請がある社員一覧"}
              {selectedStatType === "approved" && "今月承認済みの申請がある社員一覧"}
              {selectedStatType === "rejected" && "却下された申請がある社員一覧"}
              {selectedStatType === "alerts" && "アラート対象の社員一覧"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {loadingEmployeeList ? (
              <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
            ) : employeeList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">該当する社員はありません</div>
            ) : (
              <div className="space-y-2">
                {employeeList.map((employee: any) => (
                  <Card
                    key={employee.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      // 社員の有給管理画面に移動
                      // employeeIdが存在する場合はそれを使用（承認待ちの場合）
                      // それ以外の場合はidを使用（承認済み、却下、アラートの場合）
                      const targetEmployeeId = employee.employeeId || employee.id

                      if (targetEmployeeId) {
                        console.log('社員クリック:', {
                          name: employee.name,
                          employeeId: employee.employeeId,
                          id: employee.id,
                          targetEmployeeId: targetEmployeeId
                        })

                        // 社員名もパラメータに含める
                        const params = new URLSearchParams()
                        params.set('employeeId', targetEmployeeId)
                        if (employee.name) {
                          params.set('name', employee.name)
                        }

                        router.push(`/leave?${params.toString()}`)
                        setShowEmployeeListDialog(false)
                      } else {
                        console.error('社員IDが取得できませんでした:', employee)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.department} / {employee.employeeNumber}
                        </div>
                        {employee.pendingDays !== undefined && (
                          <div className="text-sm text-orange-600 mt-1">
                            承認待ち: {employee.pendingDays}日
                          </div>
                        )}
                        {employee.latestGrantDays !== undefined && (
                          <div className="text-sm mt-1">
                            <span className="text-muted-foreground">総付与: {employee.latestGrantDays}日</span>
                            {employee.used !== undefined && (
                              <span className="text-muted-foreground"> / 使用: {employee.used}日</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 社員用: 総付与数の計算詳細ダイアログ */}
      <Dialog open={showTotalGrantedDialog} onOpenChange={setShowTotalGrantedDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>総付与数の計算根拠</DialogTitle>
            <DialogDescription>
              総付与数の計算式と根拠を表示しています（最大10期前まで）
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {loadingGrantDetails ? (
              <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
            ) : !grantCalculationDetails ? (
              <div className="text-center py-8 text-muted-foreground">計算詳細データがありません</div>
            ) : grantCalculationDetails.periods && Array.isArray(grantCalculationDetails.periods) && grantCalculationDetails.periods.length > 0 ? (
              /* periods配列がある場合（動的対応） */
              <div className="space-y-4">
                {grantCalculationDetails.periods.map((period: any) => (
                  <Card key={period.periodKey} className="p-4">
                    <div className="font-semibold mb-2">{period.label}</div>
                    <div className="space-y-1 text-sm">
                      <div><strong>期間:</strong> {period.startDate} ~ {period.endDate || '未定'}</div>
                      <div>使用日数: {period.usedDays}日 / {period.totalGranted}日（総付与）</div>
                      {period.carryOverDays !== undefined && period.carryOverDays > 0 && (
                        <div>- 繰越し日数: {period.carryOverDays}日</div>
                      )}
                      {period.newGrantDate && (
                        <>
                          <div>- {period.newGrantDate} 新付与日数: {period.newGrantDays}日</div>
                          <div>- {period.newGrantDate} 時点総付与日数: {period.totalAtGrantDate}日（繰越し+新付与）</div>
                        </>
                      )}
                      {period.carryOverToNextPeriod && (
                        <div className="mt-2 pt-2 border-t">{period.carryOverToNextPeriod}への繰越し: {period.carryOverToNextPeriodDays}日</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (grantCalculationDetails.twoYearsAgo || grantCalculationDetails.lastYear || grantCalculationDetails.currentYear) ? (
              /* フォールバック: 従来形式 */
              <div className="space-y-4">
                {grantCalculationDetails.currentYear && (
                  <Card className="p-4">
                    <div className="font-semibold mb-2">今期</div>
                    <div className="space-y-1 text-sm">
                      <div><strong>期間:</strong> {grantCalculationDetails.currentYear.startDate} ~ {grantCalculationDetails.currentYear.endDate}</div>
                      <div>使用日数: {grantCalculationDetails.currentYear.usedDays}日 / {grantCalculationDetails.currentYear.totalGranted}日（総付与）</div>
                      {grantCalculationDetails.currentYear.carryOverToDate && (
                        <div>- {grantCalculationDetails.currentYear.carryOverToDate}への繰越し: {grantCalculationDetails.currentYear.carryOverDays}日</div>
                      )}
                      {grantCalculationDetails.currentYear.newGrantDate && (
                        <>
                          <div>- {grantCalculationDetails.currentYear.newGrantDate} 新付与日数: {grantCalculationDetails.currentYear.newGrantDays}日</div>
                          <div>- {grantCalculationDetails.currentYear.newGrantDate} 時点総付与日数: {grantCalculationDetails.currentYear.totalAtGrantDate}日（繰越し+新付与）</div>
                        </>
                      )}
                      {grantCalculationDetails.currentYear.carryOverToNextPeriod && (
                        <div className="mt-2 pt-2 border-t">{grantCalculationDetails.currentYear.carryOverToNextPeriod}への繰越し: {grantCalculationDetails.currentYear.carryOverToNextPeriodDays}日</div>
                      )}
                    </div>
                  </Card>
                )}
                {grantCalculationDetails.lastYear && (
                  <Card className="p-4">
                    <div className="font-semibold mb-2">昨年1年間</div>
                    <div className="space-y-1 text-sm">
                      <div><strong>期間:</strong> {grantCalculationDetails.lastYear.startDate} ~ {grantCalculationDetails.lastYear.endDate}</div>
                      <div>使用日数: {grantCalculationDetails.lastYear.usedDays}日 / {grantCalculationDetails.lastYear.totalGranted}日（総付与）</div>
                      {grantCalculationDetails.lastYear.carryOverToDate && (
                        <div>- {grantCalculationDetails.lastYear.carryOverToDate}への繰越し: {grantCalculationDetails.lastYear.carryOverDays}日</div>
                      )}
                      {grantCalculationDetails.lastYear.newGrantDate && (
                        <>
                          <div>- {grantCalculationDetails.lastYear.newGrantDate} 新付与日数: {grantCalculationDetails.lastYear.newGrantDays}日</div>
                          <div>- {grantCalculationDetails.lastYear.newGrantDate} 時点総付与日数: {grantCalculationDetails.lastYear.totalAtGrantDate}日（繰越し+新付与）</div>
                        </>
                      )}
                      {grantCalculationDetails.lastYear.carryOverToNextPeriod && (
                        <div className="mt-2 pt-2 border-t">{grantCalculationDetails.lastYear.carryOverToNextPeriod}への繰越し: {grantCalculationDetails.lastYear.carryOverToNextPeriodDays}日</div>
                      )}
                    </div>
                  </Card>
                )}
                {grantCalculationDetails.twoYearsAgo && (
                  <Card className="p-4">
                    <div className="font-semibold mb-2">一昨年1年間</div>
                    <div className="space-y-1 text-sm">
                      <div><strong>期間:</strong> {grantCalculationDetails.twoYearsAgo.startDate} ~ {grantCalculationDetails.twoYearsAgo.endDate}</div>
                      <div>使用日数: {grantCalculationDetails.twoYearsAgo.usedDays}日 / {grantCalculationDetails.twoYearsAgo.totalGranted}日（総付与）</div>
                      {grantCalculationDetails.twoYearsAgo.carryOverToDate && (
                        <div>- {grantCalculationDetails.twoYearsAgo.carryOverToDate}への繰越し: {grantCalculationDetails.twoYearsAgo.carryOverDays}日</div>
                      )}
                      {grantCalculationDetails.twoYearsAgo.newGrantDate && (
                        <>
                          <div>- {grantCalculationDetails.twoYearsAgo.newGrantDate} 新付与日数: {grantCalculationDetails.twoYearsAgo.newGrantDays}日</div>
                          <div>- {grantCalculationDetails.twoYearsAgo.newGrantDate} 時点総付与日数: {grantCalculationDetails.twoYearsAgo.totalAtGrantDate}日（繰越し+新付与）</div>
                        </>
                      )}
                      {grantCalculationDetails.twoYearsAgo.carryOverToNextPeriod && (
                        <div className="mt-2 pt-2 border-t">{grantCalculationDetails.twoYearsAgo.carryOverToNextPeriod}への繰越し: {grantCalculationDetails.twoYearsAgo.carryOverToNextPeriodDays}日</div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">計算詳細データがありません</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
