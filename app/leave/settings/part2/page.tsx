"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

function SmallStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(Math.max(0, value - 1))}>-</Button>
      <Input className="w-16 text-right" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} />
      <Button type="button" size="sm" onClick={() => onChange(value + 1)}>+</Button>
    </div>
  )
}

export default function LeaveSettingsPart2Page() {
  const router = useRouter()
  const [rows, setRows] = useState([
    { weeklyDays: 4, minHours: 169, maxHours: 216, grants: [7,8,9,10,12,13,15] },
    { weeklyDays: 3, minHours: 121, maxHours: 168, grants: [5,6,6,8,9,10,11] },
    { weeklyDays: 2, minHours: 73, maxHours: 120, grants: [3,4,4,5,6,6,7] },
    { weeklyDays: 1, minHours: 48, maxHours: 72, grants: [1,2,2,3,3,3,3] },
  ])

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">有給休暇設定（パート・アルバイト）</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/leave/admin")}>キャンセル</Button>
            <Button onClick={() => { /* 保存は後で実装 */ }}>保存</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>パート・アルバイト用付与日数表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <Input className="w-14 text-right" value={row.weeklyDays} onChange={(e) => {
                    const v = Number(e.target.value || 0)
                    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, weeklyDays: v } : r))
                  }} />
                  <span className="text-sm text-muted-foreground">日/週</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Input className="w-20 text-right" value={row.minHours} onChange={(e) => {
                    const v = Number(e.target.value || 0)
                    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, minHours: v } : r))
                  }} />
                  <span className="text-sm text-muted-foreground">h/年 最小</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Input className="w-20 text-right" value={row.maxHours} onChange={(e) => {
                    const v = Number(e.target.value || 0)
                    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, maxHours: v } : r))
                  }} />
                  <span className="text-sm text-muted-foreground">h/年 最大</span>
                </div>
                <div className="col-span-6 grid grid-cols-7 gap-1">
                  {row.grants.map((g, i) => (
                    <SmallStepper key={i} value={g} onChange={(v) => {
                      setRows((prev) => prev.map((r, rIdx) => rIdx === idx ? { ...r, grants: r.grants.map((gg, gi) => gi === i ? v : gg) } : r))
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/leave/settings")}>戻る</Button>
          <Button onClick={() => router.push("/leave/admin")}>設定を完了</Button>
        </div>
      </div>
    </main>
  )
}


