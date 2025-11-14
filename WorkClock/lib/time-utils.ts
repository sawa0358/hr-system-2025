export function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      times.push(`${h}:${m}`)
    }
  }
  return times
}

export function calculateDuration(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): { hours: number; minutes: number } {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute

  // Handle overnight shifts
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60
  }

  const workMinutes = endTotalMinutes - startTotalMinutes - breakMinutes
  const hours = Math.floor(workMinutes / 60)
  const minutes = workMinutes % 60

  return { hours, minutes }
}

export function formatDuration(hours: number, minutes: number): string {
  return `${hours}時間${minutes}分`
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    days.push(new Date(date))
  }

  return days
}

export function getMonthlyTotal(entries: TimeEntry[]): { hours: number; minutes: number } {
  let totalMinutes = 0

  entries.forEach((entry) => {
    const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    totalMinutes += duration.hours * 60 + duration.minutes
  })

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}
