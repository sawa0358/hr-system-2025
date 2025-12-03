import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { loadAppConfig } from "@/lib/vacation-config"
import { getNextGrantDate, getPreviousGrantDate } from "@/lib/vacation-grant-lot"
import { sendMail } from "@/lib/mail"
import { format } from "date-fns"

/**
 * Cronエンドポイント: 新付与日到来時の申請通知
 * 
 * 毎日実行して、今日が新付与日の社員で以下の申請がある場合に通知を送る：
 * - PENDING（承認待ち）→ 上司に通知
 * - APPROVED + finalizedBy=null（決済待ち）→ 管理者・総務に通知
 * 
 * 実行タイミング: 毎日午前9時（JST）推奨
 * 保護: Authorization ヘッダーまたは query parameter でトークン確認
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（簡易版: 環境変数でトークンを設定）
    const authHeader = request.headers.get("authorization")
    const authToken = request.nextUrl.searchParams.get("token")
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}` && authToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // アクティブな社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        joinDate: true,
        configVersion: true,
      },
    })

    const results: Array<{
      employeeId: string
      employeeName: string
      grantDate: string
      notifications: Array<{
        type: 'pending' | 'finalization'
        requestId: string
        recipientEmail: string
        sent: boolean
        error?: string
      }>
    }> = []

    let pendingNotificationCount = 0
    let finalizationNotificationCount = 0

    // 管理者・総務のメールアドレスを事前に取得
    const hrAndAdmins = await prisma.employee.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'hr' },
        ],
        email: { not: null },
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })
    const hrAndAdminEmails = hrAndAdmins
      .map(u => u.email)
      .filter((email): email is string => Boolean(email))

    for (const emp of employees) {
      try {
        const cfg = await loadAppConfig(emp.configVersion || undefined)
        
        // 今日が新付与日かどうかをチェック
        const previousGrant = getPreviousGrantDate(emp.joinDate, cfg, today)
        
        if (!previousGrant) {
          continue // まだ初回付与前
        }

        // 今日が新付与日かどうか（前日までの付与日と比較）
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const previousGrantYesterday = getPreviousGrantDate(emp.joinDate, cfg, yesterday)
        
        // 今日の付与日と昨日の付与日が異なる = 今日が新付与日
        const isTodayGrantDate = !previousGrantYesterday || 
          previousGrant.getTime() !== previousGrantYesterday.getTime()

        if (!isTodayGrantDate) {
          continue // 今日は新付与日ではない
        }

        // この社員の申請中・決済待ちの申請を取得
        const pendingRequests = await prisma.timeOffRequest.findMany({
          where: {
            employeeId: emp.id,
            status: 'PENDING',
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalDays: true,
            reason: true,
            supervisorId: true,
          },
        })

        const finalizationRequests = await prisma.timeOffRequest.findMany({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            approvedBy: { not: null },
            finalizedBy: null,
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalDays: true,
            reason: true,
            approvedBy: true,
          },
        })

        if (pendingRequests.length === 0 && finalizationRequests.length === 0) {
          continue // 通知対象の申請なし
        }

        const employeeResult: typeof results[0] = {
          employeeId: emp.id,
          employeeName: emp.name,
          grantDate: previousGrant.toISOString().slice(0, 10),
          notifications: [],
        }

        // 承認待ち申請の通知（上司へ）
        for (const req of pendingRequests) {
          if (!req.supervisorId) {
            employeeResult.notifications.push({
              type: 'pending',
              requestId: req.id,
              recipientEmail: '(上司未設定)',
              sent: false,
              error: '上司が設定されていません',
            })
            continue
          }

          // 上司の情報を取得
          const supervisor = await prisma.employee.findUnique({
            where: { id: req.supervisorId },
            select: { name: true, email: true },
          })

          if (!supervisor?.email) {
            employeeResult.notifications.push({
              type: 'pending',
              requestId: req.id,
              recipientEmail: '(メールなし)',
              sent: false,
              error: '上司のメールアドレスが設定されていません',
            })
            continue
          }

          // メール送信
          const formattedStart = format(req.startDate, 'yyyy年MM月dd日')
          const formattedEnd = format(req.endDate, 'yyyy年MM月dd日')
          const grantDateStr = format(previousGrant, 'yyyy年MM月dd日')

          const subject = `【有給申請リマインド】${emp.name}さんの有給申請が承認待ちです`
          const textBody = [
            `${supervisor.name}さん`,
            '',
            `${emp.name}さんの有給申請が承認待ちです。`,
            `本日（${grantDateStr}）は${emp.name}さんの新付与日です。`,
            '',
            `期間：${formattedStart} 〜 ${formattedEnd}`,
            `日数：${req.totalDays ? Number(req.totalDays) : '-'}日`,
            req.reason ? `理由：${req.reason}` : undefined,
            '',
            '承認処理をお願いします。',
            'https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin',
          ].filter(Boolean).join('\n')

          const htmlBody = [
            `<p>${supervisor.name}さん</p>`,
            `<p><strong>${emp.name}さんの有給申請が承認待ちです。</strong></p>`,
            `<p>本日（${grantDateStr}）は${emp.name}さんの新付与日です。</p>`,
            `<p>期間：${formattedStart} 〜 ${formattedEnd}</p>`,
            `<p>日数：<strong>${req.totalDays ? Number(req.totalDays) : '-'}日</strong></p>`,
            req.reason ? `<p>理由：${req.reason}</p>` : '',
            '<p>承認処理をお願いします。</p>',
            '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin">https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin</a></p>',
          ].join('')

          try {
            const mailResult = await sendMail({
              to: supervisor.email,
              subject,
              text: textBody,
              html: htmlBody,
            })

            employeeResult.notifications.push({
              type: 'pending',
              requestId: req.id,
              recipientEmail: supervisor.email,
              sent: mailResult.success || false,
              error: mailResult.error,
            })

            if (mailResult.success) {
              pendingNotificationCount++
            }
          } catch (mailError: any) {
            employeeResult.notifications.push({
              type: 'pending',
              requestId: req.id,
              recipientEmail: supervisor.email,
              sent: false,
              error: mailError?.message || 'メール送信エラー',
            })
          }
        }

        // 決済待ち申請の通知（管理者・総務へ）
        for (const req of finalizationRequests) {
          if (hrAndAdminEmails.length === 0) {
            employeeResult.notifications.push({
              type: 'finalization',
              requestId: req.id,
              recipientEmail: '(管理者なし)',
              sent: false,
              error: '管理者・総務が設定されていません',
            })
            continue
          }

          // 承認者の情報を取得
          const approver = req.approvedBy ? await prisma.employee.findUnique({
            where: { id: req.approvedBy },
            select: { name: true },
          }) : null

          // メール送信
          const formattedStart = format(req.startDate, 'yyyy年MM月dd日')
          const formattedEnd = format(req.endDate, 'yyyy年MM月dd日')
          const grantDateStr = format(previousGrant, 'yyyy年MM月dd日')

          const subject = `【決済待ちリマインド】${emp.name}さんの有給申請が決済待ちです`
          const textBody = [
            '管理者・総務各位',
            '',
            `${emp.name}さんの有給申請が決済待ちです。`,
            `本日（${grantDateStr}）は${emp.name}さんの新付与日です。`,
            '',
            `期間：${formattedStart} 〜 ${formattedEnd}`,
            `日数：${req.totalDays ? Number(req.totalDays) : '-'}日`,
            req.reason ? `理由：${req.reason}` : undefined,
            approver ? `承認者：${approver.name}` : undefined,
            '',
            '決済処理をお願いします。',
            'https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin',
          ].filter(Boolean).join('\n')

          const htmlBody = [
            '<p>管理者・総務各位</p>',
            `<p><strong>${emp.name}さんの有給申請が決済待ちです。</strong></p>`,
            `<p>本日（${grantDateStr}）は${emp.name}さんの新付与日です。</p>`,
            `<p>期間：${formattedStart} 〜 ${formattedEnd}</p>`,
            `<p>日数：<strong>${req.totalDays ? Number(req.totalDays) : '-'}日</strong></p>`,
            req.reason ? `<p>理由：${req.reason}</p>` : '',
            approver ? `<p>承認者：${approver.name}</p>` : '',
            '<p>決済処理をお願いします。</p>',
            '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin">https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin</a></p>',
          ].join('')

          try {
            const mailResult = await sendMail({
              to: hrAndAdminEmails,
              subject,
              text: textBody,
              html: htmlBody,
            })

            employeeResult.notifications.push({
              type: 'finalization',
              requestId: req.id,
              recipientEmail: hrAndAdminEmails.join(', '),
              sent: mailResult.success || false,
              error: mailResult.error,
            })

            if (mailResult.success) {
              finalizationNotificationCount++
            }
          } catch (mailError: any) {
            employeeResult.notifications.push({
              type: 'finalization',
              requestId: req.id,
              recipientEmail: hrAndAdminEmails.join(', '),
              sent: false,
              error: mailError?.message || 'メール送信エラー',
            })
          }
        }

        if (employeeResult.notifications.length > 0) {
          results.push(employeeResult)
        }
      } catch (error: any) {
        console.error(`Failed to process employee ${emp.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: today.toISOString().slice(0, 10),
      summary: {
        employeesWithGrantDateToday: results.length,
        pendingNotificationsSent: pendingNotificationCount,
        finalizationNotificationsSent: finalizationNotificationCount,
      },
      results,
      message: `${results.length}名の社員に対して通知を送信しました（承認待ち: ${pendingNotificationCount}件、決済待ち: ${finalizationNotificationCount}件）`,
    })
  } catch (error: any) {
    console.error("Cron /api/cron/notify-pending error", error)
    return NextResponse.json(
      { error: "通知処理に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

// POSTでも対応（cronサービスによってはPOSTを要求する場合がある）
export async function POST(request: NextRequest) {
  return GET(request)
}





