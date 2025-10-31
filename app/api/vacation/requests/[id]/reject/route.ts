// 有給申請却下API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 有給申請を却下するAPI
 * POST /api/vacation/requests/[id]/reject
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params
    const body = await request.json()
    const { reason, approverId } = body

    const req = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!req) {
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 })
    }

    if (req.status !== "PENDING") {
      return NextResponse.json({ error: "この申請は既に処理済みです" }, { status: 400 })
    }

    // 申請を却下済みに更新
    await prisma.timeOffRequest.update({
      where: { id: req.id },
      data: {
        status: "REJECTED",
        reason: reason || req.reason || "管理者による却下",
      },
    })

    // 監査ログを追加
    await prisma.auditLog.create({
      data: {
        employeeId: req.employeeId,
        actor: approverId ? `user:${approverId}` : "system",
        action: "REQUEST_REJECT",
        entity: `TimeOffRequest:${req.id}`,
        payload: JSON.stringify({ reason: reason || "管理者による却下" }),
      },
    })

    return NextResponse.json({ success: true, message: "申請を却下しました" })
  } catch (error) {
    console.error("POST /api/vacation/requests/[id]/reject error", error)
    return NextResponse.json({ error: "却下処理に失敗しました" }, { status: 500 })
  }
}

