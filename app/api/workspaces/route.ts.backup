import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, getPermissions } from "@/lib/permissions"

// GET /api/workspaces - ワークスペース一覧を取得
export async function GET(request: NextRequest) {
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

    // 管理者のみ全ワークスペースを取得
    if (permissions.viewAllWorkspaces) {
      const workspaces = await prisma.workspace.findMany({
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
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              boards: true,
              members: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      })

      return NextResponse.json({ workspaces })
    }

    // 一般ユーザーは自分がメンバーのワークスペースのみ取得
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            employeeId: userId,
          },
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
                position: true,
              },
            },
          },
        },
        boards: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            boards: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error("[v0] Error fetching workspaces:", error)
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
      return NextResponse.json({ error: "ワークスペース作成の権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, memberIds = [] } = body

    if (!name) {
      return NextResponse.json({ error: "ワークスペース名は必須です" }, { status: 400 })
    }

    // 指定されたメンバーIDが存在するかチェック
    if (memberIds.length > 0) {
      const existingEmployees = await prisma.employee.findMany({
        where: {
          id: { in: memberIds }
        },
        select: { id: true, name: true }
      })
      
      const existingIds = existingEmployees.map(emp => emp.id)
      const invalidIds = memberIds.filter((id: string) => !existingIds.includes(id))
      
      if (invalidIds.length > 0) {
        return NextResponse.json({ 
          error: `無効なメンバーID: ${invalidIds.join(', ')}` 
        }, { status: 400 })
      }
    }

    // ワークスペースを作成（作成者を自動的にメンバーに追加）
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        createdBy: userId,
        members: {
          create: [
            {
              employeeId: userId,
              role: "workspace_admin",
            },
            ...memberIds
              .filter((id: string) => id !== userId)
              .map((employeeId: string) => ({
                employeeId,
                role: "workspace_member",
              })),
          ],
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
                position: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating workspace:", error)
    
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      // Prismaエラーの詳細を表示
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ 
          error: "データベースの制約エラーが発生しました。指定されたメンバーが存在しない可能性があります。" 
        }, { status: 400 })
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: "データベースの一意制約エラーが発生しました。" 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: "ワークスペースの作成に失敗しました",
      details: error instanceof Error ? error.message : "不明なエラー"
    }, { status: 500 })
  }
}

