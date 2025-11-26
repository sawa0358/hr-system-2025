import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mail"
import { format } from "date-fns"
import { checkCardPermissions } from "@/lib/permissions"

// POST /api/cards/[cardId]/members - カードにメンバーを追加
export async function POST(request: NextRequest, { params }: { params: { cardId: string } }) {
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
            title: true,
          },
        },
        board: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードのメンバー追加権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canAddMembers) {
      return NextResponse.json(
        { error: "メンバーを追加する権限がありません。サブマネージャー以上のみ追加できます。" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ error: "社員IDは必須です" }, { status: 400 })
    }

    // すでにメンバーかチェック
    const existingMember = await prisma.cardMember.findUnique({
      where: {
        cardId_employeeId: {
          cardId: params.cardId,
          employeeId,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "このユーザーはすでにメンバーです" }, { status: 400 })
    }

    const member = await prisma.cardMember.create({
      data: {
        cardId: params.cardId,
        employeeId,
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

    // メール通知（カードに新メンバーが追加された時）
    const recipientEmail = member.employee?.email
    if (recipientEmail) {
      const formattedDueDate = card.dueDate
        ? format(card.dueDate, "yyyy年MM月dd日")
        : "未設定"

      const subject = `名称：${card.title}のタスクにメンバー追加されました`
      const textBody = [
        `${member.employee.name}さん`,
        "",
        `タスク「${card.title}」にメンバーとして追加されました。`,
        `締切日：${formattedDueDate}`,
        card.board?.name ? `ボード：${card.board.name}` : undefined,
        card.list?.title ? `リスト：${card.list.title}` : undefined,
        "",
        "タスクの詳細はHRシステムのタスク管理から確認できます。",
        "https://hr-system-2025-33b161f586cd.herokuapp.com/tasks",
      ]
        .filter(Boolean)
        .join("\n")

      const htmlBody = [
        `<p>${member.employee.name}さん</p>`,
        `<p>タスク「${card.title}」にメンバーとして追加されました。</p>`,
        `<p>締切日：<strong>${formattedDueDate}</strong></p>`,
        card.board?.name ? `<p>ボード：${card.board.name}</p>` : "",
        card.list?.title ? `<p>リスト：${card.list.title}</p>` : "",
        "<p>タスクの詳細はHRシステムのタスク管理から確認できます。</p>",
        '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/tasks">https://hr-system-2025-33b161f586cd.herokuapp.com/tasks</a></p>',
      ].join("")

      const mailResult = await sendMail({
        to: recipientEmail,
        subject,
        text: textBody,
        html: htmlBody,
      })

      if (!mailResult.success && !mailResult.skipped) {
        console.error("[v0] メール送信に失敗しました:", mailResult.error)
      }
    } else {
      console.warn("[v0] メールアドレスが設定されていないため通知をスキップしました:", {
        employeeId: member.employee?.id,
      })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding card member:", error)
    return NextResponse.json({ error: "メンバーの追加に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId]/members/[memberId] - カードからメンバーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string; memberId: string } },
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

    const card = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: {
        members: true,
      },
    })

    if (!card) {
      return NextResponse.json({ error: "カードが見つかりません" }, { status: 404 })
    }

    // カードのメンバー削除権限チェック
    const cardMemberIds = card.members.map((m) => m.employeeId)
    const cardPerms = checkCardPermissions(userRole, userId, card.createdBy, cardMemberIds)

    if (!cardPerms.canAddMembers) {
      return NextResponse.json({ error: "メンバーを削除する権限がありません。サブマネージャー以上のみ削除できます。" }, { status: 403 })
    }

    await prisma.cardMember.delete({
      where: {
        id: params.memberId,
      },
    })

    return NextResponse.json({ message: "メンバーを削除しました" })
  } catch (error) {
    console.error("[v0] Error removing card member:", error)
    return NextResponse.json({ error: "メンバーの削除に失敗しました" }, { status: 500 })
  }
}

