"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"

export function VacationRequestForm() {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    unit: "DAY" as "DAY" | "HOUR",
    usedDays: 1,
    hoursPerDay: 8,
    hours: 8,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 日数自動計算
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 1
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const current = (window as any).CURRENT_USER as { id?: string } | undefined
      if (!current?.id) {
        alert("ユーザー情報が取得できません")
        return
      }

      const requestData: any = {
        employeeId: current.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        unit: formData.unit,
        reason: formData.reason || undefined,
      }

      if (formData.unit === "HOUR") {
        requestData.hoursPerDay = formData.hoursPerDay
        requestData.usedDays = formData.hours // 時間数
      } else {
        requestData.usedDays = formData.usedDays || calculateDays()
      }

      const res = await fetch("/api/vacation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "申請に失敗しました")
      }
      alert("申請が送信されました")
      setFormData({ startDate: "", endDate: "", reason: "", unit: "DAY", usedDays: 1, hoursPerDay: 8, hours: 8 })
    } catch (err: any) {
      alert(err?.message ?? "申請に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
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
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
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
                  onChange={(e) => setFormData({ ...formData, usedDays: Number(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  自動計算: {calculateDays()}日（{formData.startDate && formData.endDate ? "開始日〜終了日" : "日付を選択してください"}）
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "申請を送信"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
