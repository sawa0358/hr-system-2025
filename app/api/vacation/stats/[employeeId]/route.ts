import { NextRequest, NextResponse } from "next/server"
import { getVacationStats, calculatePendingDays, calculateNextPeriodPendingDays } from "@/lib/vacation-stats"

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId が必要です" }, { status: 400 })
    }

    try {
      // ロットベースの計算ロジックを使用
      const stats = await getVacationStats(employeeId)
      
      // 今期と来期の申請中日数を分けて計算
      const today = new Date()
      const totalPending = await calculatePendingDays(employeeId)
      const nextPeriodPending = await calculateNextPeriodPendingDays(employeeId, today)
      const currentPeriodPending = Math.max(0, totalPending - nextPeriodPending)

      return NextResponse.json({
        employeeName: stats.employeeName,
        joinDate: stats.joinDate?.toISOString(),
        totalRemaining: stats.totalRemaining,
        used: stats.used,
        pending: totalPending,           // 全申請中日数（今期+来期）
        currentPending: currentPeriodPending, // 今期の申請中日数
        nextPending: nextPeriodPending,  // 来期の申請中日数
        totalGranted: stats.totalGranted,
        nextGrantDate: stats.nextGrantDate?.toISOString(),
        expiringSoon: stats.expiringSoon,
      })
    } catch (lotError: any) {
      // ロットベースシステムが未初期化の場合、フォールバック処理
      console.warn("ロットベースシステムの取得に失敗、フォールバック処理を実行:", lotError)
      
      const { prisma } = await import("@/lib/prisma")
      
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, name: true, joinDate: true },
      })
      
      if (!employee) {
        return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
      }

      // 旧システムから値を取得（フォールバック）
      let remaining = 0
      let granted = 0
      try {
        const balances = await prisma.vacationBalance.findMany({
          where: { employeeId },
          select: { remainingDays: true, grantDays: true },
        })
        remaining = balances.reduce((a, b) => a + Number(b.remainingDays ?? 0), 0)
        granted = balances.reduce((a, b) => a + Number(b.grantDays ?? 0), 0)
      } catch {}

      let used = 0
      let pending = 0
      try {
        const [approvedSum, pendingSum] = await Promise.all([
          prisma.vacationRequest.aggregate({
            _sum: { usedDays: true },
            where: { employeeId, status: "APPROVED" },
          }),
          prisma.vacationRequest.aggregate({
            _sum: { usedDays: true },
            where: { employeeId, status: "PENDING" },
          }),
        ])
        used = Number(approvedSum._sum.usedDays ?? 0)
        pending = Number(pendingSum._sum.usedDays ?? 0)
      } catch {}

      return NextResponse.json({
        employeeName: employee.name,
        joinDate: employee.joinDate?.toISOString(),
        totalRemaining: Math.max(0, remaining > 0 ? remaining - pending : granted - used - pending),
        used,
        pending,
        totalGranted: granted > 0 ? granted : used + pending + Math.max(0, remaining),
      })
    }
  } catch (error) {
    console.error("GET /api/vacation/stats/[employeeId] error", error)
    return NextResponse.json({ error: "統計取得に失敗しました" }, { status: 500 })
  }
}

