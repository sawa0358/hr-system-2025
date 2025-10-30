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
    usedDays: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const current = (window as any).CURRENT_USER as { id?: string } | undefined
      if (!current?.id) {
        alert("ユーザー情報が取得できません")
        return
      }
      const res = await fetch("/api/vacation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: current.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          usedDays: formData.usedDays,
          reason: formData.reason,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "申請に失敗しました")
      }
      alert("申請が送信されました")
      setFormData({ startDate: "", endDate: "", reason: "", usedDays: 1 })
    } catch (err: any) {
      alert(err?.message ?? "申請に失敗しました")
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

          <Button type="submit" className="w-full">
            申請を送信
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
