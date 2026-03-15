"use client"

import type React from "react"

import { useState, useId } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, AlertCircle } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onLoginSuccess: (employee: any) => void
}

export function LoginModal({ open, onLoginSuccess }: LoginModalProps) {
  const router = useRouter()
  const nameId = useId()
  const passwordId = useId()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // サーバーサイドでログイン認証（パスワードはサーバー側で検証）
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onLoginSuccess(data.user)
        setIsLoading(false)
        // ログイン成功後、人事考課対象者の場合は人事考課ページに、そうでない場合はタスク管理ページにリダイレクト
        setTimeout(() => {
          if (data.user.isPersonnelEvaluationTarget) {
            router.push('/evaluations')
          } else {
            router.push('/tasks')
          }
        }, 100)
      } else {
        setError(data.error || "名前またはパスワードが正しくありません")
        setIsLoading(false)
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      setError("サーバーに接続できません。しばらく待ってから再試行してください。")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} overlayClassName="bg-[#B4D5E7]">
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
            <Label htmlFor={nameId}>名前（登録名）</Label>
            <Input
              id={nameId}
              type="text"
              placeholder="フルネーム（スペースを入れない）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>パスワード</Label>
            <Input
              id={passwordId}
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
          <p>パスワードを忘れた場合は伊藤or大澤にお問合せください</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
