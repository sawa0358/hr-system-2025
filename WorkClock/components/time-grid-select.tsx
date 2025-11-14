'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Clock } from 'lucide-react'
import { generateTimeOptions } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface TimeGridSelectProps {
  value: string
  onChange: (value: string) => void
  label: string
  initialHour?: number | null
}

export function TimeGridSelect({ value, onChange, label, initialHour }: TimeGridSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const getTimeOptions = () => {
    if (initialHour !== null && initialHour !== undefined) {
      // Generate times from initialHour:00 to initialHour:55 in 5 minute increments
      const times: string[] = []
      for (let minute = 0; minute < 60; minute += 5) {
        times.push(`${initialHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
      return times
    }
    return generateTimeOptions()
  }

  const timeOptions = getTimeOptions()

  const handleSelect = (time: string) => {
    onChange(time)
    setIsOpen(false)
  }

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
    <div className="relative space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal text-base h-12"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
        <span className="flex-1 font-mono text-lg">{value || '時刻を選択'}</span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full rounded-lg border bg-background shadow-lg">
          <div className="border-b bg-muted/50 px-4 py-3">
            <div className="text-sm font-medium">
              {label}
            </div>
            {initialHour !== null && initialHour !== undefined && (
              <div className="mt-1 text-xs text-muted-foreground">
                {initialHour.toString().padStart(2, '0')}:00 〜 {initialHour.toString().padStart(2, '0')}:55 の範囲
              </div>
            )}
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
