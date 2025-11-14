"use client"

import { useEffect } from "react"

/**
 * グローバルなエラーハンドリングコンポーネント
 * 未処理のPromise拒否（特にAbortError）をキャッチして無視します
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    // 未処理のPromise拒否をキャッチ
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // AbortErrorは予期された中断（リクエストのキャンセル）なので無視
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        // イベントを消費してコンソールにエラーを表示しない
        event.preventDefault()
        return
      }
      
      // その他のエラーは通常通り処理（コンソールに表示される）
    }

    // エラーハンドラーを登録
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // クリーンアップ
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // このコンポーネントは何もレンダリングしない
  return null
}



