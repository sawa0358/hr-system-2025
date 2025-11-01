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
const APPLICABLE_EMPLOYMENT_TYPES = ['正社員', 'パート', 'パートタイム', '契約社員', '派遣社員'];

/**
 * 雇用形態が有給計算の対象かどうかを判定
 * パート関連の雇用形態も含める（柔軟な判定）
 */
export function isApplicableEmploymentType(employeeType: string | null | undefined): boolean {
  if (!employeeType) return false;
  const normalized = employeeType.trim()
  
  // 完全一致チェック
  if (APPLICABLE_EMPLOYMENT_TYPES.includes(normalized)) {
    return true
  }
  
  // 部分一致チェック（パート関連）
  if (normalized.includes('パート') || normalized.toLowerCase().includes('part')) {
    return true
  }
  
  // 正社員関連
  if (normalized === '正社員' || normalized.toLowerCase().includes('fulltime')) {
    return true
  }
  
  return false
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
 * 雇用形態に関わらず、すべてのパターンを使用可能にする
 */
export function validateVacationPattern(
  employeeType: string | null | undefined,
  vacationPattern: VacationPattern | null,
  weeklyPattern: number | null | undefined
): { valid: boolean; error?: string } {
  // パターン値が設定されていない場合はエラー
  if (!vacationPattern) {
    return { valid: false, error: 'パターン値が設定されていません' };
  }
  
  // パターンAの場合は検証なし（どの雇用形態でも使用可能）
  if (vacationPattern === 'A') {
    return { valid: true };
  }
  
  // パートパターン（B-1〜B-4）の場合
  const wp = getWeeklyPatternFromVacationPattern(vacationPattern);
  if (wp === null) {
    return { valid: false, error: '無効なパターン値です' };
  }
  
  // 週勤務日数との整合性チェック
  if (weeklyPattern !== null && weeklyPattern !== wp) {
    return { valid: false, error: `パターン値（${vacationPattern}）と週勤務日数（${weeklyPattern}）が一致しません` };
  }
  
  // B-1〜B-4はどの雇用形態でも使用可能
  if (wp >= 1 && wp <= 4) {
    return { valid: true };
  }
  
  return { valid: false, error: '無効なパターン値です' };
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

