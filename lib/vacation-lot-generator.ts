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

  // アクティブな設定を取得（社員の設定バージョンが未設定の場合は最新のアクティブ設定を使用）
  const cfg = await loadAppConfig(employee.configVersion || undefined);
  const today = until || new Date();
  const joinDate = new Date(employee.joinDate);

  // 設定バージョンを社員レコードに保存（未設定の場合のみ）
  if (!employee.configVersion && cfg.version) {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { configVersion: cfg.version },
    });
  }

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

    // 同じ付与日のロットが存在する場合は全て削除（最新の設定で再生成するため）
    // ただし、既に消費されている場合は残日数を考慮する
    const existingSameDateLots = await prisma.grantLot.findMany({
      where: {
        employeeId,
        grantDate: grantDate,
      },
    });

    if (existingSameDateLots.length > 0) {
      for (const existingLot of existingSameDateLots) {
        // 既に消費されている日数を確認
        const usedDays = await prisma.consumption.aggregate({
          where: { lotId: existingLot.id },
          _sum: { daysUsed: true },
        });
        const totalUsed = Number(usedDays._sum.daysUsed ?? 0);

        if (totalUsed > 0) {
          // 消費済みがある場合は削除せず、残日数を0にして無効化
          await prisma.grantLot.update({
            where: { id: existingLot.id },
            data: {
              daysRemaining: 0,
            },
          });
        } else {
          // 未使用の場合は削除
          await prisma.grantLot.delete({
            where: { id: existingLot.id },
          });
        }
        updated++;
      }
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

    // 付与ロット作成後に、遅延されていた消化（Deferred Consumption）を処理
    await processDeferredRequests(employeeId);
  }

  return { generated, updated };
}

/**
 * 遅延されていた消化（Deferred Consumption）を処理
 * 決済済みだが未消化の申請を検索し、可能なものを消化する
 */
async function processDeferredRequests(employeeId: string) {
  const { consumeLIFO, commitConsumption } = await import('./vacation-consumption');

  // 決済済み(finalizedByあり)かつ未消化(consumptionsなし)の申請を取得
  const deferredRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      finalizedBy: { not: null },
      consumptions: { none: {} },
    },
    orderBy: { startDate: 'asc' },
  });

  if (deferredRequests.length === 0) return;

  console.log(`[Deferred Consumption] Found ${deferredRequests.length} requests for employee ${employeeId}`);

  for (const req of deferredRequests) {
    try {
      await prisma.$transaction(async (tx) => {
        // 残日数を計算（totalDaysがあればそれを使用）
        const daysToUse = req.totalDays ? Number(req.totalDays) : 0; // 0の場合はconsumeLIFO等は実質スキップされるが、totalDaysは必須のはず

        if (daysToUse <= 0) return;

        // 消化試行
        // 指定された申請日の時点で有効なロットを探す
        const breakdown = await consumeLIFO(req.employeeId, daysToUse, req.startDate, tx);

        // 消化実行（DB更新）
        await commitConsumption(req, breakdown, tx);

        // Breakdown情報を更新
        await tx.timeOffRequest.update({
          where: { id: req.id },
          data: {
            breakdownJson: JSON.stringify(breakdown),
          },
        });

        console.log(`[Deferred Consumption] Successfully consumed request ${req.id}`);
        // 監査ログ
        await tx.auditLog.create({
          data: {
            employeeId: req.employeeId,
            actor: 'system',
            action: 'DEFERRED_CONSUMPTION_EXECUTE',
            entity: `TimeOffRequest:${req.id}`,
            payload: JSON.stringify({ breakdown, daysToUse }),
          },
        });
      });
    } catch (e: any) {
      // 失敗してもエラーにせず、次の申請の処理や後続の処理に進む（まだロットが無い等の可能性があるため）
      console.log(`[Deferred Consumption] Skipped request ${req.id}: ${e.message}`);
    }
  }
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

