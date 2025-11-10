import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mail"
import { format, addDays, startOfDay, endOfDay } from "date-fns"

/**
 * カードの期限3日前通知を送信するCronエンドポイント
 * 
 * 使用方法:
 * 1. Heroku Schedulerで毎日実行
 * 2. 外部Cronサービス（cron-job.org等）で毎日実行
 * 
 * エンドポイント: POST /api/cron/card-reminders
 * 認証: CRON_SECRET_TOKENヘッダーまたはクエリパラメータ
 */
export async function POST(request: NextRequest) {
  try {
    // Cron認証トークンの検証
    const authHeader = request.headers.get("authorization")
    const tokenFromQuery = request.nextUrl.searchParams.get("token")
    const cronSecretToken = process.env.CRON_SECRET_TOKEN

    if (cronSecretToken) {
      const providedToken = authHeader?.replace("Bearer ", "") || tokenFromQuery

      if (providedToken !== cronSecretToken) {
        console.warn("[Cron] 不正なトークンでのアクセス試行")
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
      }
    }

    console.log("[Cron] カード期限通知処理を開始します")

    // 3日後の日付範囲を取得（00:00:00 ~ 23:59:59）
    const threeDaysLater = addDays(new Date(), 3)
    const startDate = startOfDay(threeDaysLater)
    const endDate = endOfDay(threeDaysLater)

    console.log("[Cron] 対象期限:", {
      start: format(startDate, "yyyy-MM-dd HH:mm:ss"),
      end: format(endDate, "yyyy-MM-dd HH:mm:ss"),
    })

    // 3日後が期限のカードを取得（アーカイブされていないもののみ）
    const cards = await prisma.card.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        isArchived: false,
      },
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
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

    console.log(`[Cron] ${cards.length}件のカードが見つかりました`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    // 各カードについて通知を送信
    for (const card of cards) {
      const recipientEmails = card.members
        .map((member) => member.employee?.email)
        .filter((email): email is string => Boolean(email))

      if (recipientEmails.length === 0) {
        console.warn(`[Cron] カード「${card.title}」にメールアドレスを持つメンバーがいません`)
        skipCount++
        continue
      }

      const dueDateLabel = card.dueDate ? format(card.dueDate, "yyyy年MM月dd日") : "未設定"

      const subject = `【期限3日前】タスク「${card.title}」の期限が近づいています`
      const textBody = [
        "担当者各位",
        "",
        `タスク「${card.title}」の期限が3日後に迫っています。`,
        `締切日：${dueDateLabel}`,
        card.board?.name ? `ボード：${card.board.name}` : undefined,
        card.list?.title ? `現在のリスト：${card.list.title}` : undefined,
        "",
        "進捗状況を確認し、必要に応じて対応をお願いします。",
        "詳細はHRシステムのタスク管理画面で確認してください。",
      ]
        .filter(Boolean)
        .join("\n")

      const htmlBody = [
        "<p>担当者各位</p>",
        `<p><strong>タスク「${card.title}」の期限が3日後に迫っています。</strong></p>`,
        `<p>締切日：<strong style="color: #d32f2f;">${dueDateLabel}</strong></p>`,
        card.board?.name ? `<p>ボード：${card.board.name}</p>` : "",
        card.list?.title ? `<p>現在のリスト：${card.list.title}</p>` : "",
        "<p>進捗状況を確認し、必要に応じて対応をお願いします。</p>",
        "<p>詳細はHRシステムのタスク管理画面で確認してください。</p>",
      ].join("")

      const mailResult = await sendMail({
        to: recipientEmails,
        subject,
        text: textBody,
        html: htmlBody,
      })

      if (mailResult.success) {
        console.log(`[Cron] カード「${card.title}」の通知を送信しました (${recipientEmails.length}名)`)
        successCount++
      } else if (mailResult.skipped) {
        console.warn(`[Cron] カード「${card.title}」の通知をスキップしました (SMTP未設定)`)
        skipCount++
      } else {
        console.error(`[Cron] カード「${card.title}」の通知送信に失敗しました:`, mailResult.error)
        errorCount++
      }
    }

    const result = {
      success: true,
      processed: cards.length,
      sent: successCount,
      skipped: skipCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    }

    console.log("[Cron] カード期限通知処理が完了しました:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Cron] カード期限通知処理でエラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// GETメソッドでも実行可能（ブラウザからのテスト用）
export async function GET(request: NextRequest) {
  return POST(request)
}

