import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, getPermissions } from "@/lib/permissions"
import { saveWorkspaceDataToS3 } from "@/lib/s3-client"

// GET /api/boards/[boardId] - ボード詳細を取得
export async function GET(request: NextRequest, { params }: { params: { boardId: string } }) {
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
            name: true,
            email: true,
          },
        },
        lists: {
          include: {
            cards: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
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
                        employeeType: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
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
      return NextResponse.json({ error: "このボードを表示する権限がありません" }, { status: 403 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error("[v0] Error fetching board:", error)
    return NextResponse.json({ error: "ボードの取得に失敗しました" }, { status: 500 })
  }
}

// PATCH /api/boards/[boardId] - ボードを更新
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

    const permissions = getPermissions(userRole)
    const memberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      memberIds,
    )

    // ボード編集権限チェック: 作成者または管理者/総務
    const canEdit =
      board.createdBy === userId || permissions.editBoards || workspacePerms.canEdit

    if (!canEdit) {
      return NextResponse.json({ error: "ボードを編集する権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: {
        name,
        description,
      },
      include: {
        workspace: true,
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

    // ワークスペース全体を取得してS3に保存
    if (updatedBoard && updatedBoard.workspace) {
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: updatedBoard.workspace.id },
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
                    position: true,
                  },
                },
              },
            },
            boards: {
              include: {
                lists: {
                  include: {
                    cards: {
                      include: {
                        members: {
                          include: {
                            employee: {
                              select: {
                                id: true,
                                name: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        
        if (workspace) {
          await saveWorkspaceDataToS3(workspace.id, workspace);
        }
      } catch (error) {
        console.error('[v0] Failed to save workspace to S3:', error);
      }
    }

    return NextResponse.json({ board: updatedBoard })
  } catch (error) {
    console.error("[v0] Error updating board:", error)
    return NextResponse.json({ error: "ボードの更新に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/boards/[boardId] - ボードを削除
export async function DELETE(request: NextRequest, { params }: { params: { boardId: string } }) {
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

    const permissions = getPermissions(userRole)
    const memberIds = board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      board.workspace.createdBy,
      memberIds,
    )

    // ボード削除権限チェック: 作成者かつ削除権限があるか、管理者/総務
    const canDelete =
      (board.createdBy === userId && permissions.deleteBoards) ||
      permissions.editOthersCards || // 管理者・総務
      workspacePerms.canDelete

    if (!canDelete) {
      return NextResponse.json({ error: "ボードを削除する権限がありません" }, { status: 403 })
    }

    await prisma.board.delete({
      where: { id: params.boardId },
    })

    return NextResponse.json({ message: "ボードを削除しました" })
  } catch (error) {
    console.error("[v0] Error deleting board:", error)
    return NextResponse.json({ error: "ボードの削除に失敗しました" }, { status: 500 })
  }
}

