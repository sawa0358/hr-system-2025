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
    
    let pendingRequests = 0
    let approvedThisMonth = 0
    let rejectedRequests = 0
    
    // 新システムのテーブルから取得を試す
    try {
      pendingRequests = await prisma.timeOffRequest.count({
        where: { status: "PENDING" },
      })

      approvedThisMonth = await prisma.timeOffRequest.count({
        where: {
          status: "APPROVED",
          approvedAt: {
            gte: firstDayOfMonth,
          },
        },
      })

      rejectedRequests = await prisma.timeOffRequest.count({
        where: { status: "REJECTED" },
      })
    } catch (newSystemError: any) {
      // テーブルが存在しない場合は旧システムを使用
      if (newSystemError?.code === 'P2021' || newSystemError?.message?.includes('does not exist')) {
        try {
          pendingRequests = await prisma.vacationRequest.count({
            where: { status: "PENDING" },
          })

          approvedThisMonth = await prisma.vacationRequest.count({
            where: {
              status: "APPROVED",
              approvedAt: {
                gte: firstDayOfMonth,
              },
            },
          })

          rejectedRequests = await prisma.vacationRequest.count({
            where: { status: "REJECTED" },
          })
        } catch (oldSystemError: any) {
          console.warn('旧システムからの統計取得も失敗:', oldSystemError?.message)
        }
      } else {
        console.warn('新システムからの統計取得エラー:', newSystemError?.message)
      }
    }

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
  } catch (error: any) {
    console.error("GET /api/vacation/admin/stats error", error)
    // エラーが発生しても空の統計を返す（画面が崩れないように）
    return NextResponse.json({
      pending: 0,
      approvedThisMonth: 0,
      rejected: 0,
      alerts: 0,
    })
  }
}

