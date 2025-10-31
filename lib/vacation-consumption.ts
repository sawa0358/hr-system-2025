// LIFO消化ロジック
// 設計メモ準拠

import { prisma } from '@/lib/prisma';
import type { AppConfig, RoundingRule } from './vacation-config';

export type ConsumeResult = {
  totalDays: number;
  breakdown: Array<{ lotId: string; days: number }>;
};

/**
 * LIFOで消化を実行
 * 常に「有効で残っているロット」を grantDate 降順で並べ、後ろから消費する
 */
export async function consumeLIFO(
  employeeId: string,
  daysToUse: number,
  asOf: Date,
  tx?: any
): Promise<ConsumeResult> {
  const db = tx || prisma;
  
  // 有効なロットを取得（grantDate降順、残日数>0、失効前）
  const lots = await db.grantLot.findMany({
    where: {
      employeeId,
      daysRemaining: { gt: 0 },
      expiryDate: { gte: asOf },
    },
    orderBy: { grantDate: 'desc' },
  });

  let remain = daysToUse;
  const breakdown: ConsumeResult['breakdown'] = [];

  for (const lot of lots) {
    if (remain <= 0) break;
    const lotRemaining = Number(lot.daysRemaining);
    const use = Math.min(lotRemaining, remain);
    if (use > 0) {
      breakdown.push({ lotId: lot.id, days: use });
      remain -= use;
    }
  }

  if (remain > 0) {
    throw new Error(`INSUFFICIENT_BALANCE: ${remain} days remaining`);
  }

  return { totalDays: daysToUse, breakdown };
}

/**
 * 申請時間を日換算
 * days = usedMinutes / (60 × hoursPerDay)
 * 丸めは rounding ルールに従う
 */
export function convertTimeToDays(
  usedMinutes: number,
  hoursPerDay: number,
  rounding: RoundingRule
): number {
  const days = usedMinutes / (60 * hoursPerDay);
  return applyRounding(days, rounding);
}

/**
 * 丸め処理を適用
 */
export function applyRounding(value: number, rounding: RoundingRule, hoursPerDay: number = 8): number {
  switch (rounding.unit) {
    case 'DAY':
      switch (rounding.mode) {
        case 'FLOOR':
          return Math.floor(value);
        case 'CEIL':
          return Math.ceil(value);
        case 'ROUND':
          return Math.round(value);
      }
      break;
    case 'HOUR':
      // minutesStepに基づいて丸め
      const minutesStep = rounding.minutesStep ?? 30;
      const minutes = value * 60 * hoursPerDay;
      let roundedMinutes: number;
      switch (rounding.mode) {
        case 'FLOOR':
          roundedMinutes = Math.floor(minutes / minutesStep) * minutesStep;
          break;
        case 'CEIL':
          roundedMinutes = Math.ceil(minutes / minutesStep) * minutesStep;
          break;
        case 'ROUND':
        default:
          roundedMinutes = Math.round(minutes / minutesStep) * minutesStep;
          break;
      }
      return roundedMinutes / (60 * hoursPerDay);
  }
  return value;
}

/**
 * 期間内の日数を計算（稼働日のみ）
 * 簡易版：申請日から終了日までの日数
 * 実際には会社カレンダーを考慮する必要がある
 */
export function calculateDaysInPeriod(
  startDate: Date,
  endDate: Date,
  unit: 'DAY' | 'HOUR',
  hoursPerDay?: number
): number {
  if (unit === 'HOUR' && hoursPerDay) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // 簡易計算：実際には稼働日のみをカウントする必要がある
    return diffDays;
  }
  
  // DAY単位の場合
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // 最低1日
}

/**
 * 申請の総日数を計算（時間休の場合は日換算）
 */
export function calculateRequestTotalDays(
  startDate: Date,
  endDate: Date,
  unit: 'DAY' | 'HOUR',
  hoursPerDay: number | null | undefined,
  rounding: RoundingRule
): number {
  if (unit === 'HOUR') {
    if (!hoursPerDay) {
      throw new Error('hoursPerDay is required for HOUR unit');
    }
    // 時間単位の申請の場合、時間を計算して日換算
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = diffHours * 60;
    return convertTimeToDays(diffMinutes, hoursPerDay, rounding);
  }
  
  // DAY単位の場合
  const days = calculateDaysInPeriod(startDate, endDate, 'DAY');
  return applyRounding(days, rounding, hoursPerDay || 8);
}

