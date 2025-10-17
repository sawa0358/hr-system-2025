import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions } from "@/lib/permissions"

// POST /api/boards/[boardId]/lists - 新しいリストを作成
export async function POST(request: NextRequest, { params }: { params: { boardId: string } }) {
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
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: "リストのタイトルは必須です" }, { status: 400 })
    }

    // リストの最大position値を取得
    const maxPositionList = await prisma.boardList.findFirst({
      where: { boardId: params.boardId },
      orderBy: { position: "desc" },
    })

    const list = await prisma.boardList.create({
      data: {
        boardId: params.boardId,
        title: title,
        position: (maxPositionList?.position ?? -1) + 1,
      },
    })

    return NextResponse.json({ list }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating list:", error)
    return NextResponse.json({ error: "リストの作成に失敗しました" }, { status: 500 })
  }
}

