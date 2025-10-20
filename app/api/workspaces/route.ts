import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, getPermissions } from "@/lib/permissions"

// GET /api/workspaces - ワークスペース一覧を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-employee-id")
    console.log("[v0] /api/workspaces GET - x-employee-id:", userId)
    
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any

    const permissions = getPermissions(userRole)

    // 管理者のみ全ワークスペースを取得
    if (permissions.viewAllWorkspaces) {
      try {
        // まずは最小限のフィールドで取得（環境差異の切り分け用）
        const minimal = await prisma.workspace.findMany({
          select: { id: true, name: true, createdBy: true },
          orderBy: { createdAt: "desc" },
        })
        console.log("[v0] /api/workspaces minimal count:", minimal.length)

        // 詳細情報を付与
        const workspaces = await prisma.workspace.findMany({
          include: {
            creator: { select: { id: true, name: true } },
            members: {
              include: { employee: { select: { id: true, name: true } } },
            },
            _count: { select: { boards: true, members: true } },
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json({ workspaces })
      } catch (innerError) {
        console.error("[v0] /api/workspaces admin query failed, fallback to minimal:", innerError)
        const workspaces = await prisma.workspace.findMany({
          select: { id: true, name: true, createdBy: true },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json({ workspaces })
      }
    }

    // 一般ユーザーは所属ワークスペースのみ取得
    const workspaces = await prisma.workspace.findMany({
      where: { members: { some: { employeeId: userId } } },
      select: { id: true, name: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error("[v0] Error fetching workspaces:", (error as any)?.message || error)
    return NextResponse.json({ error: "ワークスペースの取得に失敗しました" }, { status: 500 })
  }
}

// POST /api/workspaces - 新しいワークスペースを作成
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-employee-id")
    
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any
    const permissions = getPermissions(userRole)

    if (!permissions.createWorkspace) {
      return NextResponse.json({ error: "ワークスペースを作成する権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, memberIds = [] } = body

    if (!name) {
      return NextResponse.json({ error: "ワークスペース名は必須です" }, { status: 400 })
    }

    // ワークスペースを作成
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description: description || "",
        createdBy: userId,
        members: {
          create: [
            // 作成者を自動的にメンバーに追加
            {
              employeeId: userId,
              role: "admin",
            },
            // 指定されたメンバーを追加
            ...memberIds.map((memberId: string) => ({
              employeeId: memberId,
              role: "member" as const,
            })),
          ],
        },
      },
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
              },
            },
          },
        },
        _count: {
          select: {
            boards: true,
            members: true,
          },
        },
      },
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating workspace:", error)
    return NextResponse.json({ error: "ワークスペースの作成に失敗しました" }, { status: 500 })
  }
}
