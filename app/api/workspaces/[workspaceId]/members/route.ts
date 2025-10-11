import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions } from "@/lib/permissions"

// POST /api/workspaces/[workspaceId]/members - ワークスペースにメンバーを追加
export async function POST(request: NextRequest, { params }: { params: { workspaceId: string } }) {
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

    if (!workspacePerms.canAddMembers) {
      return NextResponse.json({ error: "メンバーを追加する権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { employeeId, role = "workspace_member" } = body

    if (!employeeId) {
      return NextResponse.json({ error: "社員IDは必須です" }, { status: 400 })
    }

    // すでにメンバーかチェック
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_employeeId: {
          workspaceId: params.workspaceId,
          employeeId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "このユーザーはすでにメンバーです" }, { status: 400 })
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: params.workspaceId,
        employeeId,
        role,
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
    console.error("[v0] Error adding member:", error)
    return NextResponse.json({ error: "メンバーの追加に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[workspaceId]/members/[memberId] - ワークスペースからメンバーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; memberId: string } },
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

    if (!workspacePerms.canAddMembers) {
      return NextResponse.json({ error: "メンバーを削除する権限がありません" }, { status: 403 })
    }

    await prisma.workspaceMember.delete({
      where: {
        id: params.memberId,
      },
    })

    return NextResponse.json({ message: "メンバーを削除しました" })
  } catch (error) {
    console.error("[v0] Error removing member:", error)
    return NextResponse.json({ error: "メンバーの削除に失敗しました" }, { status: 500 })
  }
}
