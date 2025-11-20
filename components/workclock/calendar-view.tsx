'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimeEntry, Worker } from '@/lib/workclock/types'
import { getDaysInMonth, calculateDuration } from '@/lib/workclock/time-utils'
import { ChevronLeft, ChevronRight, Plus, Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeEntryDialog } from './time-entry-dialog'
import { WeekView } from './week-view'

interface CalendarViewProps {
  workerId: string
  employeeId?: string | null
  worker?: Worker | null
  entries: TimeEntry[]
  onEntriesChange: () => void
  actionButtons?: React.ReactNode
  canEditEntries?: boolean
}

export function CalendarView({
  workerId,
  employeeId,
  worker,
  entries,
  onEntriesChange,
  actionButtons,
  canEditEntries = true,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getEntriesForDate = (date: Date): TimeEntry[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
    return entries.filter((e) => e.date === dateStr)
  }

  const getDayTotal = (date: Date): string => {
    const dayEntries = getEntriesForDate(date)
    if (dayEntries.length === 0) return ''

    let totalMinutes = 0
    dayEntries.forEach((entry) => {
      const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
      totalMinutes += duration.hours * 60 + duration.minutes
    })

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedDate(null)
    onEntriesChange()
  }

  const monthName = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            月表示
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            週表示
          </Button>
        </div>
        {actionButtons && (
          <div className="flex gap-2">
            {actionButtons}
          </div>
        )}
      </div>

      {viewMode === 'week' ? (
        <WeekView
          workerId={workerId}
          employeeId={employeeId}
          worker={worker}
          entries={entries}
          onEntriesChange={onEntriesChange}
          canEditEntries={canEditEntries}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{monthName}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                今月
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

      {/* 勤務記録ロックに関する注意テキスト */}
      <p className="text-xs text-blue-600">
        毎月3日0:00以降は先月末締めの勤務記録は編集できなくなります
      </p>

          <Card className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    'py-2 text-center text-sm font-medium',
                    index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: days[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {days.map((date) => {
                const dayEntries = getEntriesForDate(date)
                const hasEntries = dayEntries.length > 0
                const isToday = date.getTime() === today.getTime()
                const dayOfWeek = date.getDay()

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'group relative min-h-[80px] rounded-lg border p-2 text-left transition-all hover:border-primary hover:shadow-sm',
                      isToday && 'border-primary bg-primary/5',
                      hasEntries && 'bg-sky-100 border-sky-300'
                    )}
                  >
                    <div
                      className={cn(
                        'mb-1 text-sm font-medium',
                        dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                            ? 'text-blue-500'
                            : 'text-foreground'
                      )}
                    >
                      {date.getDate()}
                    </div>
                    {hasEntries ? (
                      <div className="space-y-0.5">
                        {/* 各勤務の「◯h ＋ 作業内容」を1行ずつ表示（折り返さず truncate） */}
                        {dayEntries.map((entry) => {
                          const duration = calculateDuration(
                            entry.startTime,
                            entry.endTime,
                            entry.breakMinutes
                          )
                          const hoursDecimal =
                            duration.hours + duration.minutes / 60
                          const hoursLabel = `${hoursDecimal
                            .toFixed(1)
                            .replace(/\.0$/, '')}h`

                          return (
                            <div
                              key={entry.id}
                              className="flex items-center gap-1 text-[10px] text-foreground"
                            >
                              <span className="flex-shrink-0 font-semibold">
                                {hoursLabel}
                              </span>
                              {entry.notes && (
                                <span className="truncate max-w-full">
                                  {entry.notes}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center opacity-0 group-hover:opacity-100">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {selectedDate && (
            <TimeEntryDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              workerId={workerId}
              employeeId={employeeId}
              worker={worker}
              selectedDate={selectedDate}
              existingEntries={getEntriesForDate(selectedDate)}
              onClose={handleDialogClose}
              canEditEntries={canEditEntries}
            />
          )}
        </>
      )}
    </div>
  )
}
