import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkCardPermissions, checkWorkspacePermissions } from "@/lib/permissions"

// GET /api/cards/[cardId] - カード詳細を取得
export async function GET(request: NextRequest, { params }: { params: { cardId: string } }) {
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

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
        list: true,
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
                employeeType: true,
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // ワークスペースのアクセス権限チェック
    const workspaceMemberIds = card.board.workspace.members.map((m) => m.employeeId)
    const workspacePerms = checkWorkspacePermissions(
      userRole,
      userId,
      card.board.workspace.createdBy,
      workspaceMemberIds,
    )

    if (!workspacePerms.canView) {
      return NextResponse.json({ error: "このカードを表示する権限がありません" }, { status: 403 })
    }

    // カードの権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    return NextResponse.json({ card, permissions: cardPerms })
  } catch (error) {
    console.error("[v0] Error fetching card:", error)
    return NextResponse.json({ error: "カードの取得に失敗しました" }, { status: 500 })
  }
}

// PATCH /api/cards/[cardId] - カードを更新
export async function PATCH(request: NextRequest, { params }: { params: { cardId: string } }) {
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

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        members: true,
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードの編集権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canEdit) {
      return NextResponse.json(
        { error: cardPerms.reason || "カードを編集する権限がありません" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { title, description, dueDate, priority, status, labels, checklists, cardColor, isArchived, members, attachments, listId, position } = body

    // リストIDの更新処理
    let newListId = card.listId
    if (listId) {
      // 直接listIdが指定された場合（ドラッグ&ドロップ）
      newListId = listId
    } else if (status && status !== card.status) {
      // ステータスが変更された場合、対応するリストIDを取得
      const boardLists = await prisma.boardList.findMany({
        where: { boardId: card.boardId },
        select: { id: true, title: true }
      })
      
      // ステータスとリストタイトルのマッピング
      const statusToTitleMap: Record<string, string> = {
        'todo': '未着手',
        'in-progress': '進行中',
        'review': 'レビュー',
        'done': '完了'
      }
      
      const targetTitle = statusToTitleMap[status] || status
      const targetList = boardLists.find(list => list.title === targetTitle)
      if (targetList) {
        newListId = targetList.id
      }
    }

    // トランザクションでカードとメンバーを更新
    const updatedCard = await prisma.$transaction(async (tx) => {
      // メンバーの更新処理
      if (members !== undefined) {
        // 既存のメンバーを削除
        await tx.cardMember.deleteMany({
          where: { cardId: params.cardId },
        })

        // 新しいメンバーを追加（存在する従業員IDのみ）
        if (members && members.length > 0) {
          // 有効な従業員IDを検証
          const validMemberIds = []
          for (const member of members) {
            if (member.id) {
              const employeeExists = await tx.employee.findUnique({
                where: { id: member.id },
                select: { id: true }
              })
              if (employeeExists) {
                validMemberIds.push(member.id)
              } else {
                console.warn(`Invalid employee ID: ${member.id}`)
              }
            }
          }

          // 有効なメンバーのみ追加
          if (validMemberIds.length > 0) {
            await tx.cardMember.createMany({
              data: validMemberIds.map((employeeId: string) => ({
                cardId: params.cardId,
                employeeId: employeeId,
                addedBy: userId,
              })),
            })
          }
        }
      }

      // カードを更新
      return await tx.card.update({
        where: { id: params.cardId },
        data: {
          title: title || undefined,
          description: description || undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority: priority || undefined,
          status: status || undefined,
          listId: newListId, // リストIDも更新
          position: position !== undefined ? position : undefined,
          labels: labels !== undefined ? labels : undefined,
          checklists: checklists !== undefined ? checklists : undefined,
          attachments: attachments !== undefined ? attachments : undefined,
          cardColor: cardColor !== null && cardColor !== "" ? cardColor : null,
          isArchived: isArchived !== undefined ? isArchived : undefined,
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
    })

    return NextResponse.json({ card: updatedCard })
  } catch (error) {
    console.error("[v0] Error updating card:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cardId: params.cardId,
      userId: request.headers.get("x-employee-id")
    })
    return NextResponse.json({ 
      error: "カードの更新に失敗しました",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId] - カードを削除
export async function DELETE(request: NextRequest, { params }: { params: { cardId: string } }) {
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

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        members: true,
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードの削除権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canDelete) {
      return NextResponse.json({ error: "カードを削除する権限がありません" }, { status: 403 })
    }

    await prisma.card.delete({
      where: { id: params.cardId },
    })

    return NextResponse.json({ message: "カードを削除しました" })
  } catch (error) {
    console.error("[v0] Error deleting card:", error)
    return NextResponse.json({ error: "カードの削除に失敗しました" }, { status: 500 })
  }
}

