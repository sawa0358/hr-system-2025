// 管理者用統計API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 管理者用統計情報を取得するAPI
 * GET /api/vacation/admin/stats
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // 承認待ちの申請数
    const pendingRequests = await prisma.timeOffRequest.count({
      where: { status: "PENDING" },
    })

    // 今月の承認済み申請数
    const approvedThisMonth = await prisma.timeOffRequest.count({
      where: {
        status: "APPROVED",
        approvedAt: {
          gte: firstDayOfMonth,
        },
      },
    })

    // 却下申請数（全期間）
    const rejectedRequests = await prisma.timeOffRequest.count({
      where: { status: "REJECTED" },
    })

    // アラート数（残高が少ない社員数）
    // TODO: アラート評価ロジックを実装後に正確な数を取得
    // 現在は暫定的に0を返す
    const alerts = 0

    return NextResponse.json({
      pending: pendingRequests,
      approvedThisMonth,
      rejected: rejectedRequests,
      alerts,
    })
  } catch (error) {
    console.error("GET /api/vacation/admin/stats error", error)
    return NextResponse.json({ error: "統計情報の取得に失敗しました" }, { status: 500 })
  }
}

