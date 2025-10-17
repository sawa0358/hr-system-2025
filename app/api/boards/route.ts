import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, getPermissions } from "@/lib/permissions"

// POST /api/boards - 新しいボードを作成
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
    const permissions = getPermissions(userRole)

    if (!permissions.createBoards) {
      return NextResponse.json({ error: "ボード作成の権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, workspaceId, templateBoardId } = body

    if (!name || !workspaceId) {
      return NextResponse.json({ error: "ボード名とワークスペースIDは必須です" }, { status: 400 })
    }

    // ワークスペースのメンバーかチェック
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "ワークスペースが見つかりません" }, { status: 404 })
    }

    const memberIds = workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(userRole, userId, workspace.createdBy, memberIds)

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このワークスペースにアクセスする権限がありません" }, { status: 403 })
    }

    // テンプレートボードからリスト情報を取得
    let defaultLists = [
      { name: "常時運用タスク", position: 0 },
      { name: "予定リスト", position: 1 },
      { name: "進行中", position: 2 },
      { name: "完了", position: 3 },
    ]

    if (templateBoardId) {
      const templateBoard = await prisma.board.findUnique({
        where: { id: templateBoardId },
        include: {
          lists: {
            orderBy: {
              position: "asc",
            },
          },
        },
      })

      if (templateBoard && templateBoard.lists.length > 0) {
        console.log("[v0] Using template board lists:", templateBoard.lists)
        defaultLists = templateBoard.lists.map((list, index) => ({
          name: list.name,
          position: index,
        }))
      }
    }

    console.log("[v0] Creating board with default lists:", defaultLists)

    // ボードの最大position値を取得
    const maxPositionBoard = await prisma.board.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    })

    const board = await prisma.board.create({
      data: {
        name,
        description,
        workspaceId,
        createdBy: userId,
        position: 0,
        lists: {
          create: defaultLists,
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
        lists: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })

    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating board:", error)
    return NextResponse.json({ error: "ボードの作成に失敗しました" }, { status: 500 })
  }
}

