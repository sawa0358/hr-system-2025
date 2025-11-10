import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkCardPermissions, checkWorkspacePermissions } from "@/lib/permissions"
import { sendMail } from "@/lib/mail"
import { format } from "date-fns"

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
        list: {
          select: {
            id: true,
            title: true,
          },
        },
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

    const previousListId = card.listId
    const previousListTitle = card.list?.title
    const wasArchived = card.isArchived

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
    const { title, description, dueDate, priority, labels, members, attachments, listId, position, status, checklists, cardColor, isArchived } = body

    // リストIDの更新処理
    let newListId = card.listId
    if (listId) {
      // 直接listIdが指定された場合（ドラッグ&ドロップ）
      newListId = listId
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
              })),
            })
          }
        }
      }

      // カードを更新
      return await tx.card.update({
        where: { id: params.cardId },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority: priority !== undefined ? priority : undefined,
          list: newListId ? { connect: { id: newListId } } : undefined, // リストIDも更新
          position: position !== undefined ? position : undefined,
          labels: labels !== undefined ? labels : undefined,
          attachments: attachments !== undefined ? attachments : undefined,
          checklists: checklists !== undefined ? checklists : undefined,
          // 追加フィールド（存在する場合のみ更新）
          status: status !== undefined ? status : undefined,
          cardColor: cardColor !== undefined ? cardColor : undefined,
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
          list: {
            select: {
              id: true,
              title: true,
            },
          },
          board: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    })

    // カードの状態変化に応じたメール通知
    const dueDateLabel = updatedCard.dueDate ? format(updatedCard.dueDate, "yyyy年MM月dd日") : "未設定"
    const recipientEmails = updatedCard.members
      .map((member) => member.employee?.email)
      .filter((email): email is string => Boolean(email))

    if (recipientEmails.length > 0) {
      const notifications: Array<{ subject: string; text: string; html: string }> = []

      const movedToDone =
        previousListId !== updatedCard.listId &&
        (updatedCard.list?.title?.includes("完了") || updatedCard.list?.title === "done" || updatedCard.list?.title === "Done")

      if (movedToDone) {
        const subject = `タスク「${updatedCard.title}」が完了リストに移動しました`
        const textLines = [
          "担当者各位",
          "",
          `タスク「${updatedCard.title}」が「${updatedCard.list?.title ?? "完了"}」リストに移動されました。`,
          `締切日：${dueDateLabel}`,
          updatedCard.board?.name ? `ボード：${updatedCard.board.name}` : undefined,
          previousListTitle ? `移動元リスト：${previousListTitle}` : undefined,
          "",
          "詳細はHRシステムのタスク管理画面で確認してください。",
        ].filter(Boolean)

        const htmlLines = [
          "<p>担当者各位</p>",
          `<p>タスク「${updatedCard.title}」が「${updatedCard.list?.title ?? "完了"}」リストに移動されました。</p>`,
          `<p>締切日：<strong>${dueDateLabel}</strong></p>`,
          updatedCard.board?.name ? `<p>ボード：${updatedCard.board.name}</p>` : "",
          previousListTitle ? `<p>移動元リスト：${previousListTitle}</p>` : "",
          "<p>詳細はHRシステムのタスク管理画面で確認してください。</p>",
        ]

        notifications.push({
          subject,
          text: textLines.join("\n"),
          html: htmlLines.join(""),
        })
      }

      const archivedNow = !wasArchived && updatedCard.isArchived

      if (archivedNow) {
        const subject = `タスク「${updatedCard.title}」がアーカイブされました`
        const textLines = [
          "担当者各位",
          "",
          `タスク「${updatedCard.title}」がアーカイブされました。`,
          `締切日：${dueDateLabel}`,
          updatedCard.board?.name ? `ボード：${updatedCard.board.name}` : undefined,
          updatedCard.list?.title ? `最終リスト：${updatedCard.list.title}` : undefined,
          "",
          "必要に応じてアーカイブ一覧から詳細を確認してください。",
        ].filter(Boolean)

        const htmlLines = [
          "<p>担当者各位</p>",
          `<p>タスク「${updatedCard.title}」がアーカイブされました。</p>`,
          `<p>締切日：<strong>${dueDateLabel}</strong></p>`,
          updatedCard.board?.name ? `<p>ボード：${updatedCard.board.name}</p>` : "",
          updatedCard.list?.title ? `<p>最終リスト：${updatedCard.list.title}</p>` : "",
          "<p>必要に応じてアーカイブ一覧から詳細を確認してください。</p>",
        ]

        notifications.push({
          subject,
          text: textLines.join("\n"),
          html: htmlLines.join(""),
        })
      }

      for (const notification of notifications) {
        const mailResult = await sendMail({
          to: recipientEmails,
          subject: notification.subject,
          text: notification.text,
          html: notification.html,
        })

        if (!mailResult.success && !mailResult.skipped) {
          console.error("[v0] カード通知メールの送信に失敗しました:", {
            cardId: updatedCard.id,
            subject: notification.subject,
            error: mailResult.error,
          })
        }
      }
    } else if (
      (previousListId !== updatedCard.listId &&
        (updatedCard.list?.title?.includes("完了") ||
          updatedCard.list?.title === "done" ||
          updatedCard.list?.title === "Done")) ||
      (!wasArchived && updatedCard.isArchived)
    ) {
      console.warn("[v0] 通知対象のメールアドレスが見つからないため通知をスキップしました:", {
        cardId: updatedCard.id,
      })
    }

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

