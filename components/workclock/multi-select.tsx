'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { X, CheckIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type MultiSelectOption = string | { label: string; value: string }

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  readOnly?: boolean
  onClickDisabled?: () => void
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = '選択してください',
  readOnly = false,
  onClickDisabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Normalize options to { label, value } format
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt }
      }
      return opt
    })
  }, [options])

  const handleSelect = (value: string) => {
    if (readOnly) return
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleRemove = (value: string) => {
    if (readOnly) return
    onChange(selected.filter((s) => s !== value))
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-auto min-h-9",
            !selected.length && "text-muted-foreground",
            readOnly && "cursor-pointer opacity-60"
          )}
          onClick={() => {
            if (readOnly && onClickDisabled) {
              onClickDisabled()
              return
            }
          }}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selected.map((itemValue) => {
                const option = normalizedOptions.find(o => o.value === itemValue)
                const label = option ? option.label : itemValue
                return (
                  <Badge key={itemValue} variant="secondary" className="mr-1">
                    {label}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-70"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleRemove(itemValue)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemove(itemValue)
                      }}
                      aria-label={`${label}を削除`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                )
              })
            )}
          </div>
          <svg
            className="size-4 opacity-50 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={cn(
            'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-[120] min-w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-y-auto rounded-md border p-1 shadow-md',
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1'
          )}
          side="bottom"
          align="start"
          sideOffset={4}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              選択肢がありません
            </div>
          ) : (
            normalizedOptions.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-input'
                      )}
                    >
                      {isSelected && (
                        <CheckIcon className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </div>
              )
            })
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
