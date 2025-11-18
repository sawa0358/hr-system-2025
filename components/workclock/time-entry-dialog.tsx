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
import { Trash2, Plus, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const readOnly = !canEditEntries
  
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

  // DB優先でパターン名を取得（localStorage はフォールバック）
  const scopeKey = employeeId || workerId
  const baseLabels = getWagePatternLabels(scopeKey)
  const wageLabels = {
    A: worker?.wagePatternLabelA || baseLabels.A,
    B: worker?.wagePatternLabelB || baseLabels.B,
    C: worker?.wagePatternLabelC || baseLabels.C,
  }

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
    const times = getInitialTimes()
    setStartTime(times.startTime)
    setEndTime(times.endTime)
    // 新規追加時は常にAパターンで初期化（選択されているパターンが無効な場合もAにフォールバック）
    if (wagePattern === 'B' && !worker?.hourlyRateB) {
      setWagePattern('A')
    } else if (wagePattern === 'C' && !worker?.hourlyRateC) {
      setWagePattern('A')
    } else {
      setWagePattern('A')
    }
    setBreakMinutes('0')
    setNotes('')
  }, [open, dateStr, initialHour, initialStartTime, initialEndTime, worker])

  const handleAddEntry = async () => {
    if (!window.confirm('追加しますか？後で変更はできません')) {
      return
    }
    if (!notes.trim()) {
      alert('作業内容を入力してください（メモは必須です）。')
      return
    }
    if (!currentUser?.id) {
      console.error('WorkClock: currentUser.idが取得できません')
      return
    }
    try {
      await addTimeEntry({
        workerId,
        date: dateStr,
        startTime,
        endTime,
        breakMinutes: parseInt(breakMinutes) || 0,
        notes,
        wagePattern,
      }, currentUser.id)
      
      // Reset form
      setStartTime('09:00')
      setEndTime('18:00')
      setBreakMinutes('0')
      setNotes('')
      setWagePattern('A')
      onClose()
    } catch (error) {
      console.error('勤務記録の追加エラー:', error)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('この勤務記録を削除しますか？この操作は元に戻せません。')) {
      return
    }
    if (!currentUser?.id) {
      console.error('WorkClock: currentUser.idが取得できません')
      return
    }
    try {
      await deleteTimeEntry(id, currentUser.id)
      onClose()
    } catch (error) {
      console.error('勤務記録の削除エラー:', error)
    }
  }

  const duration = calculateDuration(startTime, endTime, parseInt(breakMinutes) || 0)
  
  const totalDayMinutes = existingEntries.reduce((total, entry) => {
    const entryDuration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    return total + entryDuration.hours * 60 + entryDuration.minutes
  }, 0)
  const totalDayHoursInt = Math.floor(totalDayMinutes / 60)
  const totalDayRemainMinutes = totalDayMinutes % 60

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col bg-[#bed8d8] text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl">勤務時間の記録</DialogTitle>
          <DialogDescription className="text-base">{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
                {existingEntries.map((entry) => {
                  const entryDuration = calculateDuration(
                    entry.startTime,
                    entry.endTime,
                    entry.breakMinutes
                  )
                  return (
                    <Card key={entry.id} className="border-l-4 border-l-primary/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold font-mono">
                              {entry.startTime} - {entry.endTime}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              休憩 {entry.breakMinutes}分
                            </span>
                            <span className="text-base font-bold text-primary">
                              {formatDuration(entryDuration.hours, entryDuration.minutes)}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">{entry.notes}</p>
                          )}
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="ml-4"
                          >
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {!readOnly && (
            <div className="space-y-4 rounded-lg border-2 border-dashed p-6 bg-[#dce5e5] text-slate-900">
              <h3 className="flex items-center text-lg font-semibold">
                <Plus className="mr-2 h-5 w-5 text-primary" />
                新規勤務記録を追加
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">時給パターン</Label>
                <Select
                  value={wagePattern}
                  onValueChange={(value: 'A' | 'B' | 'C') => setWagePattern(value)}
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
                      className={!worker?.hourlyRateB ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {wageLabels.B}
                      {worker?.hourlyRateB ? ` (¥${worker.hourlyRateB.toLocaleString()})` : ' (未設定)'}
                    </SelectItem>
                    <SelectItem 
                      value="C" 
                      disabled={!worker?.hourlyRateC}
                      className={!worker?.hourlyRateC ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {wageLabels.C}
                      {worker?.hourlyRateC ? ` (¥${worker.hourlyRateC.toLocaleString()})` : ' (未設定)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  選択したパターンで勤務記録が保存されます。
                </p>
              </div>
              </div>

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

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
                  キャンセル
                </Button>
                <Button onClick={handleAddEntry} size="lg" className="min-w-[120px]">
                  <Plus className="mr-2 h-4 w-4" />
                  追加
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
