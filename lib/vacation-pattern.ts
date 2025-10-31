// 有給計算パターンの判定と変換ロジック
// 設計メモ準拠

/**
 * 雇用形態（employeeType）とパターン値（vacationPattern）から
 * 有給計算に使用するパターンを決定
 */
export type VacationPattern = 'A' | 'B-1' | 'B-2' | 'B-3' | 'B-4' | null;

/**
 * 適用対象の雇用形態
 */
const APPLICABLE_EMPLOYMENT_TYPES = ['正社員', 'パート', '契約社員', '派遣社員'];

/**
 * 雇用形態が有給計算の対象かどうかを判定
 */
export function isApplicableEmploymentType(employeeType: string | null | undefined): boolean {
  if (!employeeType) return false;
  return APPLICABLE_EMPLOYMENT_TYPES.includes(employeeType);
}

/**
 * 雇用形態（employeeType）からデフォルトのパターン値を決定
 * - 正社員、契約社員、派遣社員 → "A"
 * - パート → null（週勤務日数が必要なため明示的に設定が必要）
 */
export function getDefaultVacationPattern(employeeType: string | null | undefined): VacationPattern | null {
  if (!employeeType) return null;
  
  if (employeeType === '正社員' || employeeType === '契約社員' || employeeType === '派遣社員') {
    return 'A';
  }
  
  // パートの場合は週勤務日数が必要なため、nullを返す（明示的な設定が必要）
  if (employeeType === 'パート' || employeeType === 'パートタイム') {
    return null; // B-1, B-2, B-3, B-4 のいずれかを設定する必要がある
  }
  
  return null;
}

/**
 * パターン値から週勤務日数を取得
 */
export function getWeeklyPatternFromVacationPattern(pattern: VacationPattern): number | null {
  if (!pattern) return null;
  
  if (pattern === 'A') return null; // 正社員は週勤務日数なし
  
  const match = pattern.match(/^B-(\d)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * 週勤務日数からパターン値を生成
 */
export function getVacationPatternFromWeeklyPattern(weeklyPattern: number | null | undefined): VacationPattern | null {
  if (!weeklyPattern || weeklyPattern < 1 || weeklyPattern > 4) {
    return null;
  }
  
  return `B-${weeklyPattern}` as VacationPattern;
}

/**
 * パターン値と雇用形態の整合性をチェック
 */
export function validateVacationPattern(
  employeeType: string | null | undefined,
  vacationPattern: VacationPattern | null,
  weeklyPattern: number | null | undefined
): { valid: boolean; error?: string } {
  if (!isApplicableEmploymentType(employeeType)) {
    return { valid: true }; // 対象外の雇用形態は無視
  }
  
  if (!vacationPattern) {
    return { valid: false, error: 'パターン値が設定されていません' };
  }
  
  if (vacationPattern === 'A') {
    // 正社員パターン（A）の場合
    if (employeeType !== '正社員' && employeeType !== '契約社員' && employeeType !== '派遣社員') {
      return { valid: false, error: 'パターンAは正社員・契約社員・派遣社員のみ使用可能です' };
    }
    return { valid: true };
  }
  
  // パートパターン（B-1〜B-4）の場合
  const wp = getWeeklyPatternFromVacationPattern(vacationPattern);
  if (wp === null) {
    return { valid: false, error: '無効なパターン値です' };
  }
  
  if (weeklyPattern !== null && weeklyPattern !== wp) {
    return { valid: false, error: `パターン値（${vacationPattern}）と週勤務日数（${weeklyPattern}）が一致しません` };
  }
  
  if ((employeeType === 'パート' || employeeType === 'パートタイム') && wp >= 1 && wp <= 4) {
    return { valid: true };
  }
  
  return { valid: false, error: 'パートパターン（B-1〜B-4）はパートのみ使用可能です' };
}

/**
 * 表示用のパターンラベルを取得
 */
export function getPatternLabel(pattern: VacationPattern | null | undefined): string {
  if (!pattern) return '未設定';
  
  const labels: Record<VacationPattern, string> = {
    'A': 'パターンA（正社員用）',
    'B-1': 'パターンB-1（週1日勤務）',
    'B-2': 'パターンB-2（週2日勤務）',
    'B-3': 'パターンB-3（週3日勤務）',
    'B-4': 'パターンB-4（週4日勤務）',
  };
  
  return labels[pattern] || pattern;
}

