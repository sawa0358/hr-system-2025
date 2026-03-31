"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DemoModeContextValue {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined)

export function DemoModeProvider({ children }: { children: ReactNode }) {
  // リロードで解除されるよう、localStorageには保存しない（安全策）
  const [isDemoMode, setIsDemoMode] = useState(false)

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev)
  }, [])

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext)
  if (!ctx) {
    throw new Error("useDemoMode must be used within a DemoModeProvider")
  }
  return ctx
}
