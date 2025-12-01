// 付与ロット計算ロジック
// 設計メモ準拠

import type { AppConfig, BaselineRule, ExpiryRule } from './vacation-config';
import { createHash } from 'crypto';

type GrantAnchor = { grantDate: Date; yearsSinceJoin: number };

/**
 * 基準日候補の生成関数
 * 入社日から指定日までのすべての付与基準日を生成
 */
export function* iterateAnchors(
  joinDate: Date,
  cfg: AppConfig,
  until: Date
): Generator<GrantAnchor, void, unknown> {
  switch (cfg.baselineRule.kind) {
    case 'RELATIVE_FROM_JOIN': {
      const first = addMonths(joinDate, cfg.baselineRule.initialGrantAfterMonths);
      for (let d = new Date(first); d <= until; d = addMonths(new Date(d), cfg.grantCycleMonths)) {
        const years = diffInYearsHalfStep(joinDate, d);
        yield { grantDate: new Date(d), yearsSinceJoin: years };
      }
      break;
    }
    case 'ANNIVERSARY': {
      // 毎年 入社記念日 + offset
      const startYear = getYear(joinDate);
      for (let y = startYear; ; y++) {
        const base = addMonths(
          new Date(y, getMonth(joinDate), getDate(joinDate)),
          cfg.baselineRule.offsetMonths
        );
        if (base > until) break;
        const years = diffInYearsHalfStep(joinDate, base);
        yield { grantDate: base, yearsSinceJoin: years };
      }
      break;
    }
    case 'FIXED_MONTH_DAY': {
      // 全社員同一基準（年次）
      const startYear = getYear(joinDate); // 参考: joinより前の固定日は無視
      for (let y = startYear; ; y++) {
        const base = new Date(y, cfg.baselineRule.month - 1, cfg.baselineRule.day);
        if (base < joinDate) continue;
        if (base > until) break;
        const years = diffInYearsHalfStep(joinDate, base);
        yield { grantDate: base, yearsSinceJoin: years };
      }
      break;
    }
  }
}

/**
 * 付与日数決定（パターン値ベース）
 * パターンA: fullTime.table を参照
 * パターンB-1〜B-4: partTime.tables の対応するテーブルを参照
 */
export function chooseGrantDaysForEmployee(
  vacationPattern: string | null | undefined,
  years: number,
  cfg: AppConfig
): number {
  if (!vacationPattern) return 0;
  
  // パターンA（正社員用）
  if (vacationPattern === 'A') {
    return findDays(cfg.fullTime.table, years);
  }
  
  // パターンB-1〜B-4（パート用）
  const match = vacationPattern.match(/^B-(\d)$/);
  if (match) {
    const weeklyPattern = parseInt(match[1], 10) as 1 | 2 | 3 | 4;
    const table = cfg.partTime.tables.find((t) => t.weeklyPattern === weeklyPattern);
    if (table) {
      return findDays(table.grants, years);
    }
  }
  
  return 0;
}

/**
 * 付与表から該当する日数を検索
 * years <= targetYears の最大行を取得
 */
function findDays(rows: Array<{ years: number; days: number }>, years: number): number {
  const eligible = rows
    .filter((r) => r.years <= years)
    .sort((a, b) => b.years - a.years)[0];
  return eligible?.days ?? 0;
}

/**
 * 有効期限計算
 */
export function computeExpiry(grantDate: Date, rule: ExpiryRule): Date {
  switch (rule.kind) {
    case 'YEARS':
      return addDays(addYears(grantDate, rule.years), -1);
    case 'MONTHS':
      return addDays(addMonths(grantDate, rule.months), -1);
    case 'END_OF_FY':
      // 会社FY末ロジック（簡易版：12月末）
      const fyEnd = new Date(grantDate);
      fyEnd.setFullYear(fyEnd.getFullYear() + Math.floor(rule.monthsValid / 12));
      fyEnd.setMonth(11, 31); // 12月31日
      return fyEnd;
  }
}

/**
 * 付与ロットのdedupKey生成（冪等性確保）
 */
export function generateDedupKey(
  employeeId: string,
  grantDate: Date,
  daysGranted: number,
  expiryDate: Date,
  configVersion: string
): string {
  const key = `${employeeId}:${grantDate.toISOString()}:${daysGranted}:${expiryDate.toISOString()}:${configVersion}`;
  return createHash('sha256').update(key).digest('hex');
}

/**
 * 勤続年数計算（半年刻み）
 */
export function diffInYearsHalfStep(join: Date, target: Date): number {
  const months = differenceInMonths(target, join);
  return Math.floor(months / 6) / 2; // 0.5刻み
}

// ユーティリティ関数
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getYear(date: Date): number {
  return date.getFullYear();
}

function getMonth(date: Date): number {
  return date.getMonth();
}

function getDate(date: Date): number {
  return date.getDate();
}

function differenceInMonths(dateLeft: Date, dateRight: Date): number {
  const yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  const monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * 日付のみを比較するためのヘルパー関数（時刻を排除）
 */
function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 日付のみで比較（a > b）
 */
function isDateAfter(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() > toDateOnly(b).getTime();
}

/**
 * 日付のみで比較（a <= b）
 */
function isDateOnOrBefore(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() <= toDateOnly(b).getTime();
}

/**
 * 社員の次の付与基準日を取得
 */
export function getNextGrantDate(
  joinDate: Date,
  cfg: AppConfig,
  today: Date = new Date()
): Date | null {
  const todayOnly = toDateOnly(today);
  for (const anchor of iterateAnchors(joinDate, cfg, new Date(today.getFullYear() + 1, 11, 31))) {
    const grantDateOnly = toDateOnly(anchor.grantDate);
    // 付与日が今日より後の場合
    if (grantDateOnly.getTime() > todayOnly.getTime()) {
      return grantDateOnly;
    }
  }
  return null;
}

/**
 * 社員の直前の付与基準日を取得
 */
export function getPreviousGrantDate(
  joinDate: Date,
  cfg: AppConfig,
  today: Date = new Date()
): Date | null {
  let prev: Date | null = null;
  const todayOnly = toDateOnly(today);
  for (const anchor of iterateAnchors(joinDate, cfg, today)) {
    const grantDateOnly = toDateOnly(anchor.grantDate);
    // 付与日が今日以前の場合
    if (grantDateOnly.getTime() <= todayOnly.getTime()) {
      prev = grantDateOnly;
    } else {
      break;
    }
  }
  return prev;
}

