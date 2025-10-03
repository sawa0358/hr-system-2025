"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"

interface Task {
  id: string
  title: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: string
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
}

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, day)
    })
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            締切カレンダー
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              今日
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentDate, "yyyy年 M月", { locale: ja })}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-semibold py-2 ${
                index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-slate-700"
              }`}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map((day) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentDay = isToday(day)
            const dayOfWeek = day.getDay()

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border rounded-lg ${
                  isCurrentDay ? "bg-blue-50 border-blue-300" : "bg-white border-slate-200"
                } ${!isSameMonth(day, currentDate) ? "opacity-50" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentDay
                      ? "text-blue-700"
                      : dayOfWeek === 0
                        ? "text-red-600"
                        : dayOfWeek === 6
                          ? "text-blue-600"
                          : "text-slate-700"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className={`w-full text-left px-2 py-1 rounded text-xs truncate ${PRIORITY_COLORS[task.priority]} hover:opacity-80 transition-opacity`}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-500 text-center">+{dayTasks.length - 3}件</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm text-slate-600">重要度:</span>
          <Badge className="bg-red-100 text-red-700">高</Badge>
          <Badge className="bg-yellow-100 text-yellow-700">中</Badge>
          <Badge className="bg-blue-100 text-blue-700">低</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
