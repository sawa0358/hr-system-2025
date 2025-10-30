"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GrantTableEntry {
  years: number
  days: number
}

interface PartTimeGrantEntry {
  weeklyDays: number
  annualDaysMin: number
  annualDaysMax: number
  grants: { [key: string]: number } // key: "0.5", "1.5", etc.
}

export function AdminSettingsDialog() {
  const [settings, setSettings] = useState({
    initialGrantMonths: 6,
    grantIntervalMonths: 12,
    expiryYears: 2,
    minimumUsageDays: 5,
  })

  const [grantTable, setGrantTable] = useState<GrantTableEntry[]>([
    { years: 0.5, days: 10 },
    { years: 1.5, days: 11 },
    { years: 2.5, days: 12 },
    { years: 3.5, days: 14 },
    { years: 4.5, days: 16 },
    { years: 5.5, days: 18 },
    { years: 6.5, days: 20 },
  ])

  const [partTimeGrantTable, setPartTimeGrantTable] = useState<PartTimeGrantEntry[]>([
    {
      weeklyDays: 4,
      annualDaysMin: 169,
      annualDaysMax: 216,
      grants: { "0.5": 7, "1.5": 8, "2.5": 9, "3.5": 10, "4.5": 12, "5.5": 13, "6.5": 15 },
    },
    {
      weeklyDays: 3,
      annualDaysMin: 121,
      annualDaysMax: 168,
      grants: { "0.5": 5, "1.5": 6, "2.5": 6, "3.5": 8, "4.5": 9, "5.5": 10, "6.5": 11 },
    },
    {
      weeklyDays: 2,
      annualDaysMin: 73,
      annualDaysMax: 120,
      grants: { "0.5": 3, "1.5": 4, "2.5": 4, "3.5": 5, "4.5": 6, "5.5": 6, "6.5": 7 },
    },
    {
      weeklyDays: 1,
      annualDaysMin: 48,
      annualDaysMax: 72,
      grants: { "0.5": 1, "1.5": 2, "2.5": 2, "3.5": 2, "4.5": 3, "5.5": 3, "6.5": 3 },
    },
  ])

  const handleSave = () => {
    const configData = {
      ...settings,
      grantTable,
      partTimeGrantTable,
    }
    console.log("[v0] Settings saved:", configData)
  }

  const addGrantEntry = () => {
    const lastEntry = grantTable[grantTable.length - 1]
    setGrantTable([
      ...grantTable,
      { years: lastEntry ? lastEntry.years + 1 : 0.5, days: lastEntry ? lastEntry.days + 1 : 10 },
    ])
  }

  const removeGrantEntry = (index: number) => {
    setGrantTable(grantTable.filter((_, i) => i !== index))
  }

  const updateGrantEntry = (index: number, field: "years" | "days", value: number) => {
    const updated = [...grantTable]
    updated[index][field] = value
    setGrantTable(updated)
  }

  const addPartTimeEntry = () => {
    setPartTimeGrantTable([
      ...partTimeGrantTable,
      {
        weeklyDays: 1,
        annualDaysMin: 48,
        annualDaysMax: 72,
        grants: { "0.5": 1, "1.5": 2, "2.5": 2, "3.5": 2, "4.5": 3, "5.5": 3, "6.5": 3 },
      },
    ])
  }

  const removePartTimeEntry = (index: number) => {
    setPartTimeGrantTable(partTimeGrantTable.filter((_, i) => i !== index))
  }

  const updatePartTimeEntry = (
    index: number,
    field: "weeklyDays" | "annualDaysMin" | "annualDaysMax",
    value: number,
  ) => {
    const updated = [...partTimeGrantTable]
    updated[index][field] = value
    setPartTimeGrantTable(updated)
  }

  const updatePartTimeGrant = (index: number, years: string, days: number) => {
    const updated = [...partTimeGrantTable]
    updated[index].grants[years] = days
    setPartTimeGrantTable(updated)
  }

  const yearColumns = ["0.5", "1.5", "2.5", "3.5", "4.5", "5.5", "6.5"]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Settings className="h-4 w-4" />
          設定
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>有給休暇設定</DialogTitle>
          <DialogDescription>法改正や会社規定に応じて、有給休暇の設定を変更できます。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 基本設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本設定</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="initialGrantMonths">初回付与までの期間（月）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="initialGrantMonths"
                    type="number"
                    value={settings.initialGrantMonths}
                    onChange={(e) =>
                      setSettings({ ...settings, initialGrantMonths: Number.parseInt(e.target.value) || 0 })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">ヶ月</span>
                </div>
                <p className="text-xs text-muted-foreground">入社から初回有給付与までの期間（通常：6ヶ月）</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="grantIntervalMonths">付与間隔（月）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="grantIntervalMonths"
                    type="number"
                    value={settings.grantIntervalMonths}
                    onChange={(e) =>
                      setSettings({ ...settings, grantIntervalMonths: Number.parseInt(e.target.value) || 0 })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">ヶ月</span>
                </div>
                <p className="text-xs text-muted-foreground">有給付与の間隔（通常：12ヶ月）</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiryYears">有効期限（年）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="expiryYears"
                    type="number"
                    value={settings.expiryYears}
                    onChange={(e) => setSettings({ ...settings, expiryYears: Number.parseInt(e.target.value) || 0 })}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">年</span>
                </div>
                <p className="text-xs text-muted-foreground">有給休暇の有効期限（通常：2年）</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minimumUsageDays">最低取得日数（義務）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="minimumUsageDays"
                    type="number"
                    value={settings.minimumUsageDays}
                    onChange={(e) =>
                      setSettings({ ...settings, minimumUsageDays: Number.parseInt(e.target.value) || 0 })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">日</span>
                </div>
                <p className="text-xs text-muted-foreground">労働基準法で定められた年間最低取得日数（現行：5日）</p>
              </div>
            </CardContent>
          </Card>

          {/* 勤続年数別付与日数テーブル（正社員） */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">勤続年数別付与日数（正社員）</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addGrantEntry}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-sm font-medium text-muted-foreground pb-2">
                  <div>勤続年数</div>
                  <div>付与日数</div>
                  <div className="w-10"></div>
                </div>
                {grantTable.map((entry, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        value={entry.years}
                        onChange={(e) => updateGrantEntry(index, "years", Number.parseFloat(e.target.value) || 0)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">年</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={entry.days}
                        onChange={(e) => updateGrantEntry(index, "days", Number.parseInt(e.target.value) || 0)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">日</span>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGrantEntry(index)}
                      disabled={grantTable.length <= 1}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                勤続年数に応じた有給休暇の付与日数を設定します。法改正時にも柔軟に対応できます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">パート・アルバイト用付与日数表</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPartTimeEntry}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                週の所定勤務日数が4日以下で、かつ週の所定勤務時間が30時間未満の従業員用の付与日数表。各年次ごとに所定勤務日数の8割以上の出勤が必要です。
              </p>
              <div className="w-full">
                {/* Header */}
                <div className="grid gap-2 text-xs font-medium text-muted-foreground pb-2 border-b mb-2">
                  <div className="grid grid-cols-[80px_120px_120px_repeat(7,70px)_40px] gap-1 items-center">
                    <div>週勤務日数</div>
                    <div>年間勤務日数（最小）</div>
                    <div>年間勤務日数（最大）</div>
                    {yearColumns.map((year) => (
                      <div key={year} className="text-center">
                        {year}年
                      </div>
                    ))}
                    <div></div>
                  </div>
                </div>

                {/* Rows */}
                {partTimeGrantTable.map((entry, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[80px_120px_120px_repeat(7,70px)_40px] gap-1 items-center mb-2"
                  >
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={entry.weeklyDays}
                        onChange={(e) => updatePartTimeEntry(index, "weeklyDays", Number.parseInt(e.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">日</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={entry.annualDaysMin}
                        onChange={(e) =>
                          updatePartTimeEntry(index, "annualDaysMin", Number.parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">日</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={entry.annualDaysMax}
                        onChange={(e) =>
                          updatePartTimeEntry(index, "annualDaysMax", Number.parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">日</span>
                    </div>
                    {yearColumns.map((year) => (
                      <Input
                        key={year}
                        type="number"
                        value={entry.grants[year] || 0}
                        onChange={(e) => updatePartTimeGrant(index, year, Number.parseInt(e.target.value) || 0)}
                        className="h-8 text-xs text-center"
                      />
                    ))}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removePartTimeEntry(index)}
                      disabled={partTimeGrantTable.length <= 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                勤続年数が6.5年以上の場合、6.5年に1年ずつを加算した勤続年数に至った日の翌日に新たな年次有給休暇を付与します。
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline">
            キャンセル
          </Button>
          <Button type="button" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
