'use client'

import { useState, useEffect, useCallback } from 'react'
import { THEMES, THEME_STORAGE_KEY, DEFAULT_THEME_ID, getThemeById } from '@/lib/theme-config'
import type { ThemeDefinition } from '@/lib/theme-config'

export function useAppTheme() {
  const [currentThemeId, setCurrentThemeId] = useState<string>(DEFAULT_THEME_ID)
  const [mounted, setMounted] = useState(false)

  // 初期化: localStorageから保存済みテーマを読み込み
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && THEMES.some(t => t.id === saved)) {
      setCurrentThemeId(saved)
    }
    setMounted(true)
  }, [])

  // テーマ変更時にHTMLクラスとフォントを適用
  useEffect(() => {
    if (!mounted) return

    const theme = getThemeById(currentThemeId)
    const html = document.documentElement

    // 既存のテーマクラスを全て削除
    THEMES.forEach(t => {
      if (t.className) {
        html.classList.remove(t.className)
      }
    })

    // 新しいテーマクラスを適用
    if (theme.className) {
      html.classList.add(theme.className)
    }

    // Google Fontsを動的に読み込み
    loadThemeFonts(theme)

    // localStorageに保存
    localStorage.setItem(THEME_STORAGE_KEY, currentThemeId)
  }, [currentThemeId, mounted])

  const setTheme = useCallback((id: string) => {
    setCurrentThemeId(id)
  }, [])

  const currentTheme = getThemeById(currentThemeId)

  return {
    currentThemeId,
    currentTheme,
    setTheme,
    themes: THEMES,
    mounted,
  }
}

// Google Fontsの動的読み込み（重複防止付き）
function loadThemeFonts(theme: ThemeDefinition) {
  for (const fontUrl of theme.fonts) {
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`)
    if (!existingLink) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      document.head.appendChild(link)
    }
  }
}
