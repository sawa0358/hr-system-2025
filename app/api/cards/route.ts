import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions } from "@/lib/permissions"

// POST /api/cards - 新しいカードを作成
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, listId, boardId, dueDate, priority, memberIds = [] } = body

    console.log("POST /api/cards - Request data:", { title, description, boardId, listId, dueDate, priority, memberIds })

    if (!title || !listId || !boardId) {
      return NextResponse.json({ error: "タイトル、リストID、ボードIDは必須です" }, { status: 400 })
    }

    // リストIDの存在確認
    const list = await prisma.boardList.findUnique({
      where: { id: listId },
      select: { id: true, boardId: true }
    })

    if (!list) {
      console.log("POST /api/cards - List not found:", listId)
      return NextResponse.json({ error: "指定されたリストが見つかりません" }, { status: 404 })
    }

    if (list.boardId !== boardId) {
      console.log("POST /api/cards - List boardId mismatch:", { listBoardId: list.boardId, requestBoardId: boardId })
      return NextResponse.json({ error: "リストとボードが一致しません" }, { status: 400 })
    }

    // ボードとワークスペースの権限チェック
    const board = await prisma.board.findUnique({
      where: { id: boardId },
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

    const workspaceMemberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      workspaceMemberIds,
    )

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このボードにアクセスする権限がありません" }, { status: 403 })
    }

    // カードの最大position値を取得
    const maxPositionCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { position: "desc" },
    })

    // カード作成時は作成者を自動的にメンバーに追加
    const allMemberIds = Array.from(new Set([userId, ...memberIds]))

    const card = await prisma.card.create({
      data: {
        title,
        description,
        listId,
        boardId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "medium",
        createdBy: userId,
        position: (maxPositionCard?.position ?? -1) + 1,
        members: {
          create: allMemberIds.map((employeeId) => ({
            employeeId,
            addedBy: userId,
          })),
        },
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

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating card:", error)
    return NextResponse.json({ error: "カードの作成に失敗しました" }, { status: 500 })
  }
}

