"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useDemoMode } from "@/hooks/useDemoMode"
import { useAuth } from "@/lib/auth-context"
import {
  buildMaskData,
  applyDemoMask,
  removeDemoMask,
  startMaskObserver,
  stopMaskObserver,
  type MaskData,
} from "@/lib/demo-masker"

/** メインコンテンツ全体を即座にぼかす（遷移中のチラ見え防止） */
function blurMainContent() {
  document.body.classList.add("demo-page-blur")
}

/** メインコンテンツ全体のぼかしを解除 */
function unblurMainContent() {
  document.body.classList.remove("demo-page-blur")
}

interface CachedEmployees {
  employees: Array<{ name: string; furigana?: string; address?: string }>
}

/**
 * デモモードのぼかしを管理する副作用コンポーネント
 * HR Systemでは /api/employees から社員データを取得してマスクする
 */
export function DemoMaskController() {
  const { isDemoMode } = useDemoMode()
  const { currentUser } = useAuth()
  const pathname = usePathname()
  const cacheRef = useRef<CachedEmployees | null>(null)
  const maskDataRef = useRef<MaskData | null>(null)
  const activeRef = useRef(false)

  // デモモードON/OFF切替時
  useEffect(() => {
    if (!isDemoMode) {
      stopMaskObserver()
      removeDemoMask()
      unblurMainContent()
      activeRef.current = false
      return
    }

    // ON: 即座に全体ぼかし → データ取得 → 個別ぼかし → 全体ぼかし解除
    blurMainContent()
    let cancelled = false

    const activate = async () => {
      try {
        let data = cacheRef.current
        if (!data) {
          // HR SystemはJWT Cookie認証。middlewareが自動でx-employee-idを付与するため
          // 追加のヘッダーは不要
          const res = await fetch("/api/employees", {
            headers: { "Content-Type": "application/json" },
          })
          const json = await res.json()
          const employees = Array.isArray(json) ? json : (json.data || [])

          data = {
            employees: employees.map((e: Record<string, string>) => ({
              name: e.name || "",
              furigana: e.furigana || "",
              address: e.address || "",
            })),
          }
          cacheRef.current = data
        }

        if (cancelled) return

        const md = buildMaskData(data.employees)
        maskDataRef.current = md

        // 個別ぼかし適用
        applyDemoMask(document.body, md)
        startMaskObserver(document.body, md)
        activeRef.current = true

        // 全体ぼかし解除（個別ぼかしが効いているので安全）
        unblurMainContent()
      } catch (err) {
        console.error("デモモードのデータ取得に失敗:", err)
        // エラー時も全体ぼかしは維持（安全側）
      }
    }

    activate()

    return () => {
      cancelled = true
      if (activeRef.current) {
        stopMaskObserver()
        removeDemoMask()
        activeRef.current = false
      }
      unblurMainContent()
    }
  }, [isDemoMode, currentUser])

  // ページ遷移時: 即座に全体ぼかし → 再スキャン → 解除
  useEffect(() => {
    if (!isDemoMode || !maskDataRef.current) return

    // 遷移直後に全体ぼかし
    blurMainContent()

    const timer = setTimeout(() => {
      if (maskDataRef.current) {
        applyDemoMask(document.body, maskDataRef.current)
      }
      unblurMainContent()
    }, 50) // React描画を待つ最小限の遅延

    return () => clearTimeout(timer)
  }, [pathname, isDemoMode])

  return null
}
