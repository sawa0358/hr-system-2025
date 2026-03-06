"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { logAuthAction } from "./activity-logger"

interface AuthContextType {
  currentUser: any | null
  isAuthenticated: boolean
  login: (employee: any) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_EXPIRATION_DAYS = 30;

// セッションバージョン: アプリ更新時にこの値を変更すると全ユーザーが強制再ログイン
const SESSION_VERSION = "3.8.4";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // ユーザー情報をストレージから読み込む関数
  const loadUserFromStorage = () => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. localStorage（永続保持）を優先チェック
      let savedUser = localStorage.getItem("currentUser")
      let storageSource = 'localStorage'

      // 2. localStorageにない場合はsessionStorage（旧セッション）をチェック
      if (!savedUser) {
        savedUser = sessionStorage.getItem("currentUser")
        storageSource = 'sessionStorage'
      }

      if (savedUser) {
        const user = JSON.parse(savedUser)

        // セッションバージョンチェック: バージョン不一致は強制再ログイン
        const storedVersion = localStorage.getItem("sessionVersion")
        if (storedVersion !== SESSION_VERSION) {
          console.log(`[Auth] Session version mismatch (stored: ${storedVersion}, current: ${SESSION_VERSION}) - forcing re-login`)
          localStorage.removeItem("currentUser")
          localStorage.removeItem("sessionVersion")
          sessionStorage.removeItem("currentUser")
          return null
        }

        // 有効期限のチェック（30日）
        if (user.expiresAt && new Date().getTime() > user.expiresAt) {
          console.log("[Auth] Session expired for user:", user.name)
          localStorage.removeItem("currentUser")
          sessionStorage.removeItem("currentUser")
          return null
        }

        // sessionStorageにあった場合はlocalStorageに移行して永続化する
        if (storageSource === 'sessionStorage') {
          console.log("[Auth] Migrating session to localStorage for persistence")
          localStorage.setItem("currentUser", JSON.stringify({
            ...user,
            expiresAt: user.expiresAt || (new Date().getTime() + AUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
          }))
          // 移行後はsessionStorageを消しても良いが、安全のため残しておくか検討。
          // ここでは一旦そのままにし、次回からはlocalStorageが優先される。
        }

        console.log(`[Auth] User loaded from ${storageSource}:`, user.name)
        return user
      }
    } catch (error) {
      console.error("[Auth] Failed to load user storage:", error)
      localStorage.removeItem("currentUser")
      sessionStorage.removeItem("currentUser")
    }
    return null
  }

  useEffect(() => {
    setIsMounted(true)

    // 非同期でユーザー情報を読み込み
    const loadUser = async () => {
      try {
        const user = loadUserFromStorage()
        if (user) {
          setCurrentUser(user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("[v0] Failed to load user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // サーバーのバージョンをチェックし、不一致なら強制ログアウト
  const checkServerVersion = async () => {
    try {
      const storedVersion = localStorage.getItem("sessionVersion")
      if (!storedVersion) return // 未ログインなら不要
      const res = await fetch("/api/version", { cache: "no-store" })
      if (!res.ok) return
      const { version } = await res.json()
      if (version && version !== storedVersion) {
        console.log(`[Auth] Server version changed (stored: ${storedVersion}, server: ${version}) - forcing re-login`)
        localStorage.removeItem("currentUser")
        localStorage.removeItem("sessionVersion")
        sessionStorage.removeItem("currentUser")
        setCurrentUser(null)
        setIsAuthenticated(false)
        window.location.reload()
      }
    } catch {
      // ネットワークエラー時は無視
    }
  }

  // ページがバックグラウンドから戻った時 + 定期チェック
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // サーバーバージョンチェック（デプロイ後の強制ログアウト）
        checkServerVersion()
        // セッションが切れている場合は、ストレージから再読み込み
        const user = loadUserFromStorage()
        if (user) {
          setCurrentUser((prevUser: any) => {
            if (!prevUser || prevUser.id !== user.id) {
              console.log("[v0] Restored session on visibility change")
              setIsAuthenticated(true)
              return user
            }
            return prevUser
          })
        }
      }
    }

    const handleFocus = () => {
      checkServerVersion()
      const user = loadUserFromStorage()
      if (user) {
        setCurrentUser((prevUser: any) => {
          if (!prevUser || prevUser.id !== user.id) {
            console.log("[v0] Restored session on focus")
            setIsAuthenticated(true)
            return user
          }
          return prevUser
        })
      }
    }

    // 5分ごとにサーバーバージョンをチェック
    const intervalId = setInterval(checkServerVersion, 5 * 60 * 1000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const login = (employee: any) => {
    console.log("AuthContext - Login:", employee.name, "ID:", employee.id)

    // ログイン時に前のユーザーのワークスペース・ボードキャッシュをクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentBoard')
      console.log("AuthContext - Cleared workspace and board cache for new user")
    }

    // 有効期限を設定（セキュリティ配慮：例 30日）
    const expiresAt = new Date().getTime() + AUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    const userData = { ...employee, expiresAt };

    setCurrentUser(userData)
    setIsAuthenticated(true)

    // 永続保持：localStorage（ブラウザを閉じても保持）
    localStorage.setItem("currentUser", JSON.stringify(userData))
    localStorage.setItem("sessionVersion", SESSION_VERSION)
    // sessionStorageの古いデータを念のためクリア
    sessionStorage.removeItem("currentUser")

    console.log(`AuthContext - Saved user to localStorage (expiry: ${AUTH_EXPIRATION_DAYS} days)`)

    // ログイン成功をログに記録
    logAuthAction('login', employee.name, true)
  }

  const logout = () => {
    // ログアウト前にユーザー名を取得
    const userName = currentUser?.name || "不明なユーザー"

    // ログアウト時にワークスペース・ボードキャッシュもクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentBoard')
      console.log("AuthContext - Cleared workspace and board cache on logout")
    }

    setCurrentUser(null)
    setIsAuthenticated(false)

    // ストレージからユーザー情報を削除（ユーザーが意図的にログアウトした時のみ実行）
    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionVersion")
    sessionStorage.removeItem("currentUser")
    console.log("AuthContext - Cleared user data from both storages")

    // ログアウトをログに記録
    logAuthAction('logout', userName, true)
  }

  const shouldShowLoading = !isMounted || isLoading

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout }}>
      {shouldShowLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">読み込み中...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
