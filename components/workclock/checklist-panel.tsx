'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, CheckCircle2, AlertCircle, Sparkles, Coins, ClipboardList, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_CHECKLIST_ITEMS = [
    { id: '1', title: '玄関の施錠確認：全ての入り口が施錠されているか、物理的に引いて確認してください', reward: 0, isMandatory: true },
    { id: '2', title: '機材の電源OFF：共用スペースのPC、モニター、コーヒーメーカーの電源プラグまで抜く', reward: 0, isMandatory: true },
    { id: '3', title: 'フィルター清掃実施：エアコンおよび空気清浄機のフィルターを水洗いした', reward: 500, isMandatory: false },
    { id: '4', title: '備品の在庫補充：コピー用紙、洗剤、トイレットペーパーの在庫を確認し補充した', reward: 300, isMandatory: false },
    { id: '5', title: '日報の丁寧な記入：本日の特記事項を詳細に記録した', reward: 200, isMandatory: false },
    { id: '6', title: 'ゴミ出し：各階のゴミを回収し、指定の集積場へ搬出した', reward: 100, isMandatory: false },
    { id: '7', title: '窓の閉鎖確認：全ての窓が完全に閉まり、クレセント錠がかかっているか確認', reward: 0, isMandatory: true },
    { id: '8', title: '消灯確認：トイレ、更衣室、パントリーを含む全箇所の消灯を完了', reward: 0, isMandatory: true },
]

export function ChecklistPanel() {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [reportText, setReportText] = useState('')

    const rewardRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)
    const memoRef = useRef<HTMLDivElement>(null)

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleToggle = (id: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const currentRewardTotal = MOCK_CHECKLIST_ITEMS.reduce((total, item) => {
        return total + (checkedItems[item.id] ? item.reward : 0)
    }, 0)

    const pendingMandatoryItems = MOCK_CHECKLIST_ITEMS.filter(item => item.isMandatory && !checkedItems[item.id])
    const isAllMandatoryChecked = pendingMandatoryItems.length === 0

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
                                {MOCK_CHECKLIST_ITEMS.map(item => (
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
                                onChange={(e) => setReportText(e.target.value)}
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
