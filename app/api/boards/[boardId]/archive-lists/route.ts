import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkWorkspacePermissions, checkBoardPermissions } from "@/lib/permissions"

// GET /api/boards/[boardId]/archive-lists - アーカイブリスト一覧を取得
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

    // アーカイブリストを取得（最新10個）
    const archiveLists = await prisma.boardList.findMany({
      where: {
        boardId: params.boardId,
        name: {
          startsWith: "アーカイブ"
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        cards: {
          where: { isArchived: true },
          orderBy: { updatedAt: "desc" },
          take: 200, // 横10個×縦20段 = 200個まで
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
        },
      },
    })

    return NextResponse.json({ archiveLists })
  } catch (error) {
    console.error("Error fetching archive lists:", error)
    return NextResponse.json({ error: "アーカイブリストの取得に失敗しました" }, { status: 500 })
  }
}

// POST /api/boards/[boardId]/archive-lists - 新しいアーカイブリストを作成
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

    // 既存のアーカイブリスト数を確認
    const existingArchiveLists = await prisma.boardList.count({
      where: {
        boardId: params.boardId,
        name: {
          startsWith: "アーカイブ"
        }
      },
    })

    // 最大10個のアーカイブリストを維持
    if (existingArchiveLists >= 10) {
      // 最も古いアーカイブリストを削除
      const oldestArchiveList = await prisma.boardList.findFirst({
        where: {
          boardId: params.boardId,
          name: {
            startsWith: "アーカイブ"
          }
        },
        orderBy: { createdAt: "asc" },
      })

      if (oldestArchiveList) {
        // 古いアーカイブリストのカードを削除
        await prisma.card.deleteMany({
          where: { listId: oldestArchiveList.id },
        })

        // 古いアーカイブリストを削除
        await prisma.boardList.delete({
          where: { id: oldestArchiveList.id },
        })
      }
    }

    // 新しいアーカイブリストを作成
    const newArchiveList = await prisma.boardList.create({
      data: {
        boardId: params.boardId,
        name: `アーカイブ ${new Date().toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        })}`,
        position: existingArchiveLists,
      },
    })

    return NextResponse.json({ archiveList: newArchiveList }, { status: 201 })
  } catch (error) {
    console.error("Error creating archive list:", error)
    return NextResponse.json({ error: "アーカイブリストの作成に失敗しました" }, { status: 500 })
  }
}
