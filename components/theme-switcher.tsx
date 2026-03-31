'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppTheme } from '@/hooks/useAppTheme'
import { Button } from '@/components/ui/button'

interface ThemeSwitcherProps {
  collapsed?: boolean
}

export function ThemeSwitcher({ collapsed = false }: ThemeSwitcherProps) {
  const { currentThemeId, currentTheme, setTheme, themes, mounted } = useAppTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!mounted) return null

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
          collapsed && "justify-center px-2"
        )}
        title="テーマ切り替え"
      >
        <Palette className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="text-xs truncate">
            {currentTheme.icon} {currentTheme.label}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-[999] rounded-lg border p-2 shadow-lg",
            "bg-white dark:bg-neutral-900",
            "min-w-[220px] max-h-[400px] overflow-y-auto",
            collapsed ? "left-full ml-2 bottom-0" : "left-0 bottom-full mb-2"
          )}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 mb-1">
            テーマを選択
          </div>
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-neutral-100",
                currentThemeId === theme.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-neutral-800"
              )}
            >
              <span className="text-base shrink-0">{theme.icon}</span>
              <div className="text-left min-w-0">
                <div className="truncate">{theme.label}</div>
                <div className="text-[10px] text-neutral-500 truncate">
                  {theme.description}
                </div>
              </div>
              {currentThemeId === theme.id && (
                <span className="ml-auto text-blue-600 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
