// 有給計算パターン選択コンポーネント
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getPatternLabel, type VacationPattern } from "@/lib/vacation-pattern"
import { useAuth } from "@/lib/auth-context"
import { Lock, AlertTriangle } from "lucide-react"

interface VacationPatternSelectorProps {
  employeeId: string
  employeeType: string | null | undefined
  currentPattern: VacationPattern | null | undefined
  currentWeeklyPattern?: number | null | undefined
  onPatternChange?: (pattern: VacationPattern | null) => void
  readonly?: boolean
  employeeName?: string
}

export function VacationPatternSelector({
  employeeId,
  employeeType,
  currentPattern,
  currentWeeklyPattern,
  onPatternChange,
  readonly = false,
  employeeName,
}: VacationPatternSelectorProps) {
  const { currentUser } = useAuth()
  const [pattern, setPattern] = useState<VacationPattern | null>(currentPattern || null)
  const [loading, setLoading] = useState(false)
  const [pendingPattern, setPendingPattern] = useState<VacationPattern | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    setPattern(currentPattern || null)
  }, [currentPattern])

  // パターンオプションを生成（全パターン）
  // 雇用形態に関わらず、すべてのパターンを表示
  const patternOptions: Array<{ value: VacationPattern; label: string }> = [
    { value: 'A', label: 'パターンA（正社員用）' },
    { value: 'B-1', label: 'パターンB-1（週1日勤務）' },
    { value: 'B-2', label: 'パターンB-2（週2日勤務）' },
    { value: 'B-3', label: 'パターンB-3（週3日勤務）' },
    { value: 'B-4', label: 'パターンB-4（週4日勤務）' },
  ]

  // 雇用形態に関わらず、すべてのパターンを表示
  const availableOptions = patternOptions

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('[VacationPatternSelector]', {
      employeeId,
      employeeType: employeeType?.trim() || '未設定',
      availableOptionsCount: availableOptions.length,
      availableOptions: availableOptions.map(o => o.value),
      currentPattern,
    })
  }

  const handlePatternSelect = (newPattern: VacationPattern) => {
    if (readonly) return
    // 現在のパターンと同じ場合は何もしない
    if (newPattern === pattern) return

    // パスワード確認ダイアログを表示
    setPendingPattern(newPattern)
    setShowPasswordDialog(true)
    setPassword("")
    setPasswordError("")
  }

  const handlePasswordVerify = async () => {
    if (!currentUser?.id) {
      setPasswordError("ユーザー情報が取得できません")
      return
    }

    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser.id,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        // パスワード認証成功 → 確認ダイアログを表示
        setShowPasswordDialog(false)
        setShowConfirmDialog(true)
        setPassword("")
        setPasswordError("")
      } else {
        setPasswordError("パスワードが正しくありません")
      }
    } catch (error) {
      console.error('パスワード認証エラー:', error)
      setPasswordError("パスワード認証に失敗しました")
    }
  }

  const handleConfirmChange = async () => {
    if (!pendingPattern) return

    setShowConfirmDialog(false)
    setLoading(true)
    try {
      const weeklyPattern = pendingPattern?.startsWith('B-') ? parseInt(pendingPattern.split('-')[1], 10) : null

      const response = await fetch(`/api/vacation/employee/${employeeId}/pattern`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vacationPattern: pendingPattern,
          weeklyPattern,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPattern(pendingPattern)
        onPatternChange?.(pendingPattern)
        // ロット自動生成はAPI側で実行される（result.grantLotsに結果が含まれる）
        if (result.grantLots) {
          console.log('ロット自動生成完了:', result.grantLots)
        } else if (result.grantLotsError) {
          console.warn('ロット自動生成エラー（無視）:', result.grantLotsError)
        }
        // データ更新イベントを発火（画面遷移を防ぐため、現在のviewを維持）
        window.dispatchEvent(new Event('vacation-pattern-updated'))
      } else {
        const error = await response.json()
        alert(error.error || 'パターン値の更新に失敗しました')
        // エラー時は元のパターンに戻す
        setPattern(currentPattern || null)
      }
    } catch (error) {
      console.error('パターン値更新エラー:', error)
      alert('パターン値の更新に失敗しました')
      // エラー時は元のパターンに戻す
      setPattern(currentPattern || null)
    } finally {
      setLoading(false)
      setPendingPattern(null)
    }
  }

  const handleCancelChange = () => {
    setShowPasswordDialog(false)
    setShowConfirmDialog(false)
    setPendingPattern(null)
    setPassword("")
    setPasswordError("")
    // 元のパターンに戻す
    setPattern(currentPattern || null)
  }

  return (
    <>
      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
        <label className="text-[9px] text-muted-foreground">有給計算パターン</label>
        <Select
          value={pattern || ''}
          onValueChange={(value) => handlePatternSelect(value as VacationPattern)}
          disabled={loading || readonly || availableOptions.length === 0}
        >
          <SelectTrigger 
            className="h-7 text-[11px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue placeholder="パターンを選択">
              {pattern ? getPatternLabel(pattern) : '未設定'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent onClick={(e) => e.stopPropagation()}>
            {availableOptions.length === 0 ? (
              <SelectItem value="" disabled>
                該当するパターンがありません（雇用形態: {employeeType || '未設定'}）
              </SelectItem>
            ) : (
              availableOptions.map((opt) => (
                <SelectItem 
                  key={opt.value} 
                  value={opt.value}
                  onClick={(e) => e.stopPropagation()}
                >
                  {opt.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {pattern && (
          <p className="text-[9px] text-muted-foreground">
            {getPatternLabel(pattern)}
          </p>
        )}
      </div>

      {/* パスワード確認ダイアログ */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent 
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              管理者パスワード確認
            </DialogTitle>
            <DialogDescription>
              有給計算パターンを変更するには、管理者のパスワード入力が必要です。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                有給計算パターンの変更は、該当社員の有給ロット生成に影響します。変更前に必ず確認してください。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">管理者パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError("")
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation()
                    handlePasswordVerify()
                  }
                }}
                placeholder="パスワードを入力"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            </div>
          </div>

          <DialogFooter onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation()
                handleCancelChange()
              }}
            >
              キャンセル
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                handlePasswordVerify()
              }} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              認証する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 変更確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent 
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>有給計算パターンの変更確認</DialogTitle>
            <DialogDescription>
              有給計算パターンを変更しますか？
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">変更内容:</p>
              <p className="text-sm text-blue-800">
                <strong>{employeeName || '社員'}</strong> の有給計算パターン
              </p>
              <p className="text-sm text-blue-800 mt-1">
                現在: <strong>{currentPattern ? getPatternLabel(currentPattern) : '未設定'}</strong>
              </p>
              <p className="text-sm text-blue-800">
                変更後: <strong>{pendingPattern ? getPatternLabel(pendingPattern) : '未設定'}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                ※ 変更後、入社日を参照して自動でロットが生成されます。
              </p>
            </div>
          </div>

          <DialogFooter onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation()
                handleCancelChange()
              }}
            >
              いいえ（キャンセル）
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                handleConfirmChange()
              }} 
              className="bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? "変更中..." : "はい（変更する）"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

