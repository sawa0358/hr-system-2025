// 有給申請一覧取得API（社員用）
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 社員の有給申請一覧を取得するAPI
 * GET /api/vacation/requests?employeeId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status") // "PENDING", "APPROVED", "REJECTED", "CANCELLED" または null（全件）

    if (!employeeId) {
      return NextResponse.json({ error: "employeeIdが必要です" }, { status: 400 })
    }

    // 社員存在チェック
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true },
    })

    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    // 申請一覧を取得
    const where: any = { employeeId }
    if (status) {
      where.status = status
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        unit: true,
        hoursPerDay: true,
        totalDays: true,
        status: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
      },
    })

    return NextResponse.json({
      requests: requests.map((req) => ({
        id: req.id,
        startDate: req.startDate.toISOString().slice(0, 10),
        endDate: req.endDate.toISOString().slice(0, 10),
        unit: req.unit,
        hoursPerDay: req.hoursPerDay,
        days: req.totalDays ? Number(req.totalDays) : null,
        status: req.status.toLowerCase(),
        reason: req.reason,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        approvedAt: req.approvedAt?.toISOString(),
      })),
    })
  } catch (error) {
    console.error("GET /api/vacation/requests error", error)
    return NextResponse.json({ error: "申請一覧の取得に失敗しました" }, { status: 500 })
  }
}

