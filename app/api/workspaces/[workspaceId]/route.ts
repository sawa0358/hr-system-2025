import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions } from "@/lib/permissions"
import { saveWorkspaceDataToS3 } from "@/lib/s3-client"

// GET /api/workspaces/[workspaceId] - ワークスペース詳細を取得
export async function GET(request: NextRequest, { params }: { params: { workspaceId: string } }) {
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
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
                role: true,
              },
            },
          },
        },
        boards: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                lists: true,
                cards: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "ワークスペースが見つかりません" }, { status: 404 })
    }

    // 権限チェック
    const memberIds = workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(userRole, userId, workspace.createdBy, memberIds)

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このワークスペースを表示する権限がありません" }, { status: 403 })
    }

    return NextResponse.json({ workspace, permissions: workspacePerms })
  } catch (error) {
    console.error("[v0] Error fetching workspace:", error)
    return NextResponse.json({ error: "ワークスペースの取得に失敗しました" }, { status: 500 })
  }
}

// PATCH /api/workspaces/[workspaceId] - ワークスペースを更新
export async function PATCH(request: NextRequest, { params }: { params: { workspaceId: string } }) {
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        members: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "ワークスペースが見つかりません" }, { status: 404 })
    }

    // 権限チェック
    const currentMemberIds = workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(userRole, userId, workspace.createdBy, currentMemberIds)

    if (!workspacePerms.canEdit) {
      return NextResponse.json({ error: "ワークスペースを編集する権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, memberIds } = body

    console.log('[v0] Updating workspace with data:', { name, description, memberIds })

    // メンバーの更新が必要な場合
    if (memberIds && Array.isArray(memberIds)) {
      // 削除するメンバー（現在のメンバーで新しいリストにないもの）
      const membersToRemove = currentMemberIds.filter(id => !memberIds.includes(id))
      
      // 追加するメンバー（新しいリストで現在のメンバーにないもの）
      const membersToAdd = memberIds.filter((id: string) => !currentMemberIds.includes(id))
      
      console.log('[v0] Members to remove:', membersToRemove)
      console.log('[v0] Members to add:', membersToAdd)
      
      // メンバーを削除
      if (membersToRemove.length > 0) {
        await prisma.workspaceMember.deleteMany({
          where: {
            workspaceId: params.workspaceId,
            employeeId: { in: membersToRemove },
          },
        })
      }
      
      // メンバーを追加
      if (membersToAdd.length > 0) {
        await prisma.workspaceMember.createMany({
          data: membersToAdd.map((employeeId: string) => ({
            workspaceId: params.workspaceId,
            employeeId,
            role: 'workspace_member',
          })),
        })
      }
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: {
        name,
        description,
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
    })

    // S3へのワークスペースデータ自動保存
    try {
      await saveWorkspaceDataToS3(params.workspaceId, updatedWorkspace);
    } catch (error) {
      console.error('[v0] Failed to save workspace to S3:', error);
      // S3保存に失敗してもレスポンスは返す
    }

    console.log('[v0] Workspace updated successfully, member count:', updatedWorkspace.members.length)
    return NextResponse.json({ workspace: updatedWorkspace })
  } catch (error) {
    console.error("[v0] Error updating workspace:", error)
    return NextResponse.json({ error: "ワークスペースの更新に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[workspaceId] - ワークスペースを削除
export async function DELETE(request: NextRequest, { params }: { params: { workspaceId: string } }) {
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        members: true,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: "ワークスペースが見つかりません" }, { status: 404 })
    }

    // 権限チェック
    const memberIds = workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(userRole, userId, workspace.createdBy, memberIds)

    if (!workspacePerms.canDelete) {
      return NextResponse.json({ error: "ワークスペースを削除する権限がありません" }, { status: 403 })
    }

    await prisma.workspace.delete({
      where: { id: params.workspaceId },
    })

    return NextResponse.json({ message: "ワークスペースを削除しました" })
  } catch (error) {
    console.error("[v0] Error deleting workspace:", error)
    return NextResponse.json({ error: "ワークスペースの削除に失敗しました" }, { status: 500 })
  }
}
