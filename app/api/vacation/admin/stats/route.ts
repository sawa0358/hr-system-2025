// 管理者用統計API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateUsedDays } from "@/lib/vacation-stats"

/**
 * 管理者用統計情報を取得するAPI
 * GET /api/vacation/admin/stats
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    let pendingRequests = 0
    let approvedThisMonth = 0
    let rejectedRequests = 0
    
    // 新システムのテーブルから取得を試す
    try {
      // ステータスが「active」の社員のみを対象にする
      const activeEmployeeIds = await prisma.employee.findMany({
        where: { status: "active" },
        select: { id: true },
      })
      const activeEmployeeIdList = activeEmployeeIds.map(e => e.id)
      
      pendingRequests = await prisma.timeOffRequest.count({
        where: { 
          status: "PENDING",
          employeeId: { in: activeEmployeeIdList },
        },
      })

      // 今月承認済み: approvedAtが今月の範囲内、またはapprovedAtがnullでupdatedAtが今月の範囲内
      approvedThisMonth = await prisma.timeOffRequest.count({
        where: {
          status: "APPROVED",
          employeeId: { in: activeEmployeeIdList },
          OR: [
            {
              approvedAt: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
            {
              approvedAt: null,
              updatedAt: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          ],
        },
      })

      rejectedRequests = await prisma.timeOffRequest.count({
        where: { 
          status: "REJECTED",
          employeeId: { in: activeEmployeeIdList },
        },
      })
    } catch (newSystemError: any) {
      // テーブルが存在しない場合は旧システムを使用
      if (newSystemError?.code === 'P2021' || newSystemError?.message?.includes('does not exist')) {
        try {
          // ステータスが「active」の社員のみを対象にする
          const activeEmployeeIds = await prisma.employee.findMany({
            where: { status: "active" },
            select: { id: true },
          })
          const activeEmployeeIdList = activeEmployeeIds.map(e => e.id)
          
          pendingRequests = await prisma.vacationRequest.count({
            where: { 
              status: "PENDING",
              employeeId: { in: activeEmployeeIdList },
            },
          })

          // 今月承認済み: approvedAtが今月の範囲内、またはapprovedAtがnullでupdatedAtが今月の範囲内
          approvedThisMonth = await prisma.vacationRequest.count({
            where: {
              status: "APPROVED",
              employeeId: { in: activeEmployeeIdList },
              OR: [
                {
                  approvedAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                  },
                },
                {
                  approvedAt: null,
                  updatedAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                  },
                },
              ],
            },
          })

          rejectedRequests = await prisma.vacationRequest.count({
            where: { 
              status: "REJECTED",
              employeeId: { in: activeEmployeeIdList },
            },
          })
        } catch (oldSystemError: any) {
          console.warn('旧システムからの統計取得も失敗:', oldSystemError?.message)
        }
      } else {
        console.warn('新システムからの統計取得エラー:', newSystemError?.message)
      }
    }

    // アラート数（5日消化義務アラート）
    // 最新の付与日での付与日数が5日以上で、使用日数が5日未満の社員数
    let alerts = 0
    try {
      const activeEmployees = await prisma.employee.findMany({
        where: { status: "active" },
        select: { id: true },
      })
      const activeEmployeeIdList = activeEmployees.map(e => e.id)
      
      if (activeEmployeeIdList.length > 0) {
        const today = new Date()
        const minGrantDaysForAlert = 5
        
        // 各社員のアラート状況をチェック
        const alertChecks = await Promise.all(
          activeEmployeeIdList.map(async (employeeId) => {
            try {
              // 最新の付与ロットを取得
              const latestLot = await prisma.grantLot.findFirst({
                where: {
                  employeeId,
                  expiryDate: { gte: today },
                },
                orderBy: { grantDate: 'desc' },
              })
              
              if (!latestLot) return false
              
              const latestGrantDays = Number(latestLot.daysGranted)
              const used = await calculateUsedDays(employeeId, today)
              
              // 最新の付与日での付与日数が5日以上で、使用日数が5日未満
              return latestGrantDays >= minGrantDaysForAlert && used < minGrantDaysForAlert
            } catch {
              return false
            }
          })
        )
        
        alerts = alertChecks.filter(Boolean).length
      }
    } catch (alertError: any) {
      console.warn('アラート数計算エラー:', alertError?.message)
      alerts = 0
    }

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

