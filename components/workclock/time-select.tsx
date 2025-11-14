'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateTimeOptions } from '@/lib/workclock/time-utils'

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TimeSelect({ value, onChange, placeholder = '時刻を選択' }: TimeSelectProps) {
  const timeOptions = generateTimeOptions()

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
