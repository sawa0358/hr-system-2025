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
 * 消化処理を確定・DB更新
 * (GrantLotの更新とConsumptionの作成)
 */
export async function commitConsumption(
  req: { id: string; employeeId: string; startDate: Date; endDate: Date },
  breakdown: ConsumeResult,
  tx: any
) {
  const daysToUse = breakdown.totalDays;

  // 1. GrantLotの更新
  for (const b of breakdown.breakdown) {
    await tx.grantLot.update({
      where: { id: b.lotId },
      data: { daysRemaining: { decrement: b.days } },
    });
  }

  // 2. Consumptionレコードの作成
  const consumptions = [];
  const startDate = new Date(req.startDate);
  const endDate = new Date(req.endDate);

  // 日数差を計算（最低1日）
  const diffMs = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let lotIndex = 0;
  let lotRemaining = breakdown.breakdown[lotIndex]?.days || 0;
  let currentLotId = breakdown.breakdown[lotIndex]?.lotId; // string | undefined

  for (let i = 0; i < daysDiff && currentLotId; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (lotRemaining > 0 && currentLotId) {
      const daysPerDate = daysToUse / daysDiff;
      const actualDays = Math.min(lotRemaining, daysPerDate);

      consumptions.push({
        employeeId: req.employeeId,
        requestId: req.id,
        lotId: currentLotId!,
        date,
        daysUsed: actualDays,
      });

      lotRemaining -= actualDays;

      // 浮動小数点誤差を考慮してわずかな残りなら0とみなす
      if (lotRemaining <= 0.000001) {
        lotIndex++;
        if (lotIndex < breakdown.breakdown.length) {
          lotRemaining = breakdown.breakdown[lotIndex].days;
          currentLotId = breakdown.breakdown[lotIndex].lotId;
        } else {
          currentLotId = undefined;
        }
      }
    }
  }

  // DB保存
  for (const c of consumptions) {
    await tx.consumption.create({
      data: c,
    });
  }
}

/**
 * 申請時間を日換算
 * days = usedMinutes / (60 × hoursPerDay)
 * 丸めは rounding ルールに従う（4時間以内は0.5日、超過は1日単位）
 */
export function convertTimeToDays(
  usedMinutes: number,
  hoursPerDay: number,
  rounding: RoundingRule
): number {
  const hours = usedMinutes / 60;
  const days = hours / hoursPerDay;

  // 4時間を閾値として0.5日単位で丸める
  const fourHourThreshold = 4;
  if (hours <= fourHourThreshold) {
    // 4時間以内 → 0.5日
    return 0.5;
  }

  // 4時間超過 → 0.5日単位で丸める
  return applyRounding(days, rounding, hoursPerDay);
}

/**
 * 丸め処理を適用
 * 有給申請は0.5日単位で計算（4時間以内は半日、超過は1日）
 */
export function applyRounding(value: number, rounding: RoundingRule, hoursPerDay: number = 8): number {
  switch (rounding.unit) {
    case 'DAY':
      // 0.5日単位で丸める（4時間 = 0.5日、8時間 = 1日を基準）
      // value <= 0.5日（4時間相当） → 0.5日
      // 0.5日 < value <= 1.0日 → 1.0日
      // 1.0日 < value <= 1.5日 → 1.5日
      // ...
      const halfDayThreshold = 0.5; // 4時間相当（hoursPerDay/2）

      switch (rounding.mode) {
        case 'FLOOR':
          // 切り捨て：0.5日単位で切り捨て
          return Math.floor(value / halfDayThreshold) * halfDayThreshold;
        case 'CEIL':
          // 切り上げ：0.5日単位で切り上げ
          return Math.ceil(value / halfDayThreshold) * halfDayThreshold;
        case 'ROUND':
        default:
          // 四捨五入：0.5日単位で四捨五入
          return Math.round(value / halfDayThreshold) * halfDayThreshold;
      }
    case 'HOUR':
      // 時間単位の丸め：4時間を閾値として0.5日単位で丸める
      const hours = value * hoursPerDay;
      const fourHourThreshold = 4; // 4時間

      // 4時間以内 → 0.5日
      // 4時間超過 → 1.0日単位で丸める
      if (hours <= fourHourThreshold) {
        return 0.5;
      }

      // 4時間超過の場合は1日単位で丸める（0.5日単位）
      const days = hours / hoursPerDay;
      return Math.round(days * 2) / 2; // 0.5日単位で四捨五入
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
