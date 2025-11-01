/**
 * 有給管理の自動実行スケジューラー
 * 失効処理と自動付与を定期実行
 */

import { expireGrantLots } from './vacation-lot-generator'
import { generateGrantLotsForEmployee } from './vacation-lot-generator'
import { loadAppConfig } from './vacation-config'
import { getNextGrantDate } from './vacation-grant-lot'
import { prisma } from './prisma'

let expireIntervalId: NodeJS.Timeout | null = null
let grantIntervalId: NodeJS.Timeout | null = null
let isRunning = false

/**
 * 失効処理を実行
 */
async function executeExpire(): Promise<void> {
  try {
    console.log('[VacationScheduler] 失効処理を実行中...')
    const today = new Date()
    const expiredCount = await expireGrantLots(today)
    console.log(`[VacationScheduler] 失効処理完了: ${expiredCount}件のロットを失効処理しました`)
  } catch (error) {
    console.error('[VacationScheduler] 失効処理エラー:', error)
  }
}

/**
 * 自動付与処理を実行
 */
async function executeGrant(): Promise<void> {
  try {
    console.log('[VacationScheduler] 自動付与処理を実行中...')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 翌日を計算
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // アクティブな社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true,
        vacationPattern: true,
        employeeType: true,
        weeklyPattern: true,
      },
    })

    let totalGenerated = 0
    let totalUpdated = 0
    let processedCount = 0

    for (const emp of employees) {
      try {
        const cfg = await loadAppConfig(emp.configVersion || undefined)
        const nextGrant = getNextGrantDate(emp.joinDate, cfg, today)
        
        // 翌日が付与日の場合
        if (nextGrant) {
          const nextGrantDate = new Date(nextGrant)
          nextGrantDate.setHours(0, 0, 0, 0)
          
          if (nextGrantDate.getTime() === tomorrow.getTime()) {
            // ロットを生成（明日まで）
            const { generated, updated } = await generateGrantLotsForEmployee(emp.id, tomorrow)
            totalGenerated += generated
            totalUpdated += updated
            processedCount++
            console.log(`[VacationScheduler] 社員 ${emp.name} (${emp.id}): ロット生成完了 (生成: ${generated}, 更新: ${updated})`)
          }
        }
      } catch (error: any) {
        console.error(`[VacationScheduler] 社員 ${emp.id} の処理エラー:`, error?.message || error)
      }
    }

    console.log(`[VacationScheduler] 自動付与処理完了: ${processedCount}件の社員に対して処理しました (生成: ${totalGenerated}, 更新: ${totalUpdated})`)
  } catch (error) {
    console.error('[VacationScheduler] 自動付与処理エラー:', error)
  }
}

/**
 * スケジューラーを開始
 */
export function startVacationScheduler(): void {
  if (isRunning) {
    console.log('[VacationScheduler] スケジューラーは既に実行中です')
    return
  }

  console.log('[VacationScheduler] スケジューラーを開始します')

  // 失効処理: 毎日0:00に実行
  // 初回実行は即座に、以降は毎日0:00に実行
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  // 初回実行（翌日0:00）
  setTimeout(() => {
    executeExpire()
    // 以降は毎日0:00に実行
    expireIntervalId = setInterval(executeExpire, oneDayMs)
  }, msUntilMidnight)

  // 自動付与処理: 毎日23:59に実行（付与日の前日に実行）
  // 初回実行は即座に、以降は毎日23:59に実行
  const today2359 = new Date(now)
  today2359.setHours(23, 59, 0, 0)
  
  let msUntil2359: number
  if (now >= today2359) {
    // 既に今日の23:59を過ぎている場合、明日の23:59まで待つ
    const tomorrow2359 = new Date(today2359)
    tomorrow2359.setDate(tomorrow2359.getDate() + 1)
    msUntil2359 = tomorrow2359.getTime() - now.getTime()
  } else {
    // 今日の23:59まで待つ
    msUntil2359 = today2359.getTime() - now.getTime()
  }

  // 初回実行（23:59）
  setTimeout(() => {
    executeGrant()
    // 以降は毎日23:59に実行
    grantIntervalId = setInterval(executeGrant, oneDayMs)
  }, msUntil2359)

  isRunning = true
  console.log('[VacationScheduler] スケジューラーを開始しました')
  console.log(`[VacationScheduler] 失効処理: 初回実行は翌日0:00 (${msUntilMidnight}ms後)`)
  console.log(`[VacationScheduler] 自動付与: 初回実行は今日/明日23:59 (${msUntil2359}ms後)`)
}

/**
 * スケジューラーを停止
 */
export function stopVacationScheduler(): void {
  if (!isRunning) {
    console.log('[VacationScheduler] スケジューラーは実行されていません')
    return
  }

  if (expireIntervalId) {
    clearInterval(expireIntervalId)
    expireIntervalId = null
  }

  if (grantIntervalId) {
    clearInterval(grantIntervalId)
    grantIntervalId = null
  }

  isRunning = false
  console.log('[VacationScheduler] スケジューラーを停止しました')
}

/**
 * スケジューラーの状態を取得
 */
export function getVacationSchedulerStatus(): {
  isRunning: boolean
  nextExpire: string | null
  nextGrant: string | null
} {
  return {
    isRunning,
    nextExpire: expireIntervalId ? '毎日0:00' : null,
    nextGrant: grantIntervalId ? '毎日23:59' : null,
  }
}

/**
 * 手動で失効処理を実行
 */
export async function runExpireManually(): Promise<number> {
  const today = new Date()
  return await expireGrantLots(today)
}

/**
 * 手動で自動付与処理を実行
 */
export async function runGrantManually(): Promise<{ processed: number; generated: number; updated: number }> {
  await executeGrant()
  return { processed: 0, generated: 0, updated: 0 } // TODO: 実績を返すように修正
}

