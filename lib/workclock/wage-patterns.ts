export type WagePatternKey = 'A' | 'B' | 'C'

export interface WagePatternLabels {
  A: string
  B: string
  C: string
}

const STORAGE_KEY = 'workclock_wage_pattern_labels'

const DEFAULT_LABELS: WagePatternLabels = {
  A: 'Aパターン',
  B: 'Bパターン',
  C: 'Cパターン',
}

function resolveStorageKey(scopeKey?: string) {
  if (!scopeKey) return STORAGE_KEY
  return `${STORAGE_KEY}:${scopeKey}`
}

export function getWagePatternLabels(scopeKey?: string): WagePatternLabels {
  if (typeof window === 'undefined') {
    return DEFAULT_LABELS
  }

  try {
    const raw = window.localStorage.getItem(resolveStorageKey(scopeKey))
    if (!raw) return DEFAULT_LABELS

    const parsed = JSON.parse(raw) as Partial<WagePatternLabels>
    return {
      A: parsed.A || DEFAULT_LABELS.A,
      B: parsed.B || DEFAULT_LABELS.B,
      C: parsed.C || DEFAULT_LABELS.C,
    }
  } catch (error) {
    console.warn('[WorkClock] 時給パターン名の読み込みに失敗しました:', error)
    return DEFAULT_LABELS
  }
}

export function saveWagePatternLabels(labels: WagePatternLabels, scopeKey?: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(resolveStorageKey(scopeKey), JSON.stringify(labels))
  } catch (error) {
    console.warn('[WorkClock] 時給パターン名の保存に失敗しました:', error)
  }
}


