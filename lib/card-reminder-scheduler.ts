/**
 * カード期限通知の自動実行スケジューラー
 * 期限3日前の通知を定期実行
 */

import { prisma } from './prisma'
import { sendMail } from './mail'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'

let reminderIntervalId: NodeJS.Timeout | null = null
let isRunning = false

/**
 * カード期限通知を実行
 */
async function executeCardReminders(): Promise<void> {
  try {
    console.log('[CardReminderScheduler] カード期限通知を実行中...')
    
    // 3日後の日付範囲を取得（00:00:00 ~ 23:59:59）
    const threeDaysLater = addDays(new Date(), 3)
    const startDate = startOfDay(threeDaysLater)
    const endDate = endOfDay(threeDaysLater)

    console.log('[CardReminderScheduler] 対象期限:', {
      start: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
      end: format(endDate, 'yyyy-MM-dd HH:mm:ss'),
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

    console.log(`[CardReminderScheduler] ${cards.length}件のカードが見つかりました`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    // 各カードについて通知を送信
    for (const card of cards) {
      const recipientEmails = card.members
        .map((member) => member.employee?.email)
        .filter((email): email is string => Boolean(email))

      if (recipientEmails.length === 0) {
        console.warn(`[CardReminderScheduler] カード「${card.title}」にメールアドレスを持つメンバーがいません`)
        skipCount++
        continue
      }

      const dueDateLabel = card.dueDate ? format(card.dueDate, 'yyyy年MM月dd日') : '未設定'

      const subject = `【期限3日前】タスク「${card.title}」の期限が近づいています`
      const textBody = [
        '担当者各位',
        '',
        `タスク「${card.title}」の期限が3日後に迫っています。`,
        `締切日：${dueDateLabel}`,
        card.board?.name ? `ボード：${card.board.name}` : undefined,
        card.list?.title ? `現在のリスト：${card.list.title}` : undefined,
        '',
        '進捗状況を確認し、必要に応じて対応をお願いします。',
        '詳細はHRシステムのタスク管理画面で確認してください。',
        'https://hr-system-2025-33b161f586cd.herokuapp.com/tasks',
      ]
        .filter(Boolean)
        .join('\n')

      const htmlBody = [
        '<p>担当者各位</p>',
        `<p><strong>タスク「${card.title}」の期限が3日後に迫っています。</strong></p>`,
        `<p>締切日：<strong style="color: #d32f2f;">${dueDateLabel}</strong></p>`,
        card.board?.name ? `<p>ボード：${card.board.name}</p>` : '',
        card.list?.title ? `<p>現在のリスト：${card.list.title}</p>` : '',
        '<p>進捗状況を確認し、必要に応じて対応をお願いします。</p>',
        '<p>詳細はHRシステムのタスク管理画面で確認してください。</p>',
        '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/tasks">https://hr-system-2025-33b161f586cd.herokuapp.com/tasks</a></p>',
      ].join('')

      const mailResult = await sendMail({
        to: recipientEmails,
        subject,
        text: textBody,
        html: htmlBody,
      })

      if (mailResult.success) {
        console.log(`[CardReminderScheduler] カード「${card.title}」の通知を送信しました (${recipientEmails.length}名)`)
        successCount++
      } else if (mailResult.skipped) {
        console.warn(`[CardReminderScheduler] カード「${card.title}」の通知をスキップしました (SMTP未設定)`)
        skipCount++
      } else {
        console.error(`[CardReminderScheduler] カード「${card.title}」の通知送信に失敗しました:`, mailResult.error)
        errorCount++
      }
    }

    console.log(`[CardReminderScheduler] カード期限通知完了: ${cards.length}件処理 (成功: ${successCount}, スキップ: ${skipCount}, エラー: ${errorCount})`)
  } catch (error) {
    console.error('[CardReminderScheduler] カード期限通知エラー:', error)
  }
}

/**
 * スケジューラーを開始
 */
export function startCardReminderScheduler(): void {
  if (isRunning) {
    console.log('[CardReminderScheduler] スケジューラーは既に実行中です')
    return
  }

  console.log('[CardReminderScheduler] スケジューラーを開始します')

  // カード期限通知: 毎日9:00に実行
  const now = new Date()
  const today9am = new Date(now)
  today9am.setHours(9, 0, 0, 0)
  
  let msUntil9am: number
  if (now >= today9am) {
    // 既に今日の9:00を過ぎている場合、明日の9:00まで待つ
    const tomorrow9am = new Date(today9am)
    tomorrow9am.setDate(tomorrow9am.getDate() + 1)
    msUntil9am = tomorrow9am.getTime() - now.getTime()
  } else {
    // 今日の9:00まで待つ
    msUntil9am = today9am.getTime() - now.getTime()
  }

  const oneDayMs = 24 * 60 * 60 * 1000

  // 初回実行（9:00）
  setTimeout(() => {
    executeCardReminders()
    // 以降は毎日9:00に実行
    reminderIntervalId = setInterval(executeCardReminders, oneDayMs)
  }, msUntil9am)

  isRunning = true
  console.log('[CardReminderScheduler] スケジューラーを開始しました')
  console.log(`[CardReminderScheduler] 初回実行は今日/明日9:00 (${msUntil9am}ms後)`)
}

/**
 * スケジューラーを停止
 */
export function stopCardReminderScheduler(): void {
  if (!isRunning) {
    console.log('[CardReminderScheduler] スケジューラーは実行されていません')
    return
  }

  if (reminderIntervalId) {
    clearInterval(reminderIntervalId)
    reminderIntervalId = null
  }

  isRunning = false
  console.log('[CardReminderScheduler] スケジューラーを停止しました')
}

/**
 * スケジューラーの状態を取得
 */
export function getCardReminderSchedulerStatus(): {
  isRunning: boolean
  nextRun: string | null
} {
  return {
    isRunning,
    nextRun: reminderIntervalId ? '毎日9:00' : null,
  }
}

/**
 * 手動でカード期限通知を実行
 */
export async function runCardRemindersManually(): Promise<void> {
  await executeCardReminders()
}

