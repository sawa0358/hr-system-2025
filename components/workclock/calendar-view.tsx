'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimeEntry } from '@/lib/workclock/types'
import { getDaysInMonth, calculateDuration, formatDuration } from '@/lib/workclock/time-utils'
import { ChevronLeft, ChevronRight, Plus, Calendar, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeEntryDialog } from './time-entry-dialog'
import { WeekView } from './week-view'
import { getWorkerBillingMeta, saveWorkerBillingMeta } from '@/lib/workclock/worker-billing-meta'
import { PasswordVerificationDialog } from '@/components/password-verification-dialog'
import { useAuth } from '@/lib/auth-context'

interface CalendarViewProps {
  workerId: string
  employeeId: string
  worker?: any
  entries: TimeEntry[]
  onEntriesChange: () => void
  actionButtons?: React.ReactNode
  // 月額固定の有無・ON/OFFはUI専用。現時点ではDBには保存されない。
  hasMonthlyFixed?: boolean
}

export function CalendarView({
  workerId,
  employeeId,
  worker,
  entries,
  onEntriesChange,
  actionButtons,
  hasMonthlyFixed: hasMonthlyFixedProp,
}: CalendarViewProps) {
  const { currentUser } = useAuth()

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMonthlyFixedOn, setIsMonthlyFixedOn] = useState(true)
  const [hasMonthlyFixed, setHasMonthlyFixed] = useState<boolean | undefined>(hasMonthlyFixedProp)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [pendingToggleState, setPendingToggleState] = useState<boolean | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getDaysInMonth(year, month)

  useEffect(() => {
    if (!employeeId) return
    const meta = getWorkerBillingMeta(employeeId)
    if (typeof hasMonthlyFixedProp === 'boolean') {
      setHasMonthlyFixed(hasMonthlyFixedProp)
    } else {
      setHasMonthlyFixed(meta.monthlyFixedAmount !== undefined && meta.monthlyFixedAmount > 0)
    }
    if (typeof meta.monthlyFixedOn === 'boolean') {
      setIsMonthlyFixedOn(meta.monthlyFixedOn)
    }
  }, [employeeId, hasMonthlyFixedProp])

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

  const handleMonthlyToggleClick = () => {
    if (!hasMonthlyFixed) return
    setPendingToggleState(!isMonthlyFixedOn)
    setIsPasswordDialogOpen(true)
  }

  const handleMonthlyToggleVerified = () => {
    if (pendingToggleState === null) return
    setIsMonthlyFixedOn(pendingToggleState)
    saveWorkerBillingMeta(employeeId, {
      monthlyFixedOn: pendingToggleState,
    })
    setPendingToggleState(null)
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
        <div className="flex items-center gap-3">
          {hasMonthlyFixed && (
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm',
                isMonthlyFixedOn
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/80 hover:bg-accent'
              )}
              onClick={handleMonthlyToggleClick}
            >
              {isMonthlyFixedOn ? (
                <ToggleRight className="h-4 w-4 text-primary" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">月額固定</span>
              <span className="text-[11px] text-muted-foreground">
                {isMonthlyFixedOn ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
          {actionButtons && (
            <div className="flex gap-2">
              {actionButtons}
            </div>
          )}
        </div>
      </div>

      {viewMode === 'week' ? (
        <WeekView
          workerId={workerId}
          employeeId={employeeId}
          worker={worker}
          entries={entries}
          onEntriesChange={onEntriesChange}
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
                      hasEntries && 'bg-accent/50'
                    )}
                  >
                    <div
                      className={cn(
                        'mb-1 text-sm font-medium',
                        dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-foreground'
                      )}
                    >
                      {date.getDate()}
                    </div>
                    {hasEntries ? (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-primary">{getDayTotal(date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {dayEntries.length}件
                        </div>
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
            />
          )}
        </>
      )}

      <PasswordVerificationDialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open)
          if (!open) {
            setPendingToggleState(null)
          }
        }}
        onVerified={handleMonthlyToggleVerified}
        currentUser={currentUser}
        actionType="workclock-billing"
      />
    </div>
  )
}
