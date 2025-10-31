// 残日数・表示算出ロジック
// 設計メモ準拠

import { prisma } from '@/lib/prisma';
import { getNextGrantDate, getPreviousGrantDate } from './vacation-grant-lot';
import { loadAppConfig } from './vacation-config';

/**
 * 現在残日数計算
 * remaining = Σ_{lot: expiry ≥ today} lot.daysRemaining
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

  return lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0);
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
      // 計算されていない場合は簡易計算
      const diffMs = req.endDate.getTime() - req.startDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      total += Math.max(1, diffDays);
    }
  }

  return total;
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

  return consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0);
}

/**
 * 総付与数を計算（有効期限切れを含む全てのロットの合計）
 */
export async function calculateTotalGranted(employeeId: string): Promise<number> {
  const lots = await prisma.grantLot.findMany({
    where: { employeeId },
  });

  return lots.reduce((sum, lot) => sum + Number(lot.daysGranted), 0);
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
  const employee = await prisma.employee.findUnique({
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
  });

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
    calculateTotalGranted(employeeId),
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

