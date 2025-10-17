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

  useEffect(() => {
    setIsMounted(true)
    
    // 非同期でユーザー情報を読み込み
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem("currentUser")
        if (savedUser) {
          const user = JSON.parse(savedUser)
          // 古い形式のID（"admin"など）や無効なIDの場合はキャッシュをクリア
          if (user.id === "admin" || user.id === "manager" || user.id === "sub" || 
              user.id === "ippan" || user.id === "etsuran" || 
              user.id === "001" || user.id === "002" || user.id === "003" ||
              user.id === "cmgkljr1000008z81edjq66sl" ||
              user.id === "cmgorkhkh00008z11nhm08dt7") {
            console.log("Clearing old cached user data:", user.id)
            localStorage.removeItem("currentUser")
          } else {
            setCurrentUser(user)
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to parse saved user:", error)
        localStorage.removeItem("currentUser")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [])

  const login = (employee: any, rememberMe: boolean) => {
    console.log("AuthContext - Login:", employee.name, "ID:", employee.id)
    setCurrentUser(employee)
    setIsAuthenticated(true)

    if (rememberMe) {
      localStorage.setItem("currentUser", JSON.stringify(employee))
    }

    // ログイン成功をログに記録
    logAuthAction('login', employee.name, true)
  }

  const logout = () => {
    // ログアウト前にユーザー名を取得
    const userName = currentUser?.name || "不明なユーザー"
    
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("currentUser")

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
