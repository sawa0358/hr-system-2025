'use client'

import { useState, MouseEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimeEntry, Worker } from '@/lib/workclock/types'
import { calculateDuration } from '@/lib/workclock/time-utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeEntryDialog } from './time-entry-dialog'

interface WeekViewProps {
  workerId: string
  employeeId?: string | null
  worker?: Worker | null
  entries: TimeEntry[]
  onEntriesChange: () => void
  canEditEntries?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 60 // pixels per hour

export function WeekView({ workerId, employeeId, worker, entries, onEntriesChange, canEditEntries = true }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ date: Date; minutes: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ date: Date; minutes: number } | null>(null)
  const [dragStartTime, setDragStartTime] = useState<string | null>(null)
  const [dragEndTime, setDragEndTime] = useState<string | null>(null)

  const getWeekDates = (date: Date): Date[] => {
    const current = new Date(date)
    const day = current.getDay()
    const diff = current.getDate() - day
    const sunday = new Date(current.setDate(diff))
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return d
    })
  }

  const weekDates = getWeekDates(currentDate)
  const weekDayLabels = ['日', '月', '火', '水', '木', '金', '土']

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const getEntriesForDate = (date: Date): TimeEntry[] => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
    return entries.filter((e) => e.date === dateStr)
  }

  const getWeekTotal = (): string => {
    let totalMinutes = 0
    weekDates.forEach((date) => {
      const dayEntries = getEntriesForDate(date)
      dayEntries.forEach((entry) => {
        const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
        totalMinutes += duration.hours * 60 + duration.minutes
      })
    })

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const getEntryPosition = (entry: TimeEntry) => {
    const startMinutes = timeToMinutes(entry.startTime)
    const endMinutes = timeToMinutes(entry.endTime)
    const duration = endMinutes - startMinutes

    const top = (startMinutes / 60) * HOUR_HEIGHT
    const height = (duration / 60) * HOUR_HEIGHT

    return { top, height }
  }

  const handleDateClick = (date: Date, hour?: number) => {
    setSelectedDate(date)
    setSelectedHour(hour ?? null)
    setIsDialogOpen(true)
  }

  const handleMouseDown = (date: Date, hour: number, event: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)

    const totalMinutesBase = hour * 60
    const target = event.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const offsetY = event.clientY - rect.top

    // 1時間セルの前半・後半で 00 / 30 分を決定
    let minutesOffset = offsetY < HOUR_HEIGHT / 2 ? 0 : 30
    const minutes = totalMinutesBase + minutesOffset

    setDragStart({ date, minutes })
    setDragEnd({ date, minutes })
  }

  const handleMouseEnter = (date: Date, hour: number, event: MouseEvent<HTMLDivElement>) => {
    if (isDragging && dragStart) {
      // 同じ日付内でのみドラッグを許可
      if (date.toDateString() === dragStart.date.toDateString()) {
        const totalMinutesBase = hour * 60
        const target = event.currentTarget as HTMLDivElement
        const rect = target.getBoundingClientRect()
        const offsetY = event.clientY - rect.top

        // 1時間セルの前半・後半で 00 / 30 分を決定
        let minutesOffset = offsetY < HOUR_HEIGHT / 2 ? 0 : 30
        const minutes = totalMinutesBase + minutesOffset

        setDragEnd({ date, minutes })
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const minMinutes = Math.min(dragStart.minutes, dragEnd.minutes)
      let maxMinutes = Math.max(dragStart.minutes, dragEnd.minutes)
      // 少なくとも30分の幅を確保
      if (maxMinutes === minMinutes) {
        maxMinutes = Math.min(minMinutes + 30, 24 * 60)
      }

      const startTotal = Math.min(minMinutes, maxMinutes)
      const endTotal = Math.max(minMinutes, maxMinutes)

      const startHour = Math.floor(startTotal / 60)
      const startMinute = startTotal % 60
      const endHour = Math.floor(endTotal / 60)
      const endMinute = endTotal % 60

      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute
        .toString()
        .padStart(2, '0')}`
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

      setSelectedDate(dragStart.date)
      setDragStartTime(startTime)
      setDragEndTime(endTime)
      setIsDialogOpen(true)
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }
  const isSegmentSelected = (date: Date, hour: number, segment: 0 | 1): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false
    if (date.toDateString() !== dragStart.date.toDateString()) return false

    const minMinutes = Math.min(dragStart.minutes, dragEnd.minutes)
    let maxMinutes = Math.max(dragStart.minutes, dragEnd.minutes)
    if (maxMinutes === minMinutes) {
      maxMinutes = Math.min(minMinutes + 30, 24 * 60)
    }

    const segmentStart = hour * 60 + segment * 30
    const segmentEnd = segmentStart + 30

    return segmentEnd > minMinutes && segmentStart < maxMinutes
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedDate(null)
    setSelectedHour(null)
    setDragStartTime(null)
    setDragEndTime(null)
    onEntriesChange()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekRange = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} - ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{weekRange}</h2>
          <div className="text-sm text-muted-foreground">
            週合計: <span className="font-semibold text-foreground">{getWeekTotal()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            今週
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="relative max-h-[calc(100vh-280px)] overflow-auto">
        <div className="flex min-w-max" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {/* Time labels */}
          <div className="sticky left-0 z-20 w-16 flex-shrink-0 border-r bg-card shadow-sm">
            <div className="h-16 border-b bg-card" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b bg-card text-xs text-muted-foreground"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <div className="absolute -top-2 right-2 pr-2 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex flex-1">
            {weekDates.map((date, index) => {
              const dayEntries = getEntriesForDate(date)
              const isToday = date.getTime() === today.getTime()
              const dayOfWeek = date.getDay()

              return (
                <div
                  key={date.toISOString()}
                  className="relative min-w-[140px] flex-1 border-r last:border-r-0"
                >
                  {/* Day header */}
                  <div
                    className={cn(
                      'sticky top-0 z-10 flex h-16 flex-col items-center justify-center border-b bg-card',
                      isToday && 'bg-primary/10'
                    )}
                  >
                    <div
                      className={cn(
                        'text-xs font-medium',
                        dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                            ? 'text-blue-500'
                            : 'text-muted-foreground'
                      )}
                    >
                      {weekDayLabels[index]}
                    </div>
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        isToday && 'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground'
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Hour cells */}
                  <div className="relative">
                    {HOURS.map((hour) => {
                      const topSelected = isSegmentSelected(date, hour, 0)
                      const bottomSelected = isSegmentSelected(date, hour, 1)

                      return (
                        <div
                          key={hour}
                          className="relative cursor-pointer border-b transition-colors hover:bg-accent/30"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          onMouseDown={(e) => handleMouseDown(date, hour, e)}
                          onMouseEnter={(e) => handleMouseEnter(date, hour, e)}
                        >
                          {/* 上半分（00〜30分）の反転 */}
                          <div
                            className={cn(
                              'pointer-events-none absolute inset-x-0 top-0 h-1/2',
                              topSelected && 'bg-sky-400/40 ring-2 ring-sky-500/70'
                            )}
                          />
                          {/* 下半分（30〜60分）の反転 */}
                          <div
                            className={cn(
                              'pointer-events-none absolute inset-x-0 bottom-0 h-1/2',
                              bottomSelected && 'bg-sky-400/40 ring-2 ring-sky-500/70'
                            )}
                          />
                          {/* 30分位置の点線 */}
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-muted-foreground/40" />
                        </div>
                      )
                    })}

                    {/* Time entries */}
                    {dayEntries.map((entry) => {
                      const { top, height } = getEntryPosition(entry)
                      const duration = calculateDuration(
                        entry.startTime,
                        entry.endTime,
                        entry.breakMinutes
                      )

                      return (
                        <div
                          key={entry.id}
                          className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md bg-sky-500/85 p-1.5 text-xs text-white shadow-md ring-2 ring-sky-600/90 transition-all hover:bg-sky-500"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '30px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDateClick(date)
                          }}
                        >
                          <div className="truncate font-semibold">
                            {entry.startTime} - {entry.endTime}
                          </div>
                          {height > 40 && (
                            <div className="mt-0.5 truncate text-[10px] opacity-90">
                              {duration.hours}h {duration.minutes}m
                            </div>
                          )}
                          {height > 55 && entry.notes && (
                            <div className={cn(
                              "mt-1 text-[10px] opacity-80 break-words",
                              height > 90 ? "line-clamp-3" : "line-clamp-2"
                            )}>
                              {entry.notes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {selectedDate && (
        <TimeEntryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          workerId={workerId}
          selectedDate={selectedDate}
          existingEntries={getEntriesForDate(selectedDate)}
          onClose={handleDialogClose}
          initialHour={selectedHour}
          initialStartTime={dragStartTime}
          initialEndTime={dragEndTime}
          employeeId={employeeId}
          worker={worker}
          canEditEntries={canEditEntries}
        />
      )}
    </div>
  )
}
