import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkCardPermissions } from "@/lib/permissions"

// POST /api/cards/[cardId]/members - カードにメンバーを追加
export async function POST(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    const userId = request.headers.get("x-employee-id")

    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        members: true,
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードのメンバー追加権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canAddMembers) {
      return NextResponse.json(
        { error: "メンバーを追加する権限がありません。店長・マネージャー・総務・管理者のみ追加できます。" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ error: "社員IDは必須です" }, { status: 400 })
    }

    // すでにメンバーかチェック
    const existingMember = await prisma.cardMember.findUnique({
      where: {
        cardId_employeeId: {
          cardId: params.cardId,
          employeeId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "このユーザーはすでにメンバーです" }, { status: 400 })
    }

    const member = await prisma.cardMember.create({
      data: {
        cardId: params.cardId,
        employeeId,
        addedBy: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding card member:", error)
    return NextResponse.json({ error: "メンバーの追加に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId]/members/[memberId] - カードからメンバーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string; memberId: string } },
) {
  try {
    const userId = request.headers.get("x-employee-id")

    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        members: true,
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードのメンバー削除権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canAddMembers) {
      return NextResponse.json({ error: "メンバーを削除する権限がありません" }, { status: 403 })
    }

    await prisma.cardMember.delete({
      where: {
        id: params.memberId,
      },
    })

    return NextResponse.json({ message: "メンバーを削除しました" })
  } catch (error) {
    console.error("[v0] Error removing card member:", error)
    return NextResponse.json({ error: "メンバーの削除に失敗しました" }, { status: 500 })
  }
}

