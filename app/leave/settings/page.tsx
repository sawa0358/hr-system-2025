"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Loader2, Lock, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { AppConfig } from "@/lib/vacation-config"
import { DEFAULT_APP_CONFIG } from "@/lib/vacation-config"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

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
  const { currentUser } = useAuth()
  
  // 総務・管理者のみアクセス可
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  
  const [isSaving, setIsSaving] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [firstGrantMonths, setFirstGrantMonths] = useState(6)
  const [cycleMonths, setCycleMonths] = useState(12)
  const [expireYears, setExpireYears] = useState(2)
  const [minDays, setMinDays] = useState(5)
  const [minGrantDaysForAlert, setMinGrantDaysForAlert] = useState(10)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'init' | 'generate' | null>(null)
  const [isGeneratingLots, setIsGeneratingLots] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // デフォルト値から初期化
  const getDefaultRows = () => {
    const defaultYears = DEFAULT_APP_CONFIG.fullTime.table.map(t => t.years)
    return DEFAULT_APP_CONFIG.partTime.tables.map(table => ({
      weeklyDays: table.weeklyPattern,
      minDays: table.minAnnualWorkdays || 0,
      maxDays: table.maxAnnualWorkdays || 0,
      grants: defaultYears.map((y) => {
        const grant = table.grants.find(g => g.years === y)
        return grant?.days || 0
      }),
    }))
  }

  const [yearsTable, setYearsTable] = useState<number[]>(
    DEFAULT_APP_CONFIG.fullTime.table.map(t => t.years)
  )
  const [grantDaysTable, setGrantDaysTable] = useState<number[]>(
    DEFAULT_APP_CONFIG.fullTime.table.map(t => t.days)
  )

  const [rows, setRows] = useState(getDefaultRows())

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
          
          // アラート設定を読み込み
          if (config.alert?.minGrantDaysForAlert !== undefined) {
            setMinGrantDaysForAlert(config.alert.minGrantDaysForAlert)
          }
          
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
        } else {
          // 設定が存在しない場合はデフォルト値を使用
          console.log('設定が存在しないため、デフォルト値を使用します')
          applyDefaultConfig()
        }
      } catch (error) {
        console.error('設定の読み込みエラー:', error)
        // エラー時はデフォルト値を使用
        applyDefaultConfig()
      } finally {
        setIsLoading(false)
      }
    }

    // デフォルト設定を適用する関数
    const applyDefaultConfig = () => {
      const config = DEFAULT_APP_CONFIG
      
      // 基本設定を適用
      if (config.baselineRule.kind === 'RELATIVE_FROM_JOIN') {
        setFirstGrantMonths(config.baselineRule.initialGrantAfterMonths)
        setCycleMonths(config.baselineRule.cycleMonths)
      }
      
      if (config.expiry.kind === 'YEARS') {
        setExpireYears(config.expiry.years)
      }
      
      setMinDays(config.minLegalUseDaysPerYear)
      
      // アラート設定を適用
      if (config.alert?.minGrantDaysForAlert !== undefined) {
        setMinGrantDaysForAlert(config.alert.minGrantDaysForAlert)
      }
      
      // 正社員用テーブルを適用
      if (config.fullTime?.table && config.fullTime.table.length > 0) {
        const years = config.fullTime.table.map(t => t.years)
        const days = config.fullTime.table.map(t => t.days)
        setYearsTable(years)
        setGrantDaysTable(days)
        
        // パートタイム用テーブルを適用
        if (config.partTime?.tables && config.partTime.tables.length > 0) {
          const partTimeRows = config.partTime.tables.map(table => ({
            weeklyDays: table.weeklyPattern,
            minDays: table.minAnnualWorkdays || 0,
            maxDays: table.maxAnnualWorkdays || 0,
            grants: years.map((y) => {
              const grant = table.grants.find(g => g.years === y)
              return grant?.days || 0
            }),
          }))
          setRows(partTimeRows)
        }
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
        minGrantDaysForAlert: minGrantDaysForAlert,
      },
    }

    return config
  }

  // 保存処理（保存のみ。即時有効化はせず、初期設定投入を促す）
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
      console.log('設定保存開始:', config.version)
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
        console.error('設定保存エラー:', errorMessage, errorDetails)
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const saveResult = await saveResponse.json()
      console.log('設定保存成功:', saveResult)
      
      // 保存後に即座に全社員の有給日数を再計算
      try {
        console.log('有給日数の即時再計算を開始...')
        const recalcResponse = await fetch('/api/vacation/recalc/all', {
          method: 'POST',
        })
        
        if (recalcResponse.ok) {
          const recalcResult = await recalcResponse.json()
          console.log('有給日数再計算成功:', recalcResult)
          toast({
            title: "保存完了・日数反映済み",
            description: `設定を保存し、全社員の有給日数を即座に再計算しました。成功: ${recalcResult.summary?.success || 0}件`,
          })
        } else {
          console.warn('有給日数再計算エラー（設定は保存済み）:', await recalcResponse.text())
          toast({
            title: "保存完了（日数反映に失敗）",
            description: "設定は保存されましたが、日数の再計算に失敗しました。手動で『全社員付与ロット生成』を実行してください。",
            variant: "default",
          })
        }
      } catch (recalcError) {
        console.error('有給日数再計算例外（設定は保存済み）:', recalcError)
        toast({
          title: "保存完了（日数反映に失敗）",
          description: "設定は保存されましたが、日数の再計算に失敗しました。手動で『全社員付与ロット生成』を実行してください。",
          variant: "default",
        })
      }
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

  // パスワード確認
  const handlePasswordVerify = async () => {
    if (!currentUser) {
      setPasswordError("ログインしていません")
      return
    }

    // パスワード検証APIを呼び出し
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: currentUser.id,
          password: password,
        }),
      })

      if (!res.ok) {
        setPasswordError("パスワードが正しくありません")
        return
      }

      const result = await res.json()
      if (!result.valid) {
        setPasswordError("パスワードが正しくありません")
        return
      }

      // パスワード認証成功
      setIsPasswordDialogOpen(false)
      setPassword("")
      setPasswordError("")

      // 保留中のアクションを実行
      if (pendingAction === 'init') {
        await executeInitConfig()
      } else if (pendingAction === 'generate') {
        await executeGenerateLots()
      }
    } catch (error) {
      console.error('パスワード検証エラー:', error)
      setPasswordError("パスワード認証に失敗しました")
    }
  }

  // 初期設定投入ボタンクリック
  const handleInitConfigClick = () => {
    setPendingAction('init')
    setIsPasswordDialogOpen(true)
  }

  // 全社員付与ロット生成ボタンクリック
  const handleGenerateLotsClick = () => {
    setPendingAction('generate')
    setIsPasswordDialogOpen(true)
  }

  // 全社員付与ロット生成実行
  const executeGenerateLots = async () => {
    try {
      setIsGeneratingLots(true)
      const res = await fetch('/api/vacation/admin/generate-lots', {
        method: 'POST',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error || '付与ロットの生成に失敗しました')
      }

      const result = await res.json()
      const summary = result.summary || {}
      
      toast({
        title: "付与ロット生成完了",
        description: result.message || `成功: ${summary.success || 0}件、エラー: ${summary.error || 0}件`,
      })
    } catch (error: any) {
      console.error('付与ロット生成エラー:', error)
      toast({
        title: "エラー",
        description: error?.message || '付与ロットの生成に失敗しました',
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLots(false)
    }
  }

  // 初期設定投入実行
  const executeInitConfig = async () => {
    try {
      console.log('初期設定投入開始')
      setIsInitializing(true)
      
      // 1. 設定を有効化
      const res = await fetch('/api/vacation/config/init', {
        method: 'POST',
      })
      const json = await res.json().catch(() => ({}))
      console.log('初期設定投入レスポンス:', res.status, json)
      if (!res.ok || json?.success === false) {
        console.error('初期設定投入エラー:', json?.error || json?.message)
        throw new Error(json?.error || json?.message || '初期設定の投入に失敗しました')
      }
      console.log('初期設定投入成功:', json)
      
      // 2. 自動実行を有効化（失効処理と自動付与のテスト実行）
      try {
        // 自動実行APIのテスト実行（実際にはcronサービスが自動実行する）
        // ここでは、APIが正常に動作することを確認するだけ
        const expireTest = await fetch('/api/cron/expire?token=' + (process.env.CRON_SECRET_TOKEN || ''), {
          method: 'GET',
        })
        const grantTest = await fetch('/api/cron/grant?token=' + (process.env.CRON_SECRET_TOKEN || ''), {
          method: 'GET',
        })
        
        console.log('自動実行APIテスト完了:', {
          expire: expireTest.ok,
          grant: grantTest.ok,
        })
        
        toast({ 
          title: '初期設定投入完了', 
          description: '設定を有効化しました。自動実行は外部のcronサービス（Heroku Scheduler等）で設定してください。' 
        })
      } catch (autoRunError: any) {
        console.warn('自動実行APIテストエラー（無視）:', autoRunError)
        // 自動実行のテストエラーは無視して、設定の有効化は成功とする
        toast({ 
          title: '初期設定投入完了', 
          description: json?.message || '設定を有効化しました。自動実行の設定が必要です。' 
        })
      }
    } catch (e: any) {
      console.error('初期設定投入例外:', e)
      toast({ title: 'エラー', description: e?.message || '初期設定の投入に失敗しました', variant: 'destructive' })
    } finally {
      setIsInitializing(false)
    }
  }

  // 総務・管理者以外はアクセス不可
  if (!isAdminOrHR) {
    return (
      <main className="overflow-y-auto">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">アクセス権限がありません</h2>
            <p className="text-muted-foreground">このページは総務・管理者のみアクセス可能です。</p>
            <Button className="mt-4" onClick={() => router.push("/leave/admin")}>
              管理者画面に戻る
            </Button>
          </div>
        </div>
      </main>
    )
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
            <Button variant="outline" onClick={handleInitConfigClick} disabled={isSaving || isInitializing}>
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  反映中...
                </>
              ) : (
                '初期設定投入（反映）'
              )}
            </Button>
            <Button variant="outline" onClick={handleGenerateLotsClick} disabled={isSaving || isInitializing || isGeneratingLots}>
              {isGeneratingLots ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '全社員付与ロット生成'
              )}
            </Button>
          </div>
        </div>

        {/* パスワード確認ダイアログ */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                パスワード認証
              </DialogTitle>
              <DialogDescription>
                {pendingAction === 'init' 
                  ? '初期設定投入（反映）: 保存した設定を有効化し、全社員に適用します。設定変更後は必ずこの操作を実行してください。'
                  : '全社員付与ロット生成: 全社員の有給付与ロットを一括生成・更新します。設定変更後やデータリセット後に実行してください。'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  {pendingAction === 'init'
                    ? 'この操作により、保存した設定が全社員に適用されます。実行には管理者・総務のパスワードが必要です。'
                    : 'この操作により、全社員の有給付与ロットが生成・更新されます。実行には管理者・総務のパスワードが必要です。'}
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
                    setPasswordError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasswordVerify()
                  }}
                  placeholder="パスワードを入力"
                  autoFocus
                />
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  setPassword("")
                  setPasswordError("")
                  setPendingAction(null)
                }}
              >
                キャンセル
              </Button>
              <Button onClick={handlePasswordVerify} className="bg-blue-600 hover:bg-blue-700" disabled={!password}>
                認証して実行
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">5日消化義務アラート対象（1回の付与日数）</div>
                <HoverStepperInput value={minGrantDaysForAlert} onChange={setMinGrantDaysForAlert} suffix="日以上" />
                <div className="text-xs text-muted-foreground">1回の付与がこの日数以上の社員がアラート対象（現行：10日以上）</div>
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


