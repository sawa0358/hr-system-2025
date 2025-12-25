import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, CheckCircle2, AlertCircle, Sparkles, Coins, ClipboardList, Image as ImageIcon, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/workclock/api'
import { ChecklistItem, Worker } from '@/lib/workclock/types'

interface ChecklistPanelProps {
    worker?: Worker | null
    workerId: string
    selectedDate: Date
    onRewardChange?: (reward: number) => void
    onStateChange?: (state: { checkedItems: Record<string, boolean>; memo: string; items: ChecklistItem[] }) => void
}

export function ChecklistPanel({ worker, workerId, selectedDate, onRewardChange, onStateChange }: ChecklistPanelProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [freeTextValues, setFreeTextValues] = useState<Record<string, string>>({})  // 自由記入欄の値
    const [reportText, setReportText] = useState('')
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)

    const rewardRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)
    const memoRef = useRef<HTMLDivElement>(null)

    // 日付文字列を生成
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

    // チェックリストパターンを読み込み、既存の提出データも取得
    useEffect(() => {
        const loadData = async () => {
            if (!worker?.isChecklistEnabled || !worker?.checklistPatternId) {
                setChecklistItems([])
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                // パターンのアイテムを取得
                const patternRes = await api.checklist.patterns.getById(worker.checklistPatternId) as { pattern: any }
                let items: ChecklistItem[] = []
                if (patternRes.pattern?.items) {
                    items = patternRes.pattern.items.sort((a: ChecklistItem, b: ChecklistItem) => a.position - b.position)
                    setChecklistItems(items)
                }

                // 既存の提出データを取得
                const submissionRes = await api.checklist.submissions.getAll({
                    workerId,
                    startDate: dateStr,
                    endDate: dateStr,
                }) as { submissions: any[] }

                if (submissionRes.submissions && submissionRes.submissions.length > 0) {
                    const submission = submissionRes.submissions[0]
                    setExistingSubmissionId(submission.id)
                    setReportText(submission.memo || '')

                    // チェック済み項目と自由記入欄の値を復元
                    const checkedMap: Record<string, boolean> = {}
                    const freeTextMap: Record<string, string> = {}
                    if (submission.items) {
                        submission.items.forEach((item: any) => {
                            // タイトルでマッチング（IDは変わる可能性があるため）
                            const matchingItem = items.find(i => i.title === item.title)
                            if (matchingItem) {
                                if (item.isFreeText) {
                                    // 自由記入欄の値を復元
                                    freeTextMap[matchingItem.id] = item.freeTextValue || ''
                                } else if (item.isChecked) {
                                    // チェック項目の状態を復元
                                    checkedMap[matchingItem.id] = true
                                }
                            }
                        })
                    }
                    setCheckedItems(checkedMap)
                    setFreeTextValues(freeTextMap)

                    // 報酬を計算
                    const totalReward = items.reduce((total, item) => {
                        return total + (checkedMap[item.id] ? item.reward : 0)
                    }, 0)

                    // 親に通知
                    setTimeout(() => {
                        onRewardChange?.(totalReward)
                        onStateChange?.({ checkedItems: checkedMap, memo: submission.memo || '', items })
                    }, 0)
                } else {
                    // 初期状態を親に通知
                    setTimeout(() => {
                        onStateChange?.({ checkedItems: {}, memo: '', items })
                    }, 0)
                }
            } catch (error) {
                console.error('チェックリストデータの読み込みに失敗:', error)
                setChecklistItems([])
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [worker?.checklistPatternId, worker?.isChecklistEnabled, workerId, dateStr])

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleToggle = (id: string) => {
        setCheckedItems(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            }
            // 報酬合計を計算して親に通知
            const newTotal = checklistItems.reduce((total, item) => {
                return total + (newState[item.id] ? item.reward : 0)
            }, 0)
            setTimeout(() => {
                onRewardChange?.(newTotal)
                // 状態を親に通知
                onStateChange?.({ checkedItems: newState, memo: reportText, items: checklistItems })
            }, 0)
            return newState
        })
    }

    // メモ変更時も親に通知
    const handleMemoChange = (text: string) => {
        setReportText(text)
        setTimeout(() => {
            onStateChange?.({ checkedItems, memo: text, items: checklistItems })
        }, 0)
    }

    const currentRewardTotal = checklistItems.reduce((total, item) => {
        return total + (checkedItems[item.id] ? item.reward : 0)
    }, 0)

    const pendingMandatoryItems = checklistItems.filter(item => item.isMandatory && !checkedItems[item.id])
    const isAllMandatoryChecked = pendingMandatoryItems.length === 0

    // チェックリストが無効な場合の表示
    if (!worker?.isChecklistEnabled) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <ClipboardList className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">業務チェックリストは無効です</h3>
                <p className="text-sm text-slate-300">このワーカーには業務チェックリストが設定されていません。</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-slate-500">チェックリストを読み込み中...</p>
            </div>
        )
    }

    if (checklistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">チェックリスト項目がありません</h3>
                <p className="text-sm text-slate-400">チェックリスト設定ページで項目を追加してください。</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 min-h-0">

            {/* セクションナビゲーション (Compact) */}
            <div className="sticky top-0 z-20 flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-md border-b shadow-sm px-4">
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(rewardRef)} className="h-7 px-2 text-[10px] md:text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-100 rounded-md">
                    <Coins className="w-3 h-3 mr-1" /> 本日の獲得
                </Button>
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(listRef)} className="h-7 px-2 text-[10px] md:text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-md">
                    <ClipboardList className="w-3 h-3 mr-1" /> 業務チェック
                </Button>
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(photoRef)} className="h-7 px-2 text-[10px] md:text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 rounded-md">
                    <ImageIcon className="w-3 h-3 mr-1" /> 写真
                </Button>
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(memoRef)} className="h-7 px-2 text-[10px] md:text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-md">
                    <MessageSquare className="w-3 h-3 mr-1" /> 報告欄
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
                <div className="py-4 space-y-6 max-w-4xl mx-auto pb-16">

                    {/* 1. 本日の獲得予定寸志 (Compact) */}
                    <section ref={rewardRef} className="scroll-mt-16">
                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-yellow-900 flex items-center gap-1.5">
                                    <Coins className="w-4 h-4" /> 本日の獲得予定寸志
                                </h3>
                                <p className="text-[10px] text-yellow-700/70">全ての業務を完了してボーナスを獲得</p>
                            </div>
                            <div className="relative z-10">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-lg font-mono text-xl font-black transition-all duration-300",
                                    currentRewardTotal > 0 ? "bg-white text-yellow-600 border border-yellow-300 shadow-sm" : "bg-slate-100 text-slate-400 border border-slate-200"
                                )}>
                                    <span className="text-xs mr-0.5">¥</span>{currentRewardTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. 業務チェックリスト (Excel-like High Density) */}
                    <section ref={listRef} className="scroll-mt-16 space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-800">業務チェック項目</h3>
                                {isAllMandatoryChecked ? (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-green-50 text-green-600 border-green-200 font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> 必須完了
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-bold animate-pulse">
                                        未完了 ({pendingMandatoryItems.length})
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-lg">
                            <div className="bg-slate-50/80 border-b px-3 py-1 flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <div className="w-10 text-center mr-2">Status</div>
                                <div className="flex-1">Task Content</div>
                                <div className="w-16 text-right">Reward</div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {checklistItems.map(item => (
                                    item.isFreeText ? (
                                        // 自由記入欄の場合
                                        <div key={item.id}
                                            className="group flex flex-col px-3 py-2 bg-purple-50/30 hover:bg-purple-50/50 transition-colors relative"
                                        >
                                            {/* 左端ライン */}
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-400" />

                                            <div className="flex items-center justify-between mb-1.5">
                                                <Label htmlFor={`freetext-${item.id}`} className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {item.title}
                                                </Label>
                                                {item.reward > 0 && (
                                                    <span className="font-mono text-[9px] font-bold text-purple-600">
                                                        +¥{item.reward}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                id={`freetext-${item.id}`}
                                                value={freeTextValues[item.id] || ''}
                                                onChange={(e) => {
                                                    const newValues = { ...freeTextValues, [item.id]: e.target.value }
                                                    setFreeTextValues(newValues)
                                                    setTimeout(() => {
                                                        onStateChange?.({ checkedItems, memo: reportText, items: checklistItems })
                                                    }, 0)
                                                }}
                                                placeholder="入力してください..."
                                                className="text-xs h-8 bg-white border-purple-200 focus:border-purple-400"
                                            />
                                        </div>
                                    ) : (
                                        // 通常のチェック項目
                                        <div key={item.id}
                                            onClick={() => handleToggle(item.id)}
                                            className={cn(
                                                "group flex items-center px-3 py-1.5 min-h-[36px] cursor-pointer transition-colors duration-75 relative",
                                                checkedItems[item.id] ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/50",
                                                item.isMandatory && !checkedItems[item.id] && "bg-red-50/10"
                                            )}
                                        >
                                            {/* 左端ライン */}
                                            {item.isMandatory && (
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-0.5 transition-colors",
                                                    checkedItems[item.id] ? "bg-green-400" : "bg-red-400"
                                                )} />
                                            )}

                                            {/* チェック */}
                                            <div className="w-10 flex justify-center mr-2" onClick={(e) => e.stopPropagation()}>
                                                <Switch
                                                    id={`item-${item.id}`}
                                                    checked={!!checkedItems[item.id]}
                                                    onCheckedChange={() => handleToggle(item.id)}
                                                    className="scale-[0.65] data-[state=checked]:bg-green-500"
                                                />
                                            </div>

                                            {/* テキスト */}
                                            <div className="flex-1 py-0.5">
                                                <Label
                                                    htmlFor={`item-${item.id}`}
                                                    className={cn(
                                                        "text-[11px] font-medium leading-tight block transition-all",
                                                        checkedItems[item.id] ? "text-slate-300 line-through" : "text-slate-600"
                                                    )}
                                                >
                                                    {item.title}
                                                </Label>
                                                {item.isMandatory && !checkedItems[item.id] && (
                                                    <span className="inline-flex items-center text-[8px] font-bold text-red-400 mt-0.5">
                                                        <AlertCircle className="w-2 h-2 mr-0.5" /> 必須項目
                                                    </span>
                                                )}
                                            </div>

                                            {/* 報酬 */}
                                            <div className="w-16 text-right">
                                                {item.reward > 0 ? (
                                                    <span className={cn(
                                                        "font-mono text-[9px] font-bold",
                                                        checkedItems[item.id] ? "text-yellow-600" : "text-slate-300"
                                                    )}>
                                                        +¥{item.reward}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-slate-200 font-mono">-</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </Card>
                    </section>

                    {/* 3. 写真報告 (Compact) */}
                    <section ref={photoRef} className="scroll-mt-16 space-y-2">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 px-1">
                            <ImageIcon className="w-4 h-4 text-green-600" /> 現場写真・報告
                        </h3>
                        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-lg bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-4 py-6 bg-slate-50/50 flex flex-col items-center justify-center border-r border-slate-100">
                                    <div className="bg-white p-3 rounded-full mb-2 shadow-sm border border-slate-100 group cursor-pointer hover:bg-slate-50 transition-colors">
                                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-green-500" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-600">撮影 / アップロード</p>
                                </div>
                                <div className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="border border-dashed border-slate-200 rounded-lg p-4 w-full h-full flex flex-col items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-slate-100 mb-1" />
                                        <p className="text-[9px] text-slate-300 italic truncate w-full">No images uploaded</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* 4. 業務報告メモ (Compact) */}
                    <section ref={memoRef} className="scroll-mt-16 space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-purple-600" /> 業務報告メモ
                            </h3>
                            <Badge variant="outline" className="h-4 px-1.5 text-[8px] text-purple-600 border-purple-100 bg-purple-50 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> AI解析
                            </Badge>
                        </div>
                        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-lg bg-white">
                            <Textarea
                                placeholder="特記事項、申し送りなど..."
                                className="min-h-[100px] border-0 focus-visible:ring-0 text-xs p-3 rounded-none resize-none"
                                value={reportText}
                                onChange={(e) => handleMemoChange(e.target.value)}
                            />
                            <div className="bg-slate-50/80 border-t px-3 py-1.5 flex items-center justify-between">
                                <p className="text-[9px] text-slate-400 italic">
                                    入力内容はAIが解析し管理者に共有されます
                                </p>
                                <span className="text-[8px] text-slate-300 font-mono">{reportText.length} ✍️</span>
                            </div>
                        </Card>
                    </section>

                </div>
            </div>
        </div>
    )
}
