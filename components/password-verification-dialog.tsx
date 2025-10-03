"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, AlertTriangle } from "lucide-react"

interface PasswordVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}

export function PasswordVerificationDialog({ open, onOpenChange, onVerified }: PasswordVerificationDialogProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleVerify = () => {
    // In a real application, this would verify against the user's actual password
    if (password === "admin123") {
      onVerified()
      onOpenChange(false)
      setPassword("")
      setError("")
    } else {
      setError("パスワードが正しくありません")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            パスワード認証
          </DialogTitle>
          <DialogDescription>マイナンバーを表示するには、ログインパスワードの入力が必要です。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              マイナンバーは機密情報です。管理者・総務権限を持つユーザーのみ閲覧できます。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">ログインパスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify()
              }}
              placeholder="パスワードを入力"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setPassword("")
              setError("")
            }}
          >
            キャンセル
          </Button>
          <Button onClick={handleVerify} className="bg-blue-600 hover:bg-blue-700">
            認証する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
