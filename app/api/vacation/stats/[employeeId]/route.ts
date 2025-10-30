import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId が必要です" }, { status: 400 })
    }

    // 社員情報（名前・入社日）
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, joinDate: true },
    })
    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    // 残日数は VacationBalance があれば合算、なければ 0（テーブル未作成等でもフォールバック）
    let remainingFromBalances = 0
    let grantedFromBalances = 0
    try {
      const balances = await prisma.vacationBalance.findMany({
        where: { employeeId },
        select: { remainingDays: true, grantDays: true },
      })
      remainingFromBalances = balances.reduce((acc, b) => acc + Number(b.remainingDays ?? 0), 0)
      grantedFromBalances = balances.reduce((acc, b) => acc + Number(b.grantDays ?? 0), 0)
    } catch (e) {
      // フォールバック: 0 として続行
      remainingFromBalances = 0
      grantedFromBalances = 0
    }

    // 申請の集計
    let approvedSum: { _sum: { usedDays: number | null } } = { _sum: { usedDays: 0 } }
    let pendingSum: { _sum: { usedDays: number | null } } = { _sum: { usedDays: 0 } }
    try {
      ;[approvedSum, pendingSum] = await Promise.all([
        prisma.vacationRequest.aggregate({
          _sum: { usedDays: true },
          where: { employeeId, status: "APPROVED" },
        }),
        prisma.vacationRequest.aggregate({
          _sum: { usedDays: true },
          where: { employeeId, status: "PENDING" },
        }),
      ])
    } catch (e) {
      approvedSum = { _sum: { usedDays: 0 } }
      pendingSum = { _sum: { usedDays: 0 } }
    }

    const used = Number(approvedSum._sum.usedDays ?? 0)
    const pending = Number(pendingSum._sum.usedDays ?? 0)

    // totalGranted は balances があればそれを採用、なければ used + pending + remaining の合算
    const totalGranted = grantedFromBalances > 0
      ? grantedFromBalances
      : Math.max(0, used + pending + remainingFromBalances)

    const totalRemaining = Math.max(0, remainingFromBalances > 0
      ? remainingFromBalances - pending // 申請中を控除して見せる
      : totalGranted - used - pending)

    return NextResponse.json({
      employeeName: employee.name,
      joinDate: employee.joinDate?.toISOString(),
      totalRemaining,
      used,
      pending,
      totalGranted,
    })
  } catch (error) {
    console.error("GET /api/vacation/stats/[employeeId] error", error)
    return NextResponse.json({ error: "統計取得に失敗しました" }, { status: 500 })
  }
}

