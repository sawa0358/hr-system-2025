export type WagePatternKey = 'A' | 'B' | 'C'

export interface WagePatternLabels {
  A: string
  B: string
  C: string
}

// NOTE:
//  - v2 以降は WorkClockWorker テーブルに
//    wagePatternLabelA / wagePatternLabelB / wagePatternLabelC を直接保存するため、
//    ここでは「DBから既に値が入っている前提でのデフォルト値」のみを提供する。
//  - 以前の localStorage ベースの実装は完全に廃止する。

const DEFAULT_LABELS: WagePatternLabels = {
  A: 'Aパターン',
  B: 'Bパターン',
  C: 'Cパターン',
}

/**
 * 旧実装との互換用ヘルパー。
 * 現在は DB 優先のため、scopeKey は無視し単なるデフォルトラベルを返す。
 *
 * 呼び出し側では必ず
 *   worker.wagePatternLabelA || baseLabels.A
 * のように「DB値を優先・なければこのデフォルト」を使う。
 */
export function getWagePatternLabels(_scopeKey?: string): WagePatternLabels {
  return DEFAULT_LABELS
}

/**
 * 以前は localStorage に時給パターン名を保存していたが、
 * 現在は WorkClockWorker テーブルに直接保存するため、何もしない空実装にする。
 * （互換性維持のため関数自体は残す）
 */
export function saveWagePatternLabels(_labels: WagePatternLabels, _scopeKey?: string) {
  // no-op: パターン名は全て DB 側に保存される
}

