"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { AppConfig } from "@/lib/vacation-config"
import { useToast } from "@/hooks/use-toast"

type HoverStepperInputProps = {
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
  className?: string
  showOverlay?: boolean
  nativeSpinner?: boolean
}

function HoverStepperInput(props: HoverStepperInputProps) {
  const { value, onChange, suffix = "", step = 1, className = "w-24", showOverlay = true, nativeSpinner = false } = props
  return (
    <div className="group relative inline-flex items-center gap-1">
      <Input
        type="number"
        className={`${className} text-right ${showOverlay ? "pr-10" : "pr-2"} ${nativeSpinner ? "" : "no-native-spinner"}`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
      {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
      {showOverlay && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col gap-0.5">
          <Button type="button" variant="outline" size="icon" className="h-5 w-5 p-0" onClick={() => onChange(value + step)}>▲</Button>
          <Button type="button" variant="outline" size="icon" className="h-5 w-5 p-0" onClick={() => onChange(Math.max(0, value - step))}>▼</Button>
        </div>
      )}
    </div>
  )
}

export default function LeaveSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [firstGrantMonths, setFirstGrantMonths] = useState(6)
  const [cycleMonths, setCycleMonths] = useState(12)
  const [expireYears, setExpireYears] = useState(2)
  const [minDays, setMinDays] = useState(5)

  const [yearsTable, setYearsTable] = useState<number[]>([0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5])
  const [grantDaysTable, setGrantDaysTable] = useState<number[]>([10, 11, 12, 14, 16, 18, 20])

  const [rows, setRows] = useState([
    { weeklyDays: 4, minDays: 169, maxDays: 216, grants: [7, 8, 9, 10, 12, 13, 15] },
    { weeklyDays: 3, minDays: 121, maxDays: 168, grants: [5, 6, 6, 8, 9, 10, 11] },
    { weeklyDays: 2, minDays: 73, maxDays: 120, grants: [3, 4, 4, 5, 6, 6, 7] },
    { weeklyDays: 1, minDays: 48, maxDays: 72, grants: [1, 2, 2, 3, 3, 3, 3] },
  ])

  // 既存の設定を読み込む
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/vacation/config')
        if (res.ok) {
          const config: AppConfig = await res.json()
          
          // 基本設定を読み込み
          if (config.baselineRule.kind === 'RELATIVE_FROM_JOIN') {
            setFirstGrantMonths(config.baselineRule.initialGrantAfterMonths)
            setCycleMonths(config.baselineRule.cycleMonths)
          }
          
          if (config.expiry.kind === 'YEARS') {
            setExpireYears(config.expiry.years)
          }
          
          setMinDays(config.minLegalUseDaysPerYear)
          
          // 正社員用テーブルを読み込み
          if (config.fullTime?.table && config.fullTime.table.length > 0) {
            const years = config.fullTime.table.map(t => t.years)
            const days = config.fullTime.table.map(t => t.days)
            setYearsTable(years)
            setGrantDaysTable(days)
            
            // パートタイム用テーブルを読み込み（yearsTableが更新された後）
            if (config.partTime?.tables && config.partTime.tables.length > 0) {
              const partTimeRows = config.partTime.tables.map(table => ({
                weeklyDays: table.weeklyPattern,
                minDays: table.minAnnualWorkdays || 0,
                maxDays: table.maxAnnualWorkdays || 0,
                grants: years.map((y, idx) => {
                  const grant = table.grants.find(g => g.years === y)
                  return grant?.days || 0
                }),
              }))
              setRows(partTimeRows)
            }
          } else {
            // パートタイム用テーブルを読み込み（yearsTableが未更新の場合）
            if (config.partTime?.tables && config.partTime.tables.length > 0) {
              const partTimeRows = config.partTime.tables.map(table => ({
                weeklyDays: table.weeklyPattern,
                minDays: table.minAnnualWorkdays || 0,
                maxDays: table.maxAnnualWorkdays || 0,
                grants: yearsTable.map((y, idx) => {
                  const grant = table.grants.find(g => g.years === y)
                  return grant?.days || 0
                }),
              }))
              setRows(partTimeRows)
            }
          }
        }
      } catch (error) {
        console.error('設定の読み込みエラー:', error)
        // エラー時はデフォルト値を使用
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConfig()
  }, []) // 初回のみ実行

  // フォームの値からAppConfigを構築
  const buildAppConfig = (): AppConfig => {
    const version = `1.0.${Date.now()}`
    
    // 正社員用のテーブルを構築
    const fullTimeTable = yearsTable.map((years, index) => ({
      years,
      days: grantDaysTable[index],
    }))

    // パートタイム用のテーブルを構築
    const partTimeTables = rows.map((row) => ({
      weeklyPattern: row.weeklyDays as 1 | 2 | 3 | 4,
      grants: yearsTable.map((years, index) => ({
        years,
        days: row.grants[index] || 0,
      })),
      minAnnualWorkdays: row.minDays,
      maxAnnualWorkdays: row.maxDays,
    }))

    const config: AppConfig = {
      version,
      baselineRule: {
        kind: 'RELATIVE_FROM_JOIN',
        initialGrantAfterMonths: firstGrantMonths,
        cycleMonths: cycleMonths,
      },
      grantCycleMonths: cycleMonths,
      expiry: {
        kind: 'YEARS',
        years: expireYears,
      },
      rounding: {
        unit: 'DAY',
        mode: 'ROUND',
      },
      minLegalUseDaysPerYear: minDays,
      fullTime: {
        label: 'A',
        table: fullTimeTable,
      },
      partTime: {
        labels: {
          1: 'B-1',
          2: 'B-2',
          3: 'B-3',
          4: 'B-4',
        },
        tables: partTimeTables,
      },
      alert: {
        checkpoints: [
          { monthsBefore: 3, minConsumedDays: 5 },
          { monthsBefore: 2, minConsumedDays: 3 },
          { monthsBefore: 1, minConsumedDays: 5 },
        ],
      },
    }

    return config
  }

  // 保存処理
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // AppConfigを構築
      const config = buildAppConfig()

      // バリデーション
      if (config.fullTime.table.length === 0) {
        toast({
          title: "エラー",
          description: "正社員用の付与日数表が空です",
          variant: "destructive",
        })
        return
      }

      if (config.partTime.tables.length === 0) {
        toast({
          title: "エラー",
          description: "パートタイム用の付与日数表が空です",
          variant: "destructive",
        })
        return
      }

      // 設定を保存
      const saveResponse = await fetch('/api/vacation/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json().catch(() => ({ error: '設定の保存に失敗しました' }))
        const errorMessage = error.error || '設定の保存に失敗しました'
        const errorDetails = error.details ? `\n詳細: ${JSON.stringify(error.details, null, 2)}` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      // 設定を有効化
      const activateResponse = await fetch('/api/vacation/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version: config.version }),
      })

      if (!activateResponse.ok) {
        const error = await activateResponse.json().catch(() => ({ error: '設定の有効化に失敗しました' }))
        const errorMessage = error.error || '設定の有効化に失敗しました'
        throw new Error(errorMessage)
      }

      toast({
        title: "保存完了",
        description: "有給休暇設定を保存し、有効化しました",
      })

      // 管理者画面に戻る
      router.push('/leave/admin')
    } catch (error) {
      console.error('保存エラー:', error)
      
      // エラーメッセージを抽出
      let errorMessage = '設定の保存に失敗しました'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // エラーの詳細をログに出力
      if (error instanceof Error && error.message) {
        console.error('エラー詳細:', error.message)
      }
      
      toast({
        title: "保存エラー",
        description: errorMessage.length > 100 
          ? `${errorMessage.substring(0, 100)}...` 
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="overflow-y-auto">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">設定を読み込み中...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-6">
        <style jsx global>{`
          /* Hide native number spinners */
          input.no-native-spinner::-webkit-outer-spin-button,
          input.no-native-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input.no-native-spinner { -moz-appearance: textfield; }
        `}</style>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">有給休暇設定</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/leave/admin")} disabled={isSaving}>キャンセル</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本設定</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">初回付与までの期間（月）</div>
                <HoverStepperInput value={firstGrantMonths} onChange={setFirstGrantMonths} suffix="ヶ月" />
                <div className="text-xs text-muted-foreground">入社から初回付与までの期間（標準：6ヶ月）</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">付与間隔（月）</div>
                <HoverStepperInput value={cycleMonths} onChange={setCycleMonths} suffix="ヶ月" />
                <div className="text-xs text-muted-foreground">有給付与の間隔（標準：12ヶ月）</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">有効期限（年）</div>
                <HoverStepperInput value={expireYears} onChange={setExpireYears} suffix="年" />
                <div className="text-xs text-muted-foreground">有給休暇の有効期限（通常：2年）</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">最低取得日数（義務）</div>
                <HoverStepperInput value={minDays} onChange={setMinDays} suffix="日" />
                <div className="text-xs text-muted-foreground">労働基準法で定められた年間最低取得日数（現行：5日）</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>勤続年数別付与日数（正社員）</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 text-sm text-muted-foreground">
                <div>勤続年数</div>
                <div>付与日数</div>
              </div>
              {yearsTable.map((y, i) => (
                <div key={i} className="grid grid-cols-2 items-center gap-4">
                  <div className="flex items-center gap-2">
                    <HoverStepperInput className="w-24" value={y} onChange={(nv) => setYearsTable((prev) => prev.map((p, idx) => (idx === i ? nv : p)))} />
                    <span className="text-sm text-muted-foreground">年</span>
                  </div>
                  <div>
                    <HoverStepperInput value={grantDaysTable[i]} onChange={(v) => setGrantDaysTable((prev) => prev.map((p, idx) => (idx === i ? v : p)))} suffix="日" />
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="px-6 pb-3">
              <p className="text-sm text-muted-foreground">
                勤続年数に応じた有給休暇の付与日数を設定します。法改正時にも柔軟に対応できます。
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>パート・アルバイト用付与日数表</CardTitle>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />追加</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              週の所定勤務日数が4日以下で、かつ週の所定勤務時間が30時間未満の従業員用の付与日数表。各年次ごとに所定勤務日数の8割以上の出勤が必要です。
            </p>
            <div className="grid grid-cols-12 items-center text-xs text-muted-foreground">
              <div className="col-span-2">週勤務日数</div>
              <div className="col-span-2">年間勤務日数（最小）</div>
              <div className="col-span-2">年間勤務日数（最大）</div>
              <div className="col-span-6 grid grid-cols-7">
                <div className="text-center">0.5年</div>
                <div className="text-center">1.5年</div>
                <div className="text-center">2.5年</div>
                <div className="text-center">3.5年</div>
                <div className="text-center">4.5年</div>
                <div className="text-center">5.5年</div>
                <div className="text-center">6.5年</div>
              </div>
            </div>
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <HoverStepperInput className="w-16" value={row.weeklyDays} onChange={(v) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, weeklyDays: v } : r)))} showOverlay={false} nativeSpinner={true} />
                  <span className="text-sm text-muted-foreground">日/週</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <HoverStepperInput className="w-20" value={row.minDays} onChange={(v) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, minDays: v } : r)))} showOverlay={false} nativeSpinner={true} />
                  <span className="text-sm text-muted-foreground">日/年 最小</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <HoverStepperInput className="w-20" value={row.maxDays} onChange={(v) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, maxDays: v } : r)))} showOverlay={false} nativeSpinner={true} />
                  <span className="text-sm text-muted-foreground">日/年 最大</span>
                </div>
                <div className="col-span-6 grid grid-cols-7 gap-1">
                  {row.grants.map((g, i) => (
                    <HoverStepperInput key={i} className="w-14" value={g} onChange={(v) => setRows((prev) => prev.map((r, rIdx) => (rIdx === idx ? { ...r, grants: r.grants.map((gg, gi) => (gi === i ? v : gg)) } : r)))} showOverlay={false} nativeSpinner={true} />
                  ))}
                </div>
                <div className="col-span-12 flex justify-end">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="px-6 pb-3">
            <p className="text-sm text-muted-foreground">
              勤続年数が6.5年以上の場合、6.5年に1年ずつを加算した勤続年数に至った日の翌日に新たな年次有給休暇を付与します。
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}


