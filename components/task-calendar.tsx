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
  labels?: { id: string; name: string; color: string }[]
  cardColor?: string
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

// ラベルの色からテキスト色を計算する関数
const getTextColorForBackground = (hexColor: string): string => {
  // ヘックスカラーをRGBに変換
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // 輝度を計算 (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // 輝度が0.5以上なら黒、それ以外なら白
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

// デフォルトの色（ラベルがない場合）
const DEFAULT_COLOR = "#94a3b8" // slate-400

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

  // タスクの表示色を取得（ラベルの色を優先）
  const getTaskColor = (task: Task) => {
    if (task.labels && task.labels.length > 0) {
      return task.labels[0].color
    }
    return DEFAULT_COLOR
  }

  // すべてのラベルを集めてユニークなものだけを取得（凡例用）
  const getAllUniqueLabels = () => {
    const labelMap = new Map<string, { name: string; color: string }>()
    tasks.forEach(task => {
      if (task.labels) {
        task.labels.forEach(label => {
          if (!labelMap.has(label.id)) {
            labelMap.set(label.id, { name: label.name, color: label.color })
          }
        })
      }
    })
    return Array.from(labelMap.values())
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
                  {dayTasks.slice(0, 3).map((task) => {
                    const bgColor = getTaskColor(task)
                    const textColor = getTextColorForBackground(bgColor)
                    return (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                      >
                        {task.title}
                      </button>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-500 text-center">+{dayTasks.length - 3}件</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
          <span className="text-sm text-slate-600">ラベル:</span>
          {getAllUniqueLabels().length > 0 ? (
            getAllUniqueLabels().map((label, index) => (
              <Badge 
                key={index}
                style={{
                  backgroundColor: label.color,
                  color: getTextColorForBackground(label.color)
                }}
              >
                {label.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-400">ラベルが設定されているタスクはありません</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
