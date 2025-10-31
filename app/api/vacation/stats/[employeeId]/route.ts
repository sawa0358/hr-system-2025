import { NextRequest, NextResponse } from "next/server"
import { getVacationStats } from "@/lib/vacation-stats"

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId が必要です" }, { status: 400 })
    }

    // ロットベースの計算ロジックを使用
    const stats = await getVacationStats(employeeId)

    return NextResponse.json({
      employeeName: stats.employeeName,
      joinDate: stats.joinDate?.toISOString(),
      totalRemaining: stats.totalRemaining,
      used: stats.used,
      pending: stats.pending,
      totalGranted: stats.totalGranted,
      nextGrantDate: stats.nextGrantDate?.toISOString(),
      expiringSoon: stats.expiringSoon,
    })
  } catch (error) {
    console.error("GET /api/vacation/stats/[employeeId] error", error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }
    return NextResponse.json({ error: "統計取得に失敗しました" }, { status: 500 })
  }
}

