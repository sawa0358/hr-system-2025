import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkCardPermissions, checkWorkspacePermissions } from "@/lib/permissions"

// GET /api/cards/[cardId] - カード詳細を取得
export async function GET(request: NextRequest, { params }: { params: { cardId: string } }) {
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
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
        list: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // ワークスペースのアクセス権限チェック
    const workspaceMemberIds = card.board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      card.board.workspace.createdBy,
      workspaceMemberIds,
    )

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このカードを表示する権限がありません" }, { status: 403 })
    }

    // カードの権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    return NextResponse.json({ card, permissions: cardPerms })
  } catch (error) {
    console.error("[v0] Error fetching card:", error)
    return NextResponse.json({ error: "カードの取得に失敗しました" }, { status: 500 })
  }
}

// PATCH /api/cards/[cardId] - カードを更新
export async function PATCH(request: NextRequest, { params }: { params: { cardId: string } }) {
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
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードの編集権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canEdit) {
      return NextResponse.json(
        { error: cardPerms.reason || "カードを編集する権限がありません" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { title, description, dueDate, priority, labels, checklists, cardColor, isArchived } = body

    const updatedCard = await prisma.card.update({
      where: { id: params.cardId },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        labels: labels !== undefined ? labels : undefined,
        checklists: checklists !== undefined ? checklists : undefined,
        cardColor,
        isArchived,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ card: updatedCard })
  } catch (error) {
    console.error("[v0] Error updating card:", error)
    return NextResponse.json({ error: "カードの更新に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId] - カードを削除
export async function DELETE(request: NextRequest, { params }: { params: { cardId: string } }) {
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

    // カードの削除権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canDelete) {
      return NextResponse.json({ error: "カードを削除する権限がありません" }, { status: 403 })
    }

    await prisma.card.delete({
      where: { id: params.cardId },
    })

    return NextResponse.json({ message: "カードを削除しました" })
  } catch (error) {
    console.error("[v0] Error deleting card:", error)
    return NextResponse.json({ error: "カードの削除に失敗しました" }, { status: 500 })
  }
}

