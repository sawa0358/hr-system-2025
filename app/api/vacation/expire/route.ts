import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { expireGrantLots } from "@/lib/vacation-lot-generator"

/**
 * 失効処理API
 * POST /api/vacation/expire
 * 期限切れのロットの残日数を0にする
 */
export async function POST(request: NextRequest) {
  try {
    const today = new Date()
    const expiredCount = await expireGrantLots(today)

    return NextResponse.json({
      success: true,
      expiredCount,
      message: `${expiredCount}件のロットを失効処理しました`,
    })
  } catch (error: any) {
    console.error("POST /api/vacation/expire error", error)
    return NextResponse.json(
      { error: "失効処理に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * 失効処理の状態確認
 * GET /api/vacation/expire
 */
export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const expiredLots = await prisma.grantLot.findMany({
      where: {
        expiryDate: { lt: today },
        daysRemaining: { gt: 0 },
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    })

    return NextResponse.json({
      expiredCount: expiredLots.length,
      expiredLots: expiredLots.map((lot) => ({
        id: lot.id,
        employeeName: lot.employee.name,
        grantDate: lot.grantDate.toISOString().slice(0, 10),
        expiryDate: lot.expiryDate.toISOString().slice(0, 10),
        daysRemaining: lot.daysRemaining,
      })),
    })
  } catch (error: any) {
    console.error("GET /api/vacation/expire error", error)
    return NextResponse.json(
      { error: "失効状態の取得に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

