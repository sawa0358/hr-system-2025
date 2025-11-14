'use client'

import { useState } from 'react'
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
import { TimeEntry } from '@/lib/workclock/types'
import { addTimeEntry, updateTimeEntry, deleteTimeEntry } from '@/lib/workclock/api-storage'
import { calculateDuration, formatDuration } from '@/lib/workclock/time-utils'
import { Trash2, Plus, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string
  selectedDate: Date
  existingEntries: TimeEntry[]
  onClose: () => void
  initialHour?: number | null
  initialStartTime?: string | null
  initialEndTime?: string | null
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  workerId,
  selectedDate,
  existingEntries,
  onClose,
  initialHour,
  initialStartTime,
  initialEndTime,
}: TimeEntryDialogProps) {
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
  const [breakMinutes, setBreakMinutes] = useState('60')
  const [notes, setNotes] = useState('')

  const dateStr = selectedDate.toISOString().split('T')[0]
  const formattedDate = selectedDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const handleAddEntry = () => {
    addTimeEntry({
      workerId,
      date: dateStr,
      startTime,
      endTime,
      breakMinutes: parseInt(breakMinutes) || 0,
      notes,
    })
    
    // Reset form
    setStartTime('09:00')
    setEndTime('18:00')
    setBreakMinutes('60')
    setNotes('')
    onClose()
  }

  const handleDeleteEntry = (id: string) => {
    deleteTimeEntry(id)
    onClose()
  }

  const duration = calculateDuration(startTime, endTime, parseInt(breakMinutes) || 0)
  
  const totalDayHours = existingEntries.reduce((total, entry) => {
    const entryDuration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    return total + entryDuration.hours + entryDuration.minutes / 60
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
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
                    本日合計: {totalDayHours.toFixed(2)}時間
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="ml-4"
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border-2 border-dashed p-6">
            <h3 className="flex items-center text-lg font-semibold">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              新規勤務記録を追加
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-base font-medium">開始時刻</Label>
                <TimeGridSelect 
                  value={startTime} 
                  onChange={setStartTime}
                  label="開始時刻を選択（5分刻み）"
                  initialHour={initialHour}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-base font-medium">終了時刻</Label>
                <TimeGridSelect 
                  value={endTime} 
                  onChange={setEndTime}
                  label="終了時刻を選択（5分刻み）"
                  initialHour={initialHour}
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
                  className="text-base"
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
              <Label htmlFor="notes" className="text-base font-medium">メモ（任意）</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="作業内容やメモを入力..."
                rows={3}
                className="text-base"
              />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
