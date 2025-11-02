"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { logAuthAction } from "./activity-logger"

interface AuthContextType {
  currentUser: any | null
  isAuthenticated: boolean
  login: (employee: any, rememberMe: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // ユーザー情報をストレージから読み込む関数
  const loadUserFromStorage = () => {
    try {
      // まずlocalStorage（rememberMe=true）をチェック
      let savedUser = localStorage.getItem("currentUser")
      let storageType = 'localStorage'
      
      // localStorageにない場合はsessionStorage（rememberMe=false）をチェック
      if (!savedUser) {
        savedUser = sessionStorage.getItem("currentUser")
        storageType = 'sessionStorage'
      }
      
      if (savedUser) {
        const user = JSON.parse(savedUser)
        // 古い形式のID（"admin"など）や無効なIDの場合はキャッシュをクリア
        if (user.id === "admin" || user.id === "manager" || user.id === "sub" || 
            user.id === "ippan" || user.id === "etsuran" || 
            user.id === "001" || user.id === "002" || user.id === "003" ||
            user.id === "cmgkljr1000008z81edjq66sl" ||
            user.id === "cmgorkhkh00008z11nhm08dt7" ||
            user.id === "cmgtj2n3o00008zcwnsyk1k4n") {
          console.log("Clearing old cached user data:", user.id)
          localStorage.removeItem("currentUser")
          sessionStorage.removeItem("currentUser")
          return null
        } else {
          console.log(`[v0] Loaded user from ${storageType}:`, user.name, user.id)
          return user
        }
      }
    } catch (error) {
      console.error("[v0] Failed to parse saved user:", error)
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

  // ページがバックグラウンドから戻った時（モバイルでタブが復元された時）にセッションを再確認
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // セッションが切れている場合は、ストレージから再読み込み
        const user = loadUserFromStorage()
        if (user) {
          // 現在のユーザーと異なる場合のみ更新（無限ループ防止）
          setCurrentUser((prevUser) => {
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

    // フォーカス時にもセッションを再確認（モバイルでタブが復元された時）
    const handleFocus = () => {
      const user = loadUserFromStorage()
      if (user) {
        // 現在のユーザーと異なる場合のみ更新（無限ループ防止）
        setCurrentUser((prevUser) => {
          if (!prevUser || prevUser.id !== user.id) {
            console.log("[v0] Restored session on focus")
            setIsAuthenticated(true)
            return user
          }
          return prevUser
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const login = (employee: any, rememberMe: boolean) => {
    console.log("AuthContext - Login:", employee.name, "ID:", employee.id, "RememberMe:", rememberMe)
    
    // ログイン時に前のユーザーのワークスペース・ボードキャッシュをクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspace')
      localStorage.removeItem('currentBoard')
      console.log("AuthContext - Cleared workspace and board cache for new user")
    }
    
    setCurrentUser(employee)
    setIsAuthenticated(true)

    // rememberMeに応じてlocalStorageまたはsessionStorageに保存
    if (rememberMe) {
      // 長期保存：localStorage（ブラウザを閉じても保持）
      localStorage.setItem("currentUser", JSON.stringify(employee))
      sessionStorage.removeItem("currentUser") // sessionStorageの古いデータをクリア
      console.log("AuthContext - Saved user to localStorage (long-term)")
    } else {
      // 短期保存：sessionStorage（タブを閉じるまで保持、モバイルでもより確実）
      sessionStorage.setItem("currentUser", JSON.stringify(employee))
      localStorage.removeItem("currentUser") // localStorageの古いデータをクリア
      console.log("AuthContext - Saved user to sessionStorage (session)")
    }

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
    
    // 両方のストレージからユーザー情報を削除
    localStorage.removeItem("currentUser")
    sessionStorage.removeItem("currentUser")
    console.log("AuthContext - Cleared user data from both storages")

    // ログアウトをログに記録
    logAuthAction('logout', userName, true)
  }

  // クライアントサイドでのマウント前は何も表示しない
  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
