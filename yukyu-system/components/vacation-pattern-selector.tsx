// 有給計算パターン選択コンポーネント
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { getPatternLabel, type VacationPattern } from "@/lib/vacation-pattern"

interface VacationPatternSelectorProps {
  employeeId: string
  employeeType: string | null | undefined
  currentPattern: VacationPattern | null | undefined
  currentWeeklyPattern?: number | null | undefined
  onPatternChange?: (pattern: VacationPattern | null) => void
  readonly?: boolean
}

export function VacationPatternSelector({
  employeeId,
  employeeType,
  currentPattern,
  currentWeeklyPattern,
  onPatternChange,
  readonly = false,
}: VacationPatternSelectorProps) {
  const [pattern, setPattern] = useState<VacationPattern | null>(currentPattern || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPattern(currentPattern || null)
  }, [currentPattern])

  // パターンオプションを生成（全パターン）
  // 雇用形態に関わらず、すべてのパターンを表示
  const patternOptions: Array<{ value: VacationPattern; label: string }> = [
    { value: 'A', label: 'パターンA（正社員用）' },
    { value: 'B-1', label: 'パターンB-1（週1日勤務）' },
    { value: 'B-2', label: 'パターンB-2（週2日勤務）' },
    { value: 'B-3', label: 'パターンB-3（週3日勤務）' },
    { value: 'B-4', label: 'パターンB-4（週4日勤務）' },
  ]

  // 雇用形態に関わらず、すべてのパターンを表示
  const availableOptions = patternOptions

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('[VacationPatternSelector]', {
      employeeId,
      employeeType: employeeType?.trim() || '未設定',
      availableOptionsCount: availableOptions.length,
      availableOptions: availableOptions.map(o => o.value),
      currentPattern,
    })
  }

  const handlePatternChange = async (newPattern: VacationPattern) => {
    if (readonly) return

    setLoading(true)
    try {
      const weeklyPattern = newPattern?.startsWith('B-') ? parseInt(newPattern.split('-')[1], 10) : null

      const response = await fetch(`/api/vacation/employee/${employeeId}/pattern`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vacationPattern: newPattern,
          weeklyPattern,
        }),
      })

      if (response.ok) {
        setPattern(newPattern)
        onPatternChange?.(newPattern)
      } else {
        const error = await response.json()
        alert(error.error || 'パターン値の更新に失敗しました')
      }
    } catch (error) {
      console.error('パターン値更新エラー:', error)
      alert('パターン値の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-[9px] text-muted-foreground">有給計算パターン</label>
      <Select
        value={pattern || ''}
        onValueChange={(value) => handlePatternChange(value as VacationPattern)}
        disabled={loading || readonly || availableOptions.length === 0}
      >
        <SelectTrigger className="h-7 text-[11px]">
          <SelectValue placeholder="パターンを選択">
            {pattern ? getPatternLabel(pattern) : '未設定'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableOptions.length === 0 ? (
            <SelectItem value="" disabled>
              該当するパターンがありません（雇用形態: {employeeType || '未設定'}）
            </SelectItem>
          ) : (
            availableOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {pattern && (
        <p className="text-[9px] text-muted-foreground">
          {getPatternLabel(pattern)}
        </p>
      )}
    </div>
  )
}

