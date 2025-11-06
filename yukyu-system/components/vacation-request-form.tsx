"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VacationRequestFormProps {
  onSuccess?: () => void
  initialData?: {
    startDate: string
    endDate: string
    reason: string
    unit: "DAY" | "HOUR"
    usedDays: number
    hoursPerDay: number
    hours: number
  }
  requestId?: string // 修正時は既存の申請ID
  proxyEmployeeId?: string // 代理申請する社員ID（管理者が他の社員に代わって申請する場合）
  force?: boolean // 承認済み・却下の申請を編集する場合のフラグ
}

export function VacationRequestForm({ onSuccess, initialData, requestId, proxyEmployeeId, force }: VacationRequestFormProps) {
  const { currentUser } = useAuth()
  const { toast } = useToast()
  
  // 代理申請する社員ID（管理者が他の社員に代わって申請する場合）
  const targetEmployeeId = proxyEmployeeId || currentUser?.id
  const [formData, setFormData] = useState({
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    reason: initialData?.reason || "",
    unit: initialData?.unit || ("DAY" as "DAY" | "HOUR"),
    usedDays: initialData?.usedDays || 1,
    hoursPerDay: initialData?.hoursPerDay || 8,
    hours: initialData?.hours || 8,
    supervisorId: "", // 上司ID
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPastDateConfirmDialogOpen, setIsPastDateConfirmDialogOpen] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [supervisors, setSupervisors] = useState<{id: string, name: string, role: string}[]>([])
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)

  // 日数自動計算
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 1
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  }

  // 全店の店長・マネージャー以上を取得
  useEffect(() => {
    const loadSupervisors = async () => {
      setLoadingSupervisors(true)
      try {
        const res = await fetch('/api/employees')
        if (res.ok) {
          const data = await res.json()
          // 店長・マネージャー以上をフィルタリング
          const supervisorRoles = ['manager', 'store_manager', 'hr', 'admin']
          const filtered = data
            .filter((emp: any) => 
              emp.status === 'active' && 
              emp.role && 
              supervisorRoles.includes(emp.role)
            )
            .map((emp: any) => ({
              id: emp.id,
              name: emp.name,
              role: emp.role
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name, 'ja'))
          setSupervisors(filtered)
        }
      } catch (error) {
        console.error('上司一覧の取得エラー:', error)
      } finally {
        setLoadingSupervisors(false)
      }
    }
    loadSupervisors()
  }, [])

  // 開始日・終了日変更時に自動計算
  useEffect(() => {
    if (formData.unit === "DAY" && formData.startDate && formData.endDate) {
      const calculatedDays = calculateDays()
      if (calculatedDays > 0) {
        setFormData(prev => ({ ...prev, usedDays: calculatedDays }))
      }
    }
  }, [formData.startDate, formData.endDate, formData.unit])

  // 実際の申請送信処理
  const submitRequest = async () => {
    if (!currentUser?.id || !targetEmployeeId) {
      return
    }

    try {
      setIsSubmitting(true)

      const requestData: any = {
        employeeId: targetEmployeeId, // 代理申請の場合は対象社員IDを使用
        startDate: formData.startDate,
        endDate: formData.endDate,
        unit: formData.unit,
        reason: formData.reason || undefined,
        supervisorId: formData.supervisorId, // 選択した上司ID
      }

      // 管理者が代理申請している場合は、申請者情報を追加
      if (proxyEmployeeId && proxyEmployeeId !== currentUser.id) {
        requestData.requestedBy = currentUser.id // 申請者のID
        requestData.requestedByName = currentUser.name // 申請者の名前
      }

      if (formData.unit === "HOUR") {
        requestData.hoursPerDay = formData.hoursPerDay
        requestData.usedDays = formData.hours // 時間数
      } else {
        requestData.usedDays = formData.usedDays || calculateDays()
      }

      // 修正の場合はPUT、新規の場合はPOST
      const url = requestId 
        ? `/api/vacation/requests/${requestId}`
        : "/api/vacation/request"
      const method = requestId ? "PUT" : "POST"
      
      // 承認済み・却下の申請を編集する場合はforceフラグを追加
      if (force) {
        requestData.force = true
      }

      console.log(`[VacationRequestForm] 申請${requestId ? '修正' : '新規作成'}:`, {
        requestId,
        method,
        url,
        requestData
      })

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": currentUser?.id || "",
        },
        body: JSON.stringify(requestData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || (requestId ? "申請の修正に失敗しました" : "申請に失敗しました"))
      }

      // 自動承認された場合
      if (data.autoApproved) {
        toast({
          title: "申請が承認されました",
          description: "過去の日付の代理申請のため、自動で承認され、有給が消化されました。",
        })
      } else if (data.reapproved) {
        // 承認済みの申請を再承認した場合
        toast({
          title: "申請を更新しました",
          description: "承認済みの申請を更新しました。承認済みのまま有給が再計算されました。",
        })
      } else {
        toast({
          title: requestId ? "申請を修正しました" : "申請が送信されました",
          description: requestId 
            ? "申請内容が更新されました。承認後に有給が消化されます。"
            : "申請は承認待ちです。承認後に有給が消化されます。",
        })
      }

      // フォームリセット（新規申請の場合のみ）
      if (!requestId) {
        setFormData({ startDate: "", endDate: "", reason: "", unit: "DAY", usedDays: 1, hoursPerDay: 8, hours: 8, supervisorId: "" })
      }

      // 親コンポーネントに成功を通知
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      toast({
        title: "申請に失敗しました",
        description: err?.message || "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setPendingSubmit(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!currentUser?.id) {
      toast({
        title: "エラー",
        description: "ユーザー情報が取得できません。再度ログインしてください。",
        variant: "destructive",
      })
      return
    }

    if (!targetEmployeeId) {
      toast({
        title: "エラー",
        description: "申請対象の社員IDが取得できません。",
        variant: "destructive",
      })
      return
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "エラー",
        description: "開始日と終了日を入力してください。",
        variant: "destructive",
      })
      return
    }

    // 上司選択のバリデーション
    if (!formData.supervisorId) {
      toast({
        title: "エラー",
        description: "上司を選択してください。",
        variant: "destructive",
      })
      return
    }

    // 日付の妥当性チェック
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    // 代理申請かどうかを判定
    const isProxyRequest = proxyEmployeeId && proxyEmployeeId !== currentUser.id

    // 承認済み・却下の申請を編集する場合（force=true）は過去の日付も許可（代理申請チェックをスキップ）
    if (force && start < today) {
      // 過去の日付でも許可（バリデーションをスキップ）
      // 実際の送信処理を実行
      await submitRequest()
      return
    }

    // 過去の日付かつ代理申請の場合
    if (start < today && isProxyRequest) {
      // 確認ダイアログを表示
      setPendingSubmit(true)
      setIsPastDateConfirmDialogOpen(true)
      return
    }

    // 代理申請でない場合、過去の日付はエラー
    if (start < today && !isProxyRequest) {
      toast({
        title: "エラー",
        description: "開始日は今日以降の日付を選択してください。",
        variant: "destructive",
      })
      return
    }

    if (start > end) {
      toast({
        title: "エラー",
        description: "開始日は終了日以前の日付を選択してください。",
        variant: "destructive",
      })
      return
    }

    // 実際の送信処理を実行
    await submitRequest()
  }

  // 過去の日付確認ダイアログの「はい」ボタン
  const handlePastDateConfirm = async () => {
    setIsPastDateConfirmDialogOpen(false)
    await submitRequest()
  }

  // 過去の日付確認ダイアログの「いいえ」ボタン
  const handlePastDateCancel = () => {
    setIsPastDateConfirmDialogOpen(false)
    setPendingSubmit(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          有給休暇申請
        </CardTitle>
        <CardDescription>休暇の開始日と終了日を選択し、理由を入力してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  // 開始日が変更された時、終了日が未設定または開始日より前の場合は終了日を開始日に設定
                  if (!formData.endDate || new Date(formData.endDate) < new Date(newStartDate)) {
                    setFormData({ ...formData, startDate: newStartDate, endDate: newStartDate })
                  } else {
                    setFormData({ ...formData, startDate: newStartDate })
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
                min={formData.startDate || undefined}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>申請単位</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="DAY"
                    checked={formData.unit === "DAY"}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as "DAY" | "HOUR" })}
                  />
                  <span>日単位</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="HOUR"
                    checked={formData.unit === "HOUR"}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as "DAY" | "HOUR" })}
                  />
                  <span>時間単位</span>
                </label>
              </div>
            </div>

            {formData.unit === "DAY" ? (
              <div className="space-y-2">
                <Label htmlFor="usedDays">使用日数</Label>
                <Input
                  id="usedDays"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={formData.usedDays}
                  onChange={(e) => {
                    const days = Number(e.target.value)
                    setFormData({ ...formData, usedDays: days >= 0.5 ? days : 0.5 })
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.startDate && formData.endDate ? (
                    <>
                      自動計算: {calculateDays()}日（開始日〜終了日）
                      {formData.usedDays !== calculateDays() && (
                        <span className="ml-2 text-orange-600">
                          ※ 日付から計算した値と異なります
                        </span>
                      )}
                    </>
                  ) : (
                    "日付を選択すると自動計算されます"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">1日の所定労働時間</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    min={1}
                    step={0.5}
                    value={formData.hoursPerDay}
                    onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">使用時間数</Label>
                  <Input
                    id="hours"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const hours = formData.hours
                      const hoursPerDay = formData.hoursPerDay
                      
                      // 期間の日数を計算
                      if (!formData.startDate || !formData.endDate) {
                        // 日付が選択されていない場合は単純計算
                        if (hours <= 4) {
                          return "換算: 0.5日（半日）"
                        }
                        const days = hours / hoursPerDay
                        const rounded = Math.round(days * 2) / 2
                        return `換算: ${rounded}日`
                      }
                      
                      const start = new Date(formData.startDate)
                      const end = new Date(formData.endDate)
                      const diffMs = end.getTime() - start.getTime()
                      const periodDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1 // 期間の日数（含む）
                      
                      // 期間内の最大時間数（各日は最大1日まで）
                      const maxHours = periodDays * hoursPerDay
                      
                      // 使用時間数が期間の最大時間数を超えないか確認
                      if (hours > maxHours) {
                        return `換算: エラー（期間は最大${maxHours}時間）`
                      }
                      
                      // 4時間以内 → 0.5日
                      if (hours <= 4) {
                        return "換算: 0.5日（半日）"
                      }
                      
                      // 時間数から0.5日単位で日数を計算
                      // 期間内で各日は0.5日（4時間）または1日（8時間）を取れる
                      
                      // 期間に応じた日数の範囲を計算
                      // 例：2日間の場合
                      // - 0.5日 = 4時間（1日目のみ0.5日）
                      // - 1.0日 = 8時間（1日目のみ1日、または2日間で各0.5日）
                      // - 1.5日 = 8.5時間以上12時間（1日目0.5日+2日目1日、または1日目1日+2日目0.5日）
                      // - 2.0日 = 16時間（2日間で各1日）
                      
                      // 時間数から直接日数を計算（0.5日単位）
                      const days = hours / hoursPerDay
                      let rounded = Math.round(days * 2) / 2 // 0.5日単位で丸める
                      
                      // 期間内の最大日数を超えないようにする
                      rounded = Math.min(rounded, periodDays)
                      
                      // 期間に応じた時間数の範囲で調整
                      // 2日間で1.5日を取る場合：8.5時間以上12時間
                      if (periodDays === 2) {
                        // 2日間の場合の時間数範囲
                        // 0-4時間 → 0.5日
                        // 4-8時間 → 1.0日
                        // 8.5-12時間 → 1.5日（1日目0.5日+2日目1日、または1日目1日+2日目0.5日）
                        // 12-16時間 → 2.0日
                        if (hours <= 4) {
                          rounded = 0.5
                        } else if (hours > 4 && hours <= 8) {
                          rounded = 1.0
                        } else if (hours >= 8.5 && hours <= 12) {
                          rounded = 1.5
                        } else if (hours > 12 && hours <= 16) {
                          rounded = 2.0
                        } else {
                          // 計算された値をそのまま使用（16時間を超える場合は期間の最大日数）
                          rounded = Math.min(rounded, periodDays)
                        }
                      } else if (periodDays === 1) {
                        // 1日間の場合
                        if (hours <= 4) {
                          rounded = 0.5
                        } else if (hours > 4 && hours <= hoursPerDay) {
                          rounded = 1.0
                        }
                      } else {
                        // 3日以上の場合も同様のロジックを適用
                        // 時間数の範囲で0.5日単位で決定
                        rounded = Math.min(rounded, periodDays)
                      }
                      
                      return `換算: ${rounded}日（${periodDays}日間）`
                    })()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisorId">直属上司選択 <span className="text-red-500">*</span></Label>
            <Select
              value={formData.supervisorId}
              onValueChange={(value) => setFormData({ ...formData, supervisorId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="上司を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {loadingSupervisors ? (
                  <SelectItem value="_loading_" disabled>読み込み中...</SelectItem>
                ) : supervisors.length > 0 ? (
                  supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} ({supervisor.role === 'manager' ? 'マネージャー' : supervisor.role === 'store_manager' ? '店長' : supervisor.role === 'hr' ? '総務' : '管理者'})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_no_supervisors_" disabled>上司が見つかりません</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              全店の店長・マネージャー以上から選択してください
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">理由</Label>
            <Textarea
              id="reason"
              placeholder="休暇の理由を入力してください"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || pendingSubmit}>
            {isSubmitting 
              ? (requestId ? "更新中..." : "送信中...") 
              : (requestId ? "申請を更新" : "申請を送信")}
          </Button>
        </form>
      </CardContent>

      {/* 過去の日付確認ダイアログ */}
      <Dialog open={isPastDateConfirmDialogOpen} onOpenChange={setIsPastDateConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>過去の日付での代理申請</DialogTitle>
            <DialogDescription>
              過去の日付を代理申請する場合、自動で承認とされ、消化されたことになりますが送信しますか？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handlePastDateCancel}>
              いいえ
            </Button>
            <Button onClick={handlePastDateConfirm}>
              はい
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
