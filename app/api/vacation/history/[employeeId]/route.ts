import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthHeaders } from "@/lib/auth"

/**
 * 有給管理履歴一覧取得API
 * GET /api/vacation/history/[employeeId]
 * 総務・管理者のみアクセス可能
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    // 権限チェック
    const authHeaders = getAuthHeaders(request)
    if (!authHeaders.userId) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const user = await prisma.employee.findUnique({
      where: { id: authHeaders.userId },
      select: { role: true },
    })

    // 総務・管理者のみアクセス可能
    if (user?.role !== "hr" && user?.role !== "admin") {
      return NextResponse.json(
        { error: "この機能は総務・管理者のみ利用可能です" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const grantYear = searchParams.get("grantYear") // 年度（例: 2024）

    // 履歴スナップショットを取得
    const where: any = {
      employeeId: params.employeeId,
    }

    if (grantYear) {
      where.grantYear = parseInt(grantYear, 10)
    }

    const snapshots = await prisma.leaveHistorySnapshot.findMany({
      where,
      orderBy: {
        snapshotDate: "desc", // 新しい順
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            department: true,
            position: true,
          },
        },
      },
    })

    // 年度別にグループ化
    const groupedByYear = snapshots.reduce((acc, snapshot) => {
      const year = snapshot.grantYear
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(snapshot)
      return acc
    }, {} as Record<number, typeof snapshots>)

    // 年度のリストを取得（降順）
    const years = Object.keys(groupedByYear)
      .map(Number)
      .sort((a, b) => b - a)

    return NextResponse.json({
      success: true,
      employeeId: params.employeeId,
      snapshots,
      groupedByYear,
      years,
      total: snapshots.length,
    })
  } catch (error: any) {
    console.error("履歴一覧取得エラー:", error)
    return NextResponse.json(
      { error: "履歴一覧の取得に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}














