// 残日数・表示算出ロジック
// 設計メモ準拠

import { prisma } from '@/lib/prisma';
import { getNextGrantDate, getPreviousGrantDate, chooseGrantDaysForEmployee, diffInYearsHalfStep } from './vacation-grant-lot';
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
 * 取得済み日数を計算（現在の付与期間内のみ）
 * 設計メモ: 現在の付与期間内の承認済み申請のtotalDaysの合計
 */
export async function calculateUsedDays(
  employeeId: string,
  today: Date = new Date()
): Promise<number> {
  // 社員情報を取得して現在の付与期間を計算
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) {
    return 0;
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const joinDate = new Date(employee.joinDate);
  
  // 現在の付与開始日（直近の付与日）を取得
  const currentGrantDate = getPreviousGrantDate(joinDate, cfg, today);
  if (!currentGrantDate) {
    // まだ初回付与前の場合は0
    return 0;
  }

  // 次の付与日を取得
  const currentGrantDateNext = getNextGrantDate(joinDate, cfg, currentGrantDate);

  // 現在の付与期間内の承認済み申請を取得
  const approvedRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: "APPROVED",
    },
    select: {
      startDate: true,
      endDate: true,
      totalDays: true,
    },
  });

  // 現在の付与期間内の申請のみをフィルタリング
  const currentPeriodRequests = approvedRequests.filter(req => {
    const reqStartDate = new Date(req.startDate);
    const reqEndDate = new Date(req.endDate);
    // 申請期間の一部でも現在の付与期間内に含まれていればカウント
    return (reqStartDate >= currentGrantDate && reqStartDate < currentGrantDateNext) ||
           (reqEndDate >= currentGrantDate && reqEndDate < currentGrantDateNext) ||
           (reqStartDate < currentGrantDate && reqEndDate >= currentGrantDateNext);
  });

  const total = currentPeriodRequests.reduce(
    (sum, req) => sum + Number(req.totalDays || 0),
    0
  );
  // 0.5日単位で丸める
  return Math.round(total * 2) / 2;
}

/**
 * 総付与数を計算（現在の付与期間の総付与日数）
 * - 現在の付与期間開始時点での繰越し日数 + 新付与日数の合計
 * - LIFO形式で、新しい付与日から消化される
 * - 現在の付与基準日の時点で、繰越し日数 + 新付与日数の合計
 * 
 * 計算式: 総付与数 - 取得済み - 申請中 = 残り有給日数
 */
export async function calculateTotalGranted(employeeId: string, today: Date = new Date()): Promise<number> {
  // 社員情報を取得
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) {
    return 0;
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const joinDate = new Date(employee.joinDate);
  
  // 現在の付与開始日（直近の付与日）を取得
  const currentGrantDate = getPreviousGrantDate(joinDate, cfg, today);
  if (!currentGrantDate) {
    // まだ初回付与前の場合は0
    return 0;
  }

  // 現在の付与開始日時点での繰越し日数を計算
  // 前の期間終了時点での繰越し日数を使う（計算根拠モーダルと同じロジック）
  // 前の期間を計算
  const previousGrantDate = getPreviousGrantDate(joinDate, cfg, new Date(currentGrantDate.getTime() - 1));
  let carryOverDays = 0;
  
  if (previousGrantDate) {
    // 前の期間終了日を取得
    const previousGrantDateNext = getNextGrantDate(joinDate, cfg, previousGrantDate);
    
    // 前の期間内の使用日数を計算
    const previousPeriodRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
      },
    });
    const previousUsedDays = previousPeriodRequests
      .filter(req => {
        if (!previousGrantDateNext) return false;
        const reqStartDate = new Date(req.startDate);
        const reqEndDate = new Date(req.endDate);
        return (reqStartDate >= previousGrantDate && reqStartDate < previousGrantDateNext) ||
               (reqEndDate >= previousGrantDate && reqEndDate < previousGrantDateNext) ||
               (reqStartDate < previousGrantDate && reqEndDate >= previousGrantDateNext);
      })
      .reduce((sum, req) => sum + Number(req.totalDays || 0), 0);

    // 前の期間の新付与日数を取得
    const previousGrantLots = await prisma.grantLot.findMany({
      where: {
        employeeId,
        grantDate: {
          gte: new Date(previousGrantDate.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(previousGrantDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    const previousNewGrantLot = previousGrantLots.find(lot => {
      const lotDate = new Date(lot.grantDate);
      const grantDate = new Date(previousGrantDate);
      return lotDate.getFullYear() === grantDate.getFullYear() && 
             lotDate.getMonth() === grantDate.getMonth() &&
             lotDate.getDate() === grantDate.getDate();
    });
    const previousNewGrantDays = previousNewGrantLot ? Number(previousNewGrantLot.daysGranted) : 0;

    // 前の期間終了時点での繰越し日数 = 新付与日数 - 使用日数（LIFO方式）
    carryOverDays = Math.max(0, previousNewGrantDays - previousUsedDays);
  }

  // 現在の付与日に作成されたロットを取得
  const currentGrantLots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      grantDate: {
        gte: new Date(currentGrantDate.getTime() - 24 * 60 * 60 * 1000), // 新付与日の前日以降
        lte: new Date(currentGrantDate.getTime() + 24 * 60 * 60 * 1000), // 新付与日の翌日まで
      },
    },
  });

  // 現在の付与日の新付与日数
  const newGrantLot = currentGrantLots.find(lot => {
    const lotDate = new Date(lot.grantDate);
    const grantDate = new Date(currentGrantDate);
    return lotDate.getFullYear() === grantDate.getFullYear() && 
           lotDate.getMonth() === grantDate.getMonth() &&
           lotDate.getDate() === grantDate.getDate();
  });
  const newGrantDays = newGrantLot ? Number(newGrantLot.daysGranted) : 0;

  // 総付与数 = 繰越し日数 + 新付与日数
  const total = carryOverDays + newGrantDays;
  
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
 * 来期の情報を取得（次の付与日、付与予定日数、期間）
 */
export async function getNextPeriodInfo(employeeId: string, today: Date = new Date()) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true, vacationPattern: true },
  });

  if (!employee) {
    return null;
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const joinDate = new Date(employee.joinDate);

  // 次の付与日を取得
  const nextGrantDate = getNextGrantDate(joinDate, cfg, today);
  if (!nextGrantDate) {
    return null;
  }

  // 次の次の付与日（来期の終了日）を取得
  const nextNextGrantDate = getNextGrantDate(joinDate, cfg, nextGrantDate);

  // 来期の付与予定日数を計算
  const yearsAtNextGrant = diffInYearsHalfStep(joinDate, nextGrantDate);
  const nextGrantDays = chooseGrantDaysForEmployee(employee.vacationPattern, yearsAtNextGrant, cfg);

  // 今期から来期への繰越予定日数を計算
  // LIFO方式：今期のロットの残日数（有効期限が来期まで有効なもの）
  const carryOverLots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      expiryDate: { gte: nextGrantDate }, // 来期の付与日時点でまだ有効
      daysRemaining: { gt: 0 },
    },
  });
  const carryOverDays = carryOverLots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0);

  // 来期の総付与予定日数 = 繰越予定日数 + 新付与予定日数
  const nextPeriodTotalGranted = carryOverDays + nextGrantDays;

  return {
    nextGrantDate,
    nextGrantDays,
    nextPeriodEndDate: nextNextGrantDate,
    carryOverDays: Math.round(carryOverDays * 2) / 2,
    nextPeriodTotalGranted: Math.round(nextPeriodTotalGranted * 2) / 2,
  };
}

/**
 * 申請日が来期に属するかどうかを判定
 * 日付のみを比較（タイムゾーンの影響を排除）
 */
export async function isNextPeriodDate(employeeId: string, targetDate: Date, today: Date = new Date()): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) {
    return false;
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const joinDate = new Date(employee.joinDate);

  // 次の付与日を取得
  const nextGrantDate = getNextGrantDate(joinDate, cfg, today);
  if (!nextGrantDate) {
    return false;
  }

  // 日付のみを比較（タイムゾーンの影響を排除）
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nextGrantDateOnly = new Date(nextGrantDate.getFullYear(), nextGrantDate.getMonth(), nextGrantDate.getDate());

  // targetDateが次の付与日以降かどうか
  return targetDateOnly >= nextGrantDateOnly;
}

/**
 * 来期の申請中日数を計算
 */
export async function calculateNextPeriodPendingDays(employeeId: string, today: Date = new Date()): Promise<number> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { joinDate: true, configVersion: true },
  });

  if (!employee) {
    return 0;
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const joinDate = new Date(employee.joinDate);

  // 次の付与日を取得
  const nextGrantDate = getNextGrantDate(joinDate, cfg, today);
  if (!nextGrantDate) {
    return 0;
  }

  // 来期に該当する申請中の申請を取得
  const pendingRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'PENDING',
      startDate: { gte: nextGrantDate },
    },
  });

  let total = 0;
  for (const req of pendingRequests) {
    if (req.totalDays) {
      total += Number(req.totalDays);
    } else {
      const diffMs = req.endDate.getTime() - req.startDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const rounded = Math.round(Math.max(1, diffDays) * 2) / 2;
      total += rounded;
    }
  }

  return Math.round(total * 2) / 2;
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

