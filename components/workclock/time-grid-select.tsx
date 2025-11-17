'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Clock, ChevronDown } from 'lucide-react'
import { generateTimeOptions } from '@/lib/workclock/time-utils'
import { cn } from '@/lib/utils'

interface TimeGridSelectProps {
  value: string
  onChange: (value: string) => void
  label: string
  initialHour?: number | null
  minTime?: string
  startFromValue?: boolean
}

export function TimeGridSelect({
  value,
  onChange,
  label,
  initialHour,
  minTime,
  startFromValue,
}: TimeGridSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const getTimeOptions = () => {
    // 1日分（00:00〜23:55）を 5 分刻みで生成
    let times = generateTimeOptions()

    // 終了時刻側では、開始時刻より前は選べないようにフィルタ
    if (minTime) {
      times = times.filter((time) => time >= minTime)
    }

    // 並び順は常に 00:00 → 23:55 のままにしておく
    // （デフォルト時刻の前後どちらにもスクロールできるようにする）
    return times
  }

  const timeOptions = getTimeOptions()

  const handleSelect = (time: string) => {
    onChange(time)
    setIsOpen(false)
  }

  // 外側クリック or スクロールでプルダウンを閉じる
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && scrollRef.current && value) {
      const selectedIndex = timeOptions.indexOf(value)
      if (selectedIndex !== -1) {
        // Scroll to center the selected item
        const itemHeight = 48 // height of each button
        const scrollPosition = selectedIndex * itemHeight - 200 // offset to center
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = Math.max(0, scrollPosition)
          }
        }, 0)
      }
    }
  }, [isOpen, value, timeOptions])

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left font-normal text-base h-12"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-lg">{value || '時刻を選択'}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full rounded-lg border bg-background shadow-lg">
          <div className="border-b bg-muted/50 px-4 py-3">
            <div className="text-sm font-medium">
              {label}
            </div>
          </div>
          
          <ScrollArea className="h-[400px]" ref={scrollRef}>
            <div className="flex flex-col p-1">
              {timeOptions.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={value === time ? 'default' : 'ghost'}
                  size="lg"
                  className={cn(
                    "h-12 justify-start font-mono text-lg w-full",
                    value === time && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleSelect(time)}
                >
                  {value === time && <Check className="mr-2 h-5 w-5" />}
                  {time}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
