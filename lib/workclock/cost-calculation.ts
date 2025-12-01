import { Worker, TimeEntry, Reward } from './types'
import { getMonthlyTotal } from './time-utils'

/**
 * ワーカー単位の月間報酬を計算
 * 個人ダッシュボード、管理者ダッシュボード、PDF出力で共通使用
 * 
 * 計算内容：
 * - 時給パターン（A/B/C）の合計
 * - 回数パターン（A/B/C）の合計
 * - 月額固定
 * - 特別報酬・経費
 */
export function calculateWorkerMonthlyCost(
  worker: Worker,
  entries: TimeEntry[],
  rewards: Reward[]
): number {
  // エントリがない場合でも月額固定と特別報酬は計算
  if (!entries || entries.length === 0) {
    const fixedAmount =
      typeof worker.monthlyFixedAmount === 'number' ? worker.monthlyFixedAmount || 0 : 0
    const rewardAmount = rewards.reduce((acc, r) => acc + r.amount, 0)
    return fixedAmount + rewardAmount
  }

  // 時給パターンの計算（wagePattern が設定されているエントリのみ対象）
  const entriesByPattern = entries.reduce((acc, entry) => {
    const pattern = entry.wagePattern
    if (!pattern) {
      return acc
    }
    if (!acc[pattern]) acc[pattern] = []
    acc[pattern].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  const patternTotals: Record<'A' | 'B' | 'C', { hours: number; minutes: number; amount: number }> =
    {
      A: { hours: 0, minutes: 0, amount: 0 },
      B: { hours: 0, minutes: 0, amount: 0 },
      C: { hours: 0, minutes: 0, amount: 0 },
    }

  Object.entries(entriesByPattern).forEach(([pattern, patternEntries]) => {
    const total = getMonthlyTotal(patternEntries)
    const hours = total.hours + total.minutes / 60
    const rate =
      pattern === 'A'
        ? worker.hourlyRate
        : pattern === 'B'
        ? worker.hourlyRateB || worker.hourlyRate
        : worker.hourlyRateC || worker.hourlyRate

    patternTotals[pattern as 'A' | 'B' | 'C'] = {
      hours: total.hours,
      minutes: total.minutes,
      amount: hours * rate,
    }
  })

  // 回数パターンの計算（countPatternが設定されているエントリから計算）
  let countAmount = 0
  entries.forEach((entry) => {
    if (entry.countPattern) {
      const pattern = entry.countPattern
      const count = entry.count || 1
      const rate =
        pattern === 'A'
          ? worker.countRateA || 0
          : pattern === 'B'
          ? worker.countRateB || 0
          : worker.countRateC || 0
      countAmount += count * rate
    }
  })

  // 月額固定
  const monthlyFixedAmount =
    typeof worker.monthlyFixedAmount === 'number' && worker.monthlyFixedAmount > 0
      ? worker.monthlyFixedAmount
      : 0

  // 特別報酬・経費
  const rewardAmount = rewards.reduce((acc, r) => acc + r.amount, 0)

  return (
    patternTotals.A.amount +
    patternTotals.B.amount +
    patternTotals.C.amount +
    countAmount +
    monthlyFixedAmount +
    rewardAmount
  )
}



