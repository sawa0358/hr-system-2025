/**
 * カード期限通知スケジューラーの初期化
 * サーバー起動時に自動実行される
 */

import { startCardReminderScheduler } from './card-reminder-scheduler'

// 本番環境または自動実行が有効な場合のみ開始
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const shouldStart =
  !isNextBuildPhase &&
  (process.env.NODE_ENV === 'production' ||
    process.env.AUTO_START_CARD_REMINDER_SCHEDULER === 'true')

if (shouldStart) {
  console.log('[InitCardReminderScheduler] カード期限通知スケジューラーを開始します')
  startCardReminderScheduler()
} else {
  console.log('[InitCardReminderScheduler] カード期限通知スケジューラーはスキップされました (NODE_ENV:', process.env.NODE_ENV, ', AUTO_START_CARD_REMINDER_SCHEDULER:', process.env.AUTO_START_CARD_REMINDER_SCHEDULER, ')')
}


