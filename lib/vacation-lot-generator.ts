// 付与ロットの自動生成・再計算機能
// 設計メモ準拠

import { prisma } from '@/lib/prisma';
import { loadAppConfig } from './vacation-config';
import {
  iterateAnchors,
  chooseGrantDaysForEmployee,
  computeExpiry,
  generateDedupKey,
} from './vacation-grant-lot';

/**
 * 社員の付与ロットを生成（再計算）
 * 入社日から現在までのすべての基準日にロットを作成
 */
export async function generateGrantLotsForEmployee(
  employeeId: string,
  until?: Date
): Promise<{ generated: number; updated: number }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      joinDate: true,
      weeklyPattern: true,
      configVersion: true,
      vacationPattern: true,
      employeeType: true, // 雇用形態（String）を取得
    },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.joinDate) {
    throw new Error('Employee joinDate is required');
  }

  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const today = until || new Date();
  const joinDate = new Date(employee.joinDate);

  let generated = 0;
  let updated = 0;

  // すべての基準日を生成
  for (const anchor of iterateAnchors(joinDate, cfg, today)) {
    const grantDate = anchor.grantDate;

    // 付与日数を決定（パターン値ベース）
    // vacationPatternが設定されていない場合は、employeeTypeからデフォルト値を取得
    let pattern = employee.vacationPattern;
    if (!pattern && employee.employeeType) {
      const { getDefaultVacationPattern, getVacationPatternFromWeeklyPattern } = await import('./vacation-pattern');
      pattern = getDefaultVacationPattern(employee.employeeType) || getVacationPatternFromWeeklyPattern(employee.weeklyPattern) || null;
    }
    
    const daysGranted = chooseGrantDaysForEmployee(
      pattern,
      anchor.yearsSinceJoin,
      cfg
    );

    // ゼロ付与はスキップ
    if (daysGranted === 0) continue;

    // 有効期限を計算（基本設定から参照、現在は2年）
    const expiryDate = computeExpiry(grantDate, cfg.expiry);

    // dedupKeyを生成
    const dedupKey = generateDedupKey(
      employeeId,
      grantDate,
      daysGranted,
      expiryDate,
      cfg.version
    );

    // 既存のロットを確認（dedupKeyで）
    const existing = await prisma.grantLot.findUnique({
      where: { dedupKey },
    });

    if (existing) {
      // 既存の場合は更新（付与日数が変わった場合など）
      if (Number(existing.daysGranted) !== daysGranted) {
        // 既に消費されている日数を考慮して残日数を再計算
        const usedDays = await prisma.consumption.aggregate({
          where: { lotId: existing.id },
          _sum: { daysUsed: true },
        });
        const totalUsed = Number(usedDays._sum.daysUsed ?? 0);
        const newRemaining = Math.max(0, daysGranted - totalUsed);

        await prisma.grantLot.update({
          where: { id: existing.id },
          data: {
            daysGranted: daysGranted,
            daysRemaining: newRemaining,
            expiryDate,
            configVersion: cfg.version,
          },
        });
        updated++;
      }
      continue;
    }

    // 同じ付与日で異なる設定バージョンのロットが存在する場合は削除
    // （設定が更新された場合、古い設定のロットは無効にする）
    const existingSameDate = await prisma.grantLot.findFirst({
      where: {
        employeeId,
        grantDate: grantDate,
        configVersion: { not: cfg.version }, // 現在の設定バージョンと異なるもの
      },
    });

    if (existingSameDate) {
      // 古い設定バージョンのロットを削除（ただし、既に消費されている場合は残日数だけ0にする）
      const usedDays = await prisma.consumption.aggregate({
        where: { lotId: existingSameDate.id },
        _sum: { daysUsed: true },
      });
      const totalUsed = Number(usedDays._sum.daysUsed ?? 0);

      if (totalUsed > 0) {
        // 消費済みがある場合は削除せず、残日数を0にして無効化
        await prisma.grantLot.update({
          where: { id: existingSameDate.id },
          data: {
            daysRemaining: 0,
          },
        });
      } else {
        // 未使用の場合は削除
        await prisma.grantLot.delete({
          where: { id: existingSameDate.id },
        });
      }
      updated++;
    }

    // 新規作成
    // 既に消費されている日数を確認（過去の申請がある場合）
    // 簡易版：既存のロットがあれば、その消費実績を参考にする
    // 実際には、過去のConsumptionから計算する必要がある
    const initialRemaining = daysGranted;

    await prisma.grantLot.create({
      data: {
        employeeId,
        grantDate,
        daysGranted: daysGranted,
        daysRemaining: initialRemaining,
        expiryDate,
        dedupKey,
        configVersion: cfg.version,
      },
    });

    generated++;
  }

  return { generated, updated };
}

/**
 * 失効処理（期限切れのロットの残日数を0化）
 */
export async function expireGrantLots(today: Date = new Date()): Promise<number> {
  const result = await prisma.grantLot.updateMany({
    where: {
      expiryDate: { lt: today },
      daysRemaining: { gt: 0 },
    },
    data: {
      daysRemaining: 0,
    },
  });

  return result.count;
}

/**
 * 全社員の付与ロットを生成（バッチ処理用）
 */
export async function generateGrantLotsForAllEmployees(
  until?: Date
): Promise<{ employeeId: string; generated: number; updated: number }[]> {
  const employees = await prisma.employee.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
      joinDate: true,
      employmentType: true,
      weeklyPattern: true,
      configVersion: true,
    },
  });

  const results = [];
  for (const emp of employees) {
    try {
      const { generated, updated } = await generateGrantLotsForEmployee(emp.id, until);
      results.push({ employeeId: emp.id, generated, updated });
    } catch (error) {
      console.error(`Failed to generate lots for employee ${emp.id}:`, error);
      results.push({ employeeId: emp.id, generated: 0, updated: 0 });
    }
  }

  return results;
}

