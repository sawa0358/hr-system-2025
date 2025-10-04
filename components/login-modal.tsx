"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, AlertCircle } from "lucide-react"
import { mockEmployees } from "@/lib/mock-data"
import { prisma } from "@/lib/prisma"

interface LoginModalProps {
  open: boolean
  onLoginSuccess: (employee: any, rememberMe: boolean) => void
}

export function LoginModal({ open, onLoginSuccess }: LoginModalProps) {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // データベースから社員情報を取得
      const response = await fetch('/api/employees')
      if (response.ok) {
        const employees = await response.json()
        const employee = employees.find((emp: any) => emp.name === name && emp.password === password)
        
        if (employee) {
          // システム使用状態をチェック（roleが設定されているかどうか）
          if (!employee.role || employee.role === '') {
            setError("このアカウントはシステム使用が無効になっています。管理者にお問い合わせください。")
            return
          }
          onLoginSuccess(employee, rememberMe)
        } else {
          setError("名前またはパスワードが正しくありません")
        }
      } else {
        // フォールバック: モックデータを使用
        const employee = mockEmployees.find((emp) => emp.name === name && emp.password === password)
        if (employee) {
          // システム使用状態をチェック（roleが設定されているかどうか）
          if (!employee.role || employee.role === '') {
            setError("このアカウントはシステム使用が無効になっています。管理者にお問い合わせください。")
            return
          }
          onLoginSuccess(employee, rememberMe)
        } else {
          setError("名前またはパスワードが正しくありません")
        }
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      setError("ログインに失敗しました")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">HR System</DialogTitle>
          <DialogDescription className="text-center">システムにログインしてください</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">名前（登録名）</Label>
            <Input
              id="name"
              type="text"
              placeholder="田中 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              ログイン情報を保存
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          <p>パスワードを忘れた場合は管理者にお問い合わせください</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
