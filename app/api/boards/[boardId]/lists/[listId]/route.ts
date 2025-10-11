import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, getPermissions } from "@/lib/permissions"

// PATCH /api/boards/[boardId]/lists/[listId] - リストを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { boardId: string; listId: string } }
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

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: "ボードが見つかりません" }, { status: 404 })
    }

    const list = await prisma.boardList.findUnique({
      where: { id: params.listId },
    })

    if (!list || list.boardId !== params.boardId) {
      return NextResponse.json({ error: "リストが見つかりません" }, { status: 404 })
    }

    const permissions = getPermissions(userRole)
    const memberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      memberIds,
    )

    // リスト編集権限チェック: ボード作成者または管理者/総務
    const canEdit =
      board.createdBy === userId || permissions.editBoards || workspacePerms.canEdit

    if (!canEdit) {
      return NextResponse.json({ error: "リストを編集する権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { title, color } = body

    // colorまたはtitleのいずれかが必要
    if (!color && !title) {
      return NextResponse.json({ error: "色またはリスト名のいずれかは必須です" }, { status: 400 })
    }

    // 更新データを構築
    const updateData: any = {}
    if (title && title.trim() !== "") {
      updateData.title = title.trim()
    }
    if (color) {
      updateData.color = color
    }

    // 更新データが空の場合はエラー
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "更新するデータがありません" }, { status: 400 })
    }

    const updatedList = await prisma.boardList.update({
      where: { id: params.listId },
      data: updateData,
    })

    return NextResponse.json({ list: updatedList })
  } catch (error) {
    console.error("Error updating list:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: await request.text().catch(() => 'Failed to read body'),
      params,
      userId: request.headers.get("x-employee-id")
    })
    return NextResponse.json({ 
      error: "リストの更新に失敗しました",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/boards/[boardId]/lists/[listId] - リストを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { boardId: string; listId: string } }
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

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: "ボードが見つかりません" }, { status: 404 })
    }

    const list = await prisma.boardList.findUnique({
      where: { id: params.listId },
    })

    if (!list || list.boardId !== params.boardId) {
      return NextResponse.json({ error: "リストが見つかりません" }, { status: 404 })
    }

    const permissions = getPermissions(userRole)
    const memberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      memberIds,
    )

    // リスト削除権限チェック: ボード作成者または管理者/総務
    const canDelete =
      board.createdBy === userId || permissions.editBoards || workspacePerms.canDelete

    if (!canDelete) {
      return NextResponse.json({ error: "リストを削除する権限がありません" }, { status: 403 })
    }

    // リストに関連するカードも削除
    await prisma.boardList.delete({
      where: { id: params.listId },
    })

    return NextResponse.json({ message: "リストを削除しました" })
  } catch (error) {
    console.error("Error deleting list:", error)
    return NextResponse.json({ error: "リストの削除に失敗しました" }, { status: 500 })
  }
}
