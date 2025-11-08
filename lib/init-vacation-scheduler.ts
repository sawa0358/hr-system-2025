/**
 * 有給管理スケジューラーの初期化
 * サーバー起動時に自動実行される
 */

import { startVacationScheduler } from './vacation-scheduler'

// 本番環境または自動実行が有効な場合のみ開始
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const shouldStart =
  !isNextBuildPhase &&
  (process.env.NODE_ENV === 'production' ||
    process.env.AUTO_START_VACATION_SCHEDULER === 'true')

if (shouldStart) {
  console.log('[InitVacationScheduler] 有給管理スケジューラーを開始します')
  startVacationScheduler()
} else {
  console.log('[InitVacationScheduler] 有給管理スケジューラーはスキップされました (NODE_ENV:', process.env.NODE_ENV, ', AUTO_START_VACATION_SCHEDULER:', process.env.AUTO_START_VACATION_SCHEDULER, ')')
}

