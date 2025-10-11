import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions } from "@/lib/permissions"

// PATCH /api/boards/[boardId]/lists/reorder - リストの並び順を更新
export async function PATCH(request: NextRequest, { params }: { params: { boardId: string } }) {
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

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: "ボードが見つかりません" }, { status: 404 })
    }

    // ワークスペースのアクセス権限チェック
    const memberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      memberIds,
    )

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このボードにアクセスする権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { listOrders } = body

    if (!listOrders || !Array.isArray(listOrders)) {
      return NextResponse.json({ error: "リストの並び順データが無効です" }, { status: 400 })
    }

    console.log("[v0] Reordering lists:", listOrders)

    // トランザクションを使用してリストの並び順を更新
    await prisma.$transaction(
      listOrders.map((listOrder: { id: string; position: number }) =>
        prisma.boardList.update({
          where: { id: listOrder.id },
          data: { position: listOrder.position },
        })
      )
    )

    console.log("[v0] Lists reordered successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error reordering lists:", error)
    return NextResponse.json({ error: "リストの並び順更新に失敗しました" }, { status: 500 })
  }
}
