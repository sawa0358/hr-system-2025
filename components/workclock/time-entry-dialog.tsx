'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TimeGridSelect } from './time-grid-select'
import { TimeEntry, Worker } from '@/lib/workclock/types'
import { addTimeEntry, updateTimeEntry, deleteTimeEntry } from '@/lib/workclock/api-storage'
import { getWagePatternLabels } from '@/lib/workclock/wage-patterns'
import { calculateDuration, formatDuration } from '@/lib/workclock/time-utils'
import { Trash2, Plus, Clock, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChecklistPanel } from './checklist-panel'
import { api } from '@/lib/workclock/api'

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string
  employeeId?: string | null
  worker?: Worker | null
  selectedDate: Date
  existingEntries: TimeEntry[]
  onClose: () => void
  initialHour?: number | null
  initialStartTime?: string | null
  initialEndTime?: string | null
  canEditEntries?: boolean
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  workerId,
  employeeId,
  worker,
  selectedDate,
  existingEntries,
  onClose,
  initialHour,
  initialStartTime,
  initialEndTime,
  canEditEntries = true,
}: TimeEntryDialogProps) {
  const { currentUser } = useAuth()

  // 編集権限の最終判定
  const readOnly = (() => {
    if (!canEditEntries) return true

    const role = currentUser?.role
    // マネージャー・総務・管理者は常に編集可能
    if (role === 'manager' || role === 'hr' || role === 'admin') {
      return false
    }

    // それ以外は「2日前以前」をロック。ただし個別許可があればOK
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(selectedDate)
    target.setHours(0, 0, 0, 0)
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(now.getDate() - 2)

    const isPastEntry = target <= twoDaysAgo

    // 過去記録の編集許可がある場合は編集可能
    if (isPastEntry && worker?.allowPastEntryEdit) {
      return false
    }

    return isPastEntry
  })()


  const handleOpenChange = (isOpen: boolean) => {
    const hasAnyDirty = Object.values(isChecklistDirtyByPatternId).some(Boolean)
    if (!isOpen && hasAnyDirty) {
      if (!window.confirm('チェックリストの変更が保存されていません。保存せずに閉じると変更内容は破棄されます。\nよろしいですか？')) {
        return
      }
    }
    onOpenChange(isOpen)
  }

  const getInitialTimes = () => {
    if (initialStartTime && initialEndTime) {
      return { startTime: initialStartTime, endTime: initialEndTime }
    }
    if (initialHour !== null && initialHour !== undefined) {
      const startTime = `${initialHour.toString().padStart(2, '0')}:00`
      const endTime = `${initialHour.toString().padStart(2, '0')}:55`
      return { startTime, endTime }
    }
    return { startTime: '09:00', endTime: '18:00' }
  }

  const initialTimes = getInitialTimes()
  const [startTime, setStartTime] = useState(initialTimes.startTime)
  const [endTime, setEndTime] = useState(initialTimes.endTime)
  const [breakMinutes, setBreakMinutes] = useState('0')
  const [notes, setNotes] = useState('')
  const [wagePattern, setWagePattern] = useState<'A' | 'B' | 'C'>('A')
  const [countPattern, setCountPattern] = useState<'A' | 'B' | 'C'>('A')
  const [count, setCount] = useState('1')
  const [billingType, setBillingType] = useState<'hourly' | 'count' | 'both' | 'none'>('hourly')
  const [checklistReward, setChecklistReward] = useState(0)
  // 各パターンごとの状態を保持するMap
  const [checklistStateByPatternId, setChecklistStateByPatternId] = useState<Record<string, { checkedItems: Record<string, boolean>; freeTextValues: Record<string, string>; memo: string; photoUrl: string; photos: string[]; items: any[] }>>({}
  )
  const [isSavingChecklist, setIsSavingChecklist] = useState(false)
  const [isChecklistDirtyByPatternId, setIsChecklistDirtyByPatternId] = useState<Record<string, boolean>>({})

  // UI状態管理（window.confirm/alertの代替）
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedChecklistPatternId, setSelectedChecklistPatternId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // DB優先でパターン名を取得（localStorage はフォールバック）
  const scopeKey = employeeId || workerId
  const baseLabels = getWagePatternLabels(scopeKey)
  const wageLabels = {
    A: worker?.wagePatternLabelA || baseLabels.A,
    B: worker?.wagePatternLabelB || baseLabels.B,
    C: worker?.wagePatternLabelC || baseLabels.C,
  }
  const countLabels = {
    A: worker?.countPatternLabelA || '回数Aパターン',
    B: worker?.countPatternLabelB || '回数Bパターン',
    C: worker?.countPatternLabelC || '回数Cパターン',
  }

  const hasHourlyPattern =
    !!worker &&
    ((typeof worker.hourlyRate === 'number' && worker.hourlyRate > 0) ||
      (typeof worker.hourlyRateB === 'number' && worker.hourlyRateB > 0) ||
      (typeof worker.hourlyRateC === 'number' && worker.hourlyRateC > 0))

  const hasCountPattern =
    !!worker &&
    ((typeof worker.countRateA === 'number' && worker.countRateA > 0) ||
      (typeof worker.countRateB === 'number' && worker.countRateB > 0) ||
      (typeof worker.countRateC === 'number' && worker.countRateC > 0))

  const hasAnyPattern = hasHourlyPattern || hasCountPattern

  const dateStr = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
  const formattedDate = selectedDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  // モーダルを開くたびに、開始・終了時刻を最新のドラッグ／クリック結果で初期化する
  useEffect(() => {
    if (!open) return
    // 全パターンのDirty状態をリセット
    setIsChecklistDirtyByPatternId({})
    setChecklistStateByPatternId({})
    if (wagePattern === 'B' && !worker?.hourlyRateB) {
      setWagePattern('A')
    } else if (wagePattern === 'C' && !worker?.hourlyRateC) {
      setWagePattern('A')
    } else {
      setWagePattern('A')
    }
    setBreakMinutes('0')
    setNotes('')
    setCountPattern('A')
    setCount('1')

    // 計上方法を決定
    let initialBillingType: 'hourly' | 'count' | 'both' | 'none' = 'none'
    if (hasAnyPattern) {
      // 両方持っている場合はデフォルトで「時給＋回数」
      if (hasHourlyPattern && hasCountPattern) {
        initialBillingType = 'both'
      } else {
        initialBillingType = hasHourlyPattern ? 'hourly' : 'count'
      }
    }
    setBillingType(initialBillingType)

    // 回数パターンのみの場合は開始・終了時刻を0:00にする
    if (initialBillingType === 'count') {
      setStartTime('0:00')
      setEndTime('0:00')
    } else {
      const times = getInitialTimes()
      setStartTime(times.startTime)
      setEndTime(times.endTime)
    }

    // チェックリストパターンの初期化
    if (worker?.checklistPatterns && worker.checklistPatterns.length > 0) {
      setSelectedChecklistPatternId(worker.checklistPatterns[0].id)
    } else if (worker?.checklistPatternId) {
      setSelectedChecklistPatternId(worker.checklistPatternId)
    } else {
      setSelectedChecklistPatternId(null)
    }
  }, [open, dateStr, initialHour, initialStartTime, initialEndTime, worker, hasAnyPattern, hasHourlyPattern, hasCountPattern])

  // 内部的な保存ロジック（Time Entry）
  const saveTimeEntryInternal = async (): Promise<boolean> => {
    // バリデーション
    setValidationError(null)
    if (!notes.trim()) {
      return false
    }
    if (!currentUser?.id) {
      setValidationError('ユーザー情報が取得できません。ページを再読み込みしてください。')
      console.error('WorkClock: currentUser.idが取得できません')
      return false
    }

    setIsSaving(true)
    try {
      const entryData: any = {
        workerId,
        date: dateStr,
        startTime,
        endTime,
        breakMinutes: parseInt(breakMinutes) || 0,
        notes,
      }

      // 報酬計上方法に応じて保存項目を分岐
      if (billingType === 'hourly' && hasHourlyPattern) {
        entryData.wagePattern = wagePattern
        entryData.countPattern = null
        entryData.count = null
      } else if (billingType === 'count' && hasCountPattern) {
        entryData.wagePattern = null
        entryData.countPattern = countPattern
        entryData.count = parseInt(count) || 1
      } else if (billingType === 'both' && hasHourlyPattern && hasCountPattern) {
        entryData.wagePattern = wagePattern
        entryData.countPattern = countPattern
        entryData.count = parseInt(count) || 1
      } else {
        entryData.wagePattern = null
        entryData.countPattern = null
        entryData.count = null
      }

      await addTimeEntry(entryData, currentUser.id)

      // 成功したらフォームをリセット
      setStartTime('09:00')
      setEndTime('18:00')
      setBreakMinutes('0')
      setNotes('')
      setWagePattern('A')
      setCountPattern('A')
      setCount('1')
      setValidationError(null)
      return true
    } catch (error) {
      console.error('勤務記録の追加エラー:', error)
      setValidationError('保存に失敗しました。もう一度お試しください。')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // 内部的な保存ロジック（Checklist）- 全パターンを保存
  const saveAllChecklistsInternal = async (silent: boolean = false): Promise<boolean> => {
    console.log('[saveAllChecklistsInternal] Start. Silent:', silent)

    if (!currentUser?.id) {
      console.warn('[saveAllChecklistsInternal] User missing')
      if (!silent) alert('ユーザー情報を取得できませんでした。')
      return false
    }

    // 保存対象のパターンを収集（Dirty状態または内容があるもの）
    const patternsToSave: { patternId: string; state: typeof checklistStateByPatternId[string] }[] = []

    for (const [patternId, state] of Object.entries(checklistStateByPatternId)) {
      if (!state || !state.items || state.items.length === 0) continue

      const isDirty = isChecklistDirtyByPatternId[patternId] ?? false
      const checkedCount = Object.values(state.checkedItems).filter(Boolean).length
      const hasFreeText = Object.values(state.freeTextValues).some((v: string) => v.trim() !== '')
      const hasContent = checkedCount > 0 || hasFreeText

      if (hasContent || isDirty) {
        patternsToSave.push({ patternId, state })
      }
    }

    console.log('[saveAllChecklistsInternal] Patterns to save:', patternsToSave.length)

    if (patternsToSave.length === 0) {
      if (silent) {
        console.log('[saveAllChecklistsInternal] Silent save skipped: No patterns to save')
        return true
      }
      // 手動保存時は確認
      const proceed = window.confirm('チェックされた項目がありません。そのまま保存しますか？')
      if (!proceed) return false
    }

    setIsSavingChecklist(true)
    try {
      for (const { patternId, state } of patternsToSave) {
        const submissionItems = state.items.map((item: any) => {
          const isChecked = item.isFreeText ? false : !!state.checkedItems[item.id]
          const freeTextValue = item.isFreeText ? (state.freeTextValues?.[item.id] || '') : null

          let reward = 0
          if (item.isFreeText) {
            if (freeTextValue && freeTextValue.trim() !== '') {
              reward = item.reward
            }
          } else if (isChecked) {
            reward = item.reward
          }

          return {
            itemId: item.id,
            title: item.title,
            isChecked,
            reward,
            isMandatory: item.isMandatory,
            isFreeText: !!item.isFreeText,
            freeTextValue,
          }
        })

        const finalTotalReward = submissionItems.reduce((acc: number, item: any) => acc + item.reward, 0)
        console.log(`[saveAllChecklistsInternal] Saving pattern ${patternId}: ${submissionItems.length} items, Total Reward: ${finalTotalReward}`)

        await api.checklist.submissions.create({
          workerId,
          date: dateStr,
          patternId,
          items: submissionItems,
          memo: state.memo,
          photoUrl: state.photoUrl,
          photos: state.photos || [],
          totalReward: finalTotalReward,
        })
      }

      console.log('[saveAllChecklistsInternal] All patterns saved successfully')
      // 保存完了後、全てのDirty状態をクリア
      setIsChecklistDirtyByPatternId({})

      return true
    } catch (error) {
      console.error('チェックリスト保存エラー:', error)
      if (!silent) alert('チェックリストの保存に失敗しました: ' + (error as any)?.message)
      return false
    } finally {
      setIsSavingChecklist(false)
    }
  }

  const handleAddEntry = async () => {
    const timeEntrySuccess = await saveTimeEntryInternal()
    if (!timeEntrySuccess) {
      if (!notes.trim()) {
        setValidationError('作業内容を入力してください（メモは必須です）。')
      }
      return
    }

    // 業務チェックリストが有効な場合、全パターンを保存
    if (worker?.isChecklistEnabled) {
      const hasAnyContent = Object.values(checklistStateByPatternId).some(state => {
        if (!state) return false
        const hasChecks = Object.values(state.checkedItems).some(Boolean)
        const hasFreeText = Object.values(state.freeTextValues).some((v: string) => v.trim() !== '')
        return hasChecks || hasFreeText
      })
      const hasAnyDirty = Object.values(isChecklistDirtyByPatternId).some(Boolean)

      if (hasAnyContent || hasAnyDirty) {
        await saveAllChecklistsInternal(true) // silent save
      }
    }

    onClose()
  }

  const handleDeleteEntry = async (id: string) => {
    if (!currentUser?.id) {
      console.error('WorkClock: currentUser.idが取得できません')
      return
    }
    try {
      await deleteTimeEntry(id, currentUser.id)
      setDeleteTargetId(null)
      onClose()
    } catch (error) {
      console.error('勤務記録の削除エラー:', error)
    }
  }

  // 削除確認を開始
  const confirmDelete = (id: string) => {
    setDeleteTargetId(id)
  }

  // 削除確認をキャンセル
  const cancelDelete = () => {
    setDeleteTargetId(null)
  }

  const duration = calculateDuration(startTime, endTime, parseInt(breakMinutes) || 0)

  const totalDayMinutes = existingEntries.reduce((total, entry) => {
    const entryDuration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    return total + entryDuration.hours * 60 + entryDuration.minutes
  }, 0)
  const totalDayHoursInt = Math.floor(totalDayMinutes / 60)
  const totalDayRemainMinutes = totalDayMinutes % 60

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] h-[92vh] overflow-hidden flex flex-col bg-slate-100 text-slate-900 p-0 gap-0 border-none shadow-2xl rounded-2xl">
        <Tabs defaultValue="time" className="flex flex-col h-full w-full">
          <div className="px-6 pt-5 pb-3 flex-none bg-[#bed8d8]/30 backdrop-blur-sm border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tight text-slate-800">勤務報告</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{formattedDate}</DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <TabsList className={`grid w-full bg-slate-200/60 p-0.5 h-10 rounded-xl ${worker?.isChecklistEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="time" className="text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
                <Clock className="w-4 h-4 mr-2" /> 勤務記録
              </TabsTrigger>
              {worker?.isChecklistEnabled && (
                <TabsTrigger value="checklist" className="text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> 業務チェック
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="time" className="flex-1 overflow-y-auto px-6 pb-6 pt-3 m-0 data-[state=inactive]:hidden scrollbar-thin">
            <div className="space-y-6 pr-1 max-w-4xl mx-auto">
              {existingEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">登録済み勤務記録</h3>
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        本日合計: {formatDuration(totalDayHoursInt, totalDayRemainMinutes)}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {existingEntries
                      .slice()
                      .sort((a, b) => {
                        // 登録が古い順（createdAt昇順）に並べる
                        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
                        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
                        return aTime - bTime
                      })
                      .map((entry) => {
                        const entryDuration = calculateDuration(
                          entry.startTime,
                          entry.endTime,
                          entry.breakMinutes
                        )

                        // パターン情報と金額を計算（PDF出力と同じロジック）
                        const pattern = (entry as any).wagePattern as 'A' | 'B' | 'C' | null
                        let hourlyAmount = 0
                        let hourlyLabel = ''
                        let hourlyInfo = ''

                        if (pattern === 'A' || pattern === 'B' || pattern === 'C') {
                          const rate =
                            pattern === 'A'
                              ? worker?.hourlyRate || 0
                              : pattern === 'B'
                                ? worker?.hourlyRateB || worker?.hourlyRate || 0
                                : worker?.hourlyRateC || worker?.hourlyRate || 0
                          const hours = entryDuration.hours + entryDuration.minutes / 60
                          hourlyAmount = Math.floor(hours * rate)
                          hourlyLabel =
                            pattern === 'A' ? wageLabels.A : pattern === 'B' ? wageLabels.B : wageLabels.C
                          const durationText = formatDuration(entryDuration.hours, entryDuration.minutes)
                          hourlyInfo = `${durationText}／${hourlyLabel}（¥${rate.toLocaleString()}）`
                        }

                        // 回数パターンの金額
                        let countInfo = ''
                        let countAmount = 0
                        if (entry.countPattern) {
                          const cPattern = entry.countPattern
                          const count = entry.count || 1
                          const cRate =
                            cPattern === 'A'
                              ? worker?.countRateA || 0
                              : cPattern === 'B'
                                ? worker?.countRateB || 0
                                : worker?.countRateC || 0
                          countAmount = count * cRate
                          const cLabel =
                            cPattern === 'A' ? countLabels.A :
                              cPattern === 'B' ? countLabels.B :
                                countLabels.C
                          countInfo = cRate > 0
                            ? `${cLabel}（${count}回×¥${cRate.toLocaleString()}）`
                            : `${cLabel}（${count}回）`
                        }

                        const subtotal = hourlyAmount + countAmount
                        const hourlyDisplay = hourlyInfo || hourlyLabel

                        let patternLabel = '-'
                        if (hourlyDisplay && countInfo) {
                          patternLabel = `${hourlyDisplay} ＋ ${countInfo}`
                        } else if (hourlyDisplay) {
                          patternLabel = hourlyDisplay
                        } else if (countInfo) {
                          patternLabel = countInfo
                        }

                        return (
                          <Card key={entry.id} className="border-l-4 border-l-primary/50">
                            <CardContent className="flex items-center justify-between p-4">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="text-base font-semibold font-mono">
                                    {entry.startTime} - {entry.endTime}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    休憩 {entry.breakMinutes}分
                                  </span>
                                  <span className="text-base font-bold text-primary">
                                    {formatDuration(entryDuration.hours, entryDuration.minutes)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {patternLabel}
                                  </span>
                                  {subtotal > 0 && (
                                    <span className="text-base font-semibold">
                                      ¥{subtotal.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <strong>[メモ]</strong> {entry.notes}
                                  </p>
                                )}
                              </div>
                              {!readOnly && (
                                deleteTargetId === entry.id ? (
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteEntry(entry.id)}
                                    >
                                      削除
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={cancelDelete}
                                    >
                                      戻る
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDelete(entry.id)}
                                    className="ml-4"
                                  >
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                  </Button>
                                )
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </div>
              )}

              {existingEntries.length === 0 && readOnly && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                  <Clock className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-semibold text-lg text-slate-500">勤務記録はありません</p>
                  <div className="flex items-center mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    <Info className="w-4 h-4 mr-1.5" />
                    <span>編集期間外のため追加できません</span>
                  </div>
                </div>
              )}

              {!readOnly && (
                <div className="space-y-4 rounded-lg border-2 border-dashed p-6 bg-[#dce5e5] text-slate-900">
                  <h3 className="flex items-center text-lg font-semibold">
                    <Plus className="mr-2 h-5 w-5 text-primary" />
                    新規勤務記録を追加
                  </h3>

                  {hasAnyPattern && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium">計上方法</Label>
                        <Select
                          value={billingType}
                          onValueChange={(value: 'hourly' | 'count' | 'both' | 'none') => {
                            if (value === 'none') {
                              // UIからは通常選ばれないが型安全のためフォールバック
                              setBillingType(hasHourlyPattern ? 'hourly' : hasCountPattern ? 'count' : 'none')
                            } else {
                              setBillingType(value)
                              // 回数パターンのみに切り替えた場合は開始・終了時刻を0:00にする
                              if (value === 'count') {
                                setStartTime('0:00')
                                setEndTime('0:00')
                              } else if (billingType === 'count') {
                                // 回数パターンから他のパターンに切り替えた場合は通常の時刻に戻す
                                const times = getInitialTimes()
                                setStartTime(times.startTime)
                                setEndTime(times.endTime)
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white border border-slate-300 rounded-md shadow-sm">
                            <SelectValue placeholder="計上方法を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {hasHourlyPattern && (
                              <SelectItem value="hourly">時給パターンのみで計上</SelectItem>
                            )}
                            {hasCountPattern && (
                              <SelectItem value="count">回数パターンのみで計上</SelectItem>
                            )}
                            {hasHourlyPattern && hasCountPattern && (
                              <SelectItem value="both">時給＋回数の両方で計上</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          この勤務の報酬計算方法を選択してください（時給／回数／両方）。
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasHourlyPattern && (
                          <div className="space-y-2">
                            <Label className="text-base font-medium">時給パターン</Label>
                            <Select
                              value={wagePattern}
                              onValueChange={(value: 'A' | 'B' | 'C') => setWagePattern(value)}
                              disabled={
                                !(billingType === 'hourly' || billingType === 'both')
                              }
                            >
                              <SelectTrigger className="bg-white border border-slate-300 rounded-md shadow-sm">
                                <SelectValue placeholder={`${wageLabels.A}（デフォルト）`} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">
                                  {wageLabels.A}
                                  {worker?.hourlyRate && ` (¥${worker.hourlyRate.toLocaleString()})`}
                                </SelectItem>
                                <SelectItem
                                  value="B"
                                  disabled={!worker?.hourlyRateB}
                                  className={!worker?.hourlyRateB ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {wageLabels.B}
                                  {worker?.hourlyRateB
                                    ? ` (¥${worker.hourlyRateB.toLocaleString()})`
                                    : ' (未設定)'}
                                </SelectItem>
                                <SelectItem
                                  value="C"
                                  disabled={!worker?.hourlyRateC}
                                  className={!worker?.hourlyRateC ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {wageLabels.C}
                                  {worker?.hourlyRateC
                                    ? ` (¥${worker.hourlyRateC.toLocaleString()})`
                                    : ' (未設定)'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              計上方法で「時給パターンで計上」を選んだ場合に使用されます。
                            </p>
                          </div>
                        )}

                        {hasCountPattern && (
                          <div className="space-y-2">
                            <Label className="text-base font-medium">回数パターン</Label>
                            <Select
                              value={countPattern}
                              onValueChange={(value: 'A' | 'B' | 'C') => setCountPattern(value)}
                              disabled={
                                !hasCountPattern ||
                                !(billingType === 'count' || billingType === 'both')
                              }
                            >
                              <SelectTrigger
                                className={`bg-white border border-slate-300 rounded-md shadow-sm ${!hasCountPattern ? 'opacity-50' : ''
                                  } ${billingType === 'count' || billingType === 'both'
                                    ? 'ring-2 ring-primary'
                                    : ''
                                  }`}
                              >
                                <SelectValue placeholder="回数パターンを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="A"
                                  disabled={!worker?.countRateA}
                                  className={!worker?.countRateA ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {countLabels.A}
                                  {worker?.countRateA
                                    ? ` (¥${worker.countRateA.toLocaleString()}/回)`
                                    : ' (未設定)'}
                                </SelectItem>
                                <SelectItem
                                  value="B"
                                  disabled={!worker?.countRateB}
                                  className={!worker?.countRateB ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {countLabels.B}
                                  {worker?.countRateB
                                    ? ` (¥${worker.countRateB.toLocaleString()}/回)`
                                    : ' (未設定)'}
                                </SelectItem>
                                <SelectItem
                                  value="C"
                                  disabled={!worker?.countRateC}
                                  className={!worker?.countRateC ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  {countLabels.C}
                                  {worker?.countRateC
                                    ? ` (¥${worker.countRateC.toLocaleString()}/回)`
                                    : ' (未設定)'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {/* 回数パターンのみ／時給＋回数の両方を選んだときは、常に回数入力を表示 */}
                            {(billingType === 'count' || billingType === 'both') && (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCount(String(Math.max(1, parseInt(count || '1') - 1)))
                                  }
                                  className="h-8 w-8"
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={count}
                                  onChange={(e) => setCount(e.target.value)}
                                  min="1"
                                  className="text-center h-8 w-20"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCount(String((parseInt(count || '1') || 1) + 1))
                                  }
                                  className="h-8 w-8"
                                >
                                  +
                                </Button>
                                <span className="text-sm text-muted-foreground">回</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {hasCountPattern
                                ? billingType === 'count'
                                  ? '回数パターンのみで報酬を計上します。'
                                  : billingType === 'both'
                                    ? '時給パターンと回数パターンの両方で報酬を計上します。'
                                    : '計上方法で「回数パターンで計上」を選んだ場合に使用されます。'
                                : 'ワーカー編集で回数パターンの金額を設定してください。'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-base font-medium">開始時刻</Label>
                      <TimeGridSelect
                        value={startTime}
                        onChange={setStartTime}
                        label="開始時刻を選択（5分刻み）"
                        initialHour={initialHour}
                        startFromValue
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-base font-medium">終了時刻</Label>
                      <TimeGridSelect
                        value={endTime}
                        onChange={setEndTime}
                        label="終了時刻を選択（5分刻み）"
                        minTime={startTime}
                        startFromValue
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="break" className="text-base font-medium">休憩時間（分）</Label>
                      <Input
                        id="break"
                        type="number"
                        value={breakMinutes}
                        onChange={(e) => setBreakMinutes(e.target.value)}
                        min="0"
                        step="5"
                        className="text-base bg-white border border-slate-300 rounded-md shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">実働時間</Label>
                      <div className="flex h-10 items-center rounded-lg bg-primary/10 px-4">
                        <div className="text-xl font-bold text-primary">
                          {formatDuration(duration.hours, duration.minutes)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-base font-medium">
                      作業内容（必須）
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="text-base bg-white border border-slate-300 rounded-md shadow-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      作業内容を箇条書きなどで、簡潔に入力してください。
                    </p>
                  </div>

                  {validationError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                      {validationError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} size="lg" disabled={isSaving}>
                      キャンセル
                    </Button>
                    <Button onClick={handleAddEntry} size="lg" className="min-w-[120px]" disabled={isSaving}>
                      <Plus className="mr-2 h-4 w-4" />
                      {isSaving ? '保存中...' : '追加'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {worker?.isChecklistEnabled && (
            <TabsContent value="checklist" className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 m-0 data-[state=inactive]:hidden bg-[#f8fafc]">
              {worker?.checklistPatterns && worker.checklistPatterns.length > 1 && (
                <div className="px-6 py-2 bg-slate-50 border-b flex items-center gap-2 flex-none">
                  <Label className="whitespace-nowrap text-xs font-bold text-slate-500">パターン切替:</Label>
                  <Select value={selectedChecklistPatternId || ''} onValueChange={setSelectedChecklistPatternId}>
                    <SelectTrigger className="h-8 text-xs bg-white w-[200px]">
                      <SelectValue placeholder="パターンを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {worker.checklistPatterns.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ChecklistPanel
                worker={worker}
                workerId={workerId}
                patternId={selectedChecklistPatternId}
                selectedDate={selectedDate}
                onRewardChange={setChecklistReward}
                onStateChange={(state, isUserAction) => {
                  if (selectedChecklistPatternId) {
                    setChecklistStateByPatternId(prev => ({
                      ...prev,
                      [selectedChecklistPatternId]: state
                    }))
                    if (isUserAction) {
                      setIsChecklistDirtyByPatternId(prev => ({
                        ...prev,
                        [selectedChecklistPatternId]: true
                      }))
                    }
                  }
                }}
                readOnly={readOnly}
              />
              <div className="flex justify-end gap-3 p-4 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.02)] flex-none">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} size="sm" className="font-bold text-slate-500 hover:bg-slate-100 px-6 h-9">
                  キャンセル
                </Button>
                <Button
                  onClick={async () => {
                    console.log('=== チェックリスト保存開始 ===')

                    // 1. Time Entryの入力を確認し、あれば保存
                    let timeEntrySaved = false
                    if (notes && notes.trim() !== '') {
                      console.log('Time Entryの入力があります。自動保存します。')
                      const success = await saveTimeEntryInternal()
                      if (success) {
                        timeEntrySaved = true
                      }
                    }

                    // 2. 勤務記録があるか確認 (今回の自動保存も含める)
                    const hasEntriesIncludingNow = existingEntries.length > 0 || timeEntrySaved
                    if (!hasEntriesIncludingNow) {
                      const proceed = window.confirm('勤務記録に何も登録されていませんが、業務チェックのみ保存しますか？')
                      if (!proceed) return
                    }

                    // 3. 全パターンを保存
                    await saveAllChecklistsInternal()
                    onClose()
                  }}
                  size="sm"
                  className="min-w-[140px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow hover:shadow-md transition-all h-9 px-6"
                  disabled={isSavingChecklist}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {isSavingChecklist ? '保存中...' : '報告を送信して完了'}
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog >
  )
}
