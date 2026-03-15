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
const SESSION_VERSION = "3.8.8";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // ユーザー情報をストレージから読み込む関数（初期表示の高速化用）
  const loadUserFromStorage = () => {
    try {
      if (typeof window === 'undefined') return null;

      let savedUser = localStorage.getItem("currentUser")
      let storageSource = 'localStorage'

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

        if (storageSource === 'sessionStorage') {
          localStorage.setItem("currentUser", JSON.stringify({
            ...user,
            expiresAt: user.expiresAt || (new Date().getTime() + AUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
          }))
        }

        return user
      }
    } catch (error) {
      console.error("[Auth] Failed to load user storage:", error)
      localStorage.removeItem("currentUser")
      sessionStorage.removeItem("currentUser")
    }
    return null
  }

  // サーバーのセッションを検証して最新ユーザー情報を取得
  const validateSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" })
      if (!res.ok) return null
      const data = await res.json()
      if (data.authenticated && data.user) {
        return data.user
      }
      return null
    } catch {
      return null
    }
  }

  useEffect(() => {
    setIsMounted(true)

    const loadUser = async () => {
      try {
        // まずlocalStorageから即座に復元（高速表示）
        const cachedUser = loadUserFromStorage()
        if (cachedUser) {
          setCurrentUser(cachedUser)
          setIsAuthenticated(true)
        }

        // サーバーサイドでセッションを検証し、最新データで上書き
        const serverUser = await validateSession()
        if (serverUser) {
          const expiresAt = new Date().getTime() + AUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
          const userData = { ...serverUser, expiresAt }
          setCurrentUser(userData)
          setIsAuthenticated(true)
          localStorage.setItem("currentUser", JSON.stringify(userData))
        } else if (cachedUser) {
          // サーバーセッションが無効 → ログアウト
          localStorage.removeItem("currentUser")
          localStorage.removeItem("sessionVersion")
          sessionStorage.removeItem("currentUser")
          setCurrentUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("[Auth] Failed to load user:", error)
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
      if (!storedVersion) return
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
        checkServerVersion()
        const user = loadUserFromStorage()
        if (user) {
          setCurrentUser((prevUser: any) => {
            if (!prevUser || prevUser.id !== user.id) {
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
            setIsAuthenticated(true)
            return user
          }
          return prevUser
        })
      }
    }

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
    // ログイン時に前のユーザーのワークスペース・ボードキャッシュをクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentBoard')
    }

    const expiresAt = new Date().getTime() + AUTH_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    const userData = { ...employee, expiresAt };

    setCurrentUser(userData)
    setIsAuthenticated(true)

    // パスワードを含まないユーザー情報をlocalStorageに保存（UIキャッシュ用）
    localStorage.setItem("currentUser", JSON.stringify(userData))
    localStorage.setItem("sessionVersion", SESSION_VERSION)
    sessionStorage.removeItem("currentUser")

    logAuthAction('login', employee.name, true)
  }

  const logout = async () => {
    const userName = currentUser?.name || "不明なユーザー"

    // サーバーサイドのセッションCookieを削除
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ネットワークエラーでもローカルクリアは続行
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentBoard')
    }

    setCurrentUser(null)
    setIsAuthenticated(false)

    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionVersion")
    sessionStorage.removeItem("currentUser")

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
