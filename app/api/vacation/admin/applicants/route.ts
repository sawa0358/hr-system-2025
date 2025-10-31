import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 管理者向け: 全社員の有給カード表示用データ
export async function GET(request: NextRequest) {
  try {
    // 社員の基本情報取得
    const employees = await prisma.employee.findMany({
      where: { isInvisibleTop: false },
      select: {
        id: true,
        name: true,
        joinDate: true,
        employeeType: true,
        vacationPattern: true,
        weeklyPattern: true,
      },
      orderBy: { joinDate: "asc" },
    })

    if (employees.length === 0) {
      return NextResponse.json({ employees: [] })
    }

    // 社員ごとの統計を集計
    const results = await Promise.all(
      employees.map(async (e) => {
        let remaining = 0
        let granted = 0
        
        // まず新しいロットベースシステムを試す（テーブルが存在しない場合はスキップ）
        try {
          // Prismaの$queryRawでテーブルの存在を確認
          await prisma.$queryRaw`SELECT 1 FROM grant_lots LIMIT 1`
          
          const lots = await prisma.grantLot.findMany({
            where: {
              employeeId: e.id,
              expiryDate: { gte: new Date() },
              daysRemaining: { gt: 0 },
            },
          })
          remaining = lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0)
          
          const allLots = await prisma.grantLot.findMany({
            where: { employeeId: e.id },
          })
          granted = allLots.reduce((sum, lot) => sum + Number(lot.daysGranted), 0)
        } catch (lotError: any) {
          // テーブルが存在しない場合は無視（フォールバック処理へ）
          // SQLiteではテーブルが存在しない場合、特定のエラーが返される
        }
        
        // ロットベースシステムでデータがない場合は旧システムを使用
        if (remaining === 0 && granted === 0) {
          try {
            const balances = await prisma.vacationBalance.findMany({
              where: { employeeId: e.id },
              select: { remainingDays: true, grantDays: true },
            })
            remaining = balances.reduce((a, b) => a + Number(b.remainingDays ?? 0), 0)
            granted = balances.reduce((a, b) => a + Number(b.grantDays ?? 0), 0)
          } catch (balanceError: any) {
            // エラーは無視（データなしとして扱う）
          }
        }

        let used = 0
        let pending = 0
        
        // 新しいシステムから取得を試す（テーブルが存在しない場合はスキップ）
        try {
          await prisma.$queryRaw`SELECT 1 FROM consumptions LIMIT 1`
          
          const consumptions = await prisma.consumption.findMany({
            where: { employeeId: e.id },
          })
          used = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0)
          
          await prisma.$queryRaw`SELECT 1 FROM time_off_requests LIMIT 1`
          
          const pendingRequests = await prisma.timeOffRequest.findMany({
            where: { employeeId: e.id, status: "PENDING" },
          })
          pending = pendingRequests.reduce((sum, r) => sum + Number(r.totalDays ?? 0), 0)
        } catch (newSystemError: any) {
          // テーブルが存在しない場合は無視（フォールバック処理へ）
        }
        
        // 新システムでデータがない場合は旧システムを使用
        if (used === 0 && pending === 0) {
          try {
            const [approvedSum, pendingSum] = await Promise.all([
              prisma.vacationRequest.aggregate({ _sum: { usedDays: true }, where: { employeeId: e.id, status: "APPROVED" } }),
              prisma.vacationRequest.aggregate({ _sum: { usedDays: true }, where: { employeeId: e.id, status: "PENDING" } }),
            ])
            used = Number(approvedSum._sum.usedDays ?? 0)
            pending = Number(pendingSum._sum.usedDays ?? 0)
          } catch (oldSystemError: any) {
            // エラーは無視（データなしとして扱う）
          }
        }

        return {
          id: e.id,
          name: e.name,
          joinDate: e.joinDate?.toISOString(),
          employeeType: e.employeeType || null,
          vacationPattern: e.vacationPattern || null,
          weeklyPattern: e.weeklyPattern || null,
          remaining: Math.max(0, remaining > 0 ? remaining - pending : granted - used - pending),
          used,
          pending,
          granted: granted > 0 ? granted : used + pending + Math.max(0, remaining),
        }
      })
    )

    return NextResponse.json({ employees: results })
  } catch (error: any) {
    console.error("GET /api/vacation/admin/applicants error", error)
    console.error("Error details:", error.message, error.stack)
    return NextResponse.json({ 
      error: "一覧取得に失敗しました",
      details: error.message 
    }, { status: 500 })
  }
}


