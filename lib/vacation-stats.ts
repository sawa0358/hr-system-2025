// 残日数・表示算出ロジック
// 設計メモ準拠

import { prisma } from '@/lib/prisma';
import { getNextGrantDate, getPreviousGrantDate } from './vacation-grant-lot';
import { loadAppConfig } from './vacation-config';

/**
 * 現在残日数計算（0.5日単位で丸める）
 * remaining = Σ_{lot: expiry ≥ today} lot.daysRemaining
 * 計算結果は0.5日単位で丸める
 */
export async function calculateRemainingDays(
  employeeId: string,
  today: Date = new Date()
): Promise<number> {
  const lots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      expiryDate: { gte: today },
      daysRemaining: { gt: 0 },
    },
  });

  const total = lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0);
  // 0.5日単位で丸める
  return Math.round(total * 2) / 2;
}

/**
 * 申請中の日数を計算（未承認の申請）
 */
export async function calculatePendingDays(employeeId: string): Promise<number> {
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'PENDING',
    },
  });

  let total = 0;
  for (const req of requests) {
    if (req.totalDays) {
      total += Number(req.totalDays);
    } else {
      // 計算されていない場合は簡易計算（0.5日単位で丸める）
      const diffMs = req.endDate.getTime() - req.startDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const rounded = Math.round(Math.max(1, diffDays) * 2) / 2; // 0.5日単位で丸める
      total += rounded;
    }
  }

  // 0.5日単位で丸める
  return Math.round(total * 2) / 2;
}

/**
 * 取得済み日数を計算（現在の付与期間内）
 * 設計メモ: 申請時間を日換算した合計
 */
export async function calculateUsedDays(
  employeeId: string,
  today: Date = new Date()
): Promise<number> {
  // 現在の付与サイクルの開始日を取得
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) return 0;

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const prevGrant = getPreviousGrantDate(employee.joinDate, cfg, today);
  const curStart = prevGrant || employee.joinDate;

  // 承認済み消費の合計
  const consumptions = await prisma.consumption.findMany({
    where: {
      employeeId,
      date: {
        gte: curStart,
        lte: today,
      },
    },
  });

  const total = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0);
  // 0.5日単位で丸める
  return Math.round(total * 2) / 2;
}

/**
 * 総付与数を計算（新付与日時点の消費前の今年消費できる最大日数）
 * - 昨年残高日数 + 新付与日数の合計
 * - LIFO形式で、新しい付与日から消化される
 * - 最新の付与基準日の時点で、失効していないロットの初期付与日数（daysGranted）の合計
 * - この値は1年間変わりません（次の新付与日まで固定）
 * 
 * 計算式: 総付与数 - 取得済み - 申請中 = 残り有給日数
 * 
 * 実際の計算：
 * - 最新の付与基準日時点で有効だったロット（失効していない）のdaysGranted（初期付与日数）の合計
 * - これは「今年消費できる最大日数（消費前の値）」を意味する
 */
export async function calculateTotalGranted(employeeId: string, today: Date = new Date()): Promise<number> {
  // 失効していないロットを取得（最新の付与日順）
  const lots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      expiryDate: { gte: today }, // 失効していないロットのみ
    },
    orderBy: { grantDate: 'desc' }, // 新しい付与日順（LIFO）
  });

  if (lots.length === 0) {
    return 0;
  }

  // 最新の付与基準日を取得
  const latestGrantDate = lots[0].grantDate;

  // 最新の付与基準日の時点で有効だったロット（失効していない）の初期付与日数（daysGranted）の合計
  // これは「昨年残高日数 + 新付与日数」を意味し、消費前の値（1年間固定）
  const total = lots
    .filter(lot => lot.grantDate <= latestGrantDate) // 最新の付与基準日までのロットのみ
    .reduce((sum, lot) => sum + Number(lot.daysGranted), 0); // daysRemainingではなくdaysGrantedを使用
  
  // 0.5日単位で丸める
  return Math.round(total * 2) / 2;
}

/**
 * 次回付与日を取得
 */
export async function getNextGrantDateForEmployee(employeeId: string): Promise<Date | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) return null;

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  return getNextGrantDate(employee.joinDate, cfg);
}

/**
 * 失効予定日数を計算（直近で失効するロットの残日数合計）
 */
export async function calculateExpiringSoon(
  employeeId: string,
  daysAhead: number = 30,
  today: Date = new Date()
): Promise<number> {
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const lots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      expiryDate: {
        gte: today,
        lte: futureDate,
      },
      daysRemaining: { gt: 0 },
    },
  });

  return lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0);
}

/**
 * 有給統計情報をまとめて取得
 */
export async function getVacationStats(employeeId: string) {
  let employee: any
  try {
    employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true,
        employmentType: true,
        weeklyPattern: true,
        vacationPattern: true,
        employeeType: true, // 雇用形態（String）も取得
      },
    })
  } catch (schemaError: any) {
    // 新しいカラムが存在しない場合は、それらを除外して取得
    if (schemaError?.code === 'P2022') {
      employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          name: true,
          joinDate: true,
          employeeType: true,
        },
      })
      // 存在しないカラムにデフォルト値を設定
      employee = employee ? {
        ...employee,
        configVersion: null,
        employmentType: null,
        weeklyPattern: null,
        vacationPattern: null,
      } : null
    } else {
      throw schemaError
    }
  }

  if (!employee) {
    throw new Error('Employee not found');
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const today = new Date();

  const [
    totalRemaining,
    used,
    pending,
    totalGranted,
    nextGrantDate,
    expiringSoon,
  ] = await Promise.all([
    calculateRemainingDays(employeeId, today),
    calculateUsedDays(employeeId, today),
    calculatePendingDays(employeeId),
    calculateTotalGranted(employeeId, today), // todayを渡す
    getNextGrantDateForEmployee(employeeId),
    calculateExpiringSoon(employeeId, 30, today),
  ]);

  return {
    employeeId,
    employeeName: employee.name,
    joinDate: employee.joinDate,
    totalRemaining,
    used,
    pending,
    totalGranted,
    nextGrantDate,
    expiringSoon,
  };
}

