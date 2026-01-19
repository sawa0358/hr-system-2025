"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ArrowLeft,
    Save,
    Plus,
    Camera,
    MessageCircle,
    Heart,
    AlertCircle,
    CheckCircle2,
    Lock
} from "lucide-react"
import { format, isBefore, subDays, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
// import { useAuth } from "@/lib/auth-context" // Assuming this exists
// import { usePermissions } from "@/hooks/use-permissions" // Assuming this exists

export default function EvaluationEntryPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    const dateStr = params.date as string

    // Mock State
    const [isLocked, setIsLocked] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [thankYouRecipients, setThankYouRecipients] = useState<string[]>([])

    // Mock Data Loading
    useEffect(() => {
        // 3-day lock logic (mock)
        const targetDate = parseISO(dateStr)
        const threeDaysAgo = subDays(new Date(), 3)
        const locked = isBefore(targetDate, threeDaysAgo)
        // TODO: Add isAdminOrHR bypass check here
        setIsLocked(locked)

        // Load Items (Mock)
        setItems([
            { id: '1', type: 'checkbox', title: '制服は正しく着用できていますか？', points: 10, checked: false, mandatory: true },
            { id: '2', type: 'checkbox', title: '笑顔で挨拶できていますか？', points: 5, checked: true, mandatory: true },
            { id: '3', type: 'text', title: '本日の振り返り', value: '', mandatory: false },
        ])
    }, [dateStr])

    const handleSave = () => {
        console.log('Saving...', items)
        router.back()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            {format(parseISO(dateStr), 'M月d日(E)', { locale: ja })} の考課入力
                            {isLocked && <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Lock className="w-3 h-3" /> 編集不可</Badge>}
                        </h1>
                        <p className="text-xs text-slate-500">田中 太郎 (Aチーム)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isLocked && (
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            <Save className="w-4 h-4 mr-2" />
                            保存
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 max-w-3xl space-y-6">
                {/* Goals Section */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex justify-around items-center text-center">
                        <div>
                            <div className="text-xs text-slate-500 font-bold mb-1">契約達成率</div>
                            <div className="text-2xl font-bold text-blue-700">85<span className="text-sm">%</span></div>
                            <div className="text-xs text-slate-400">¥1,700,000 / ¥2,000,000</div>
                        </div>
                        <div className="w-px h-12 bg-blue-200"></div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold mb-1">完工達成率</div>
                            <div className="text-2xl font-bold text-indigo-700">92<span className="text-sm">%</span></div>
                            <div className="text-xs text-slate-400">¥1,380,000 / ¥1,500,000</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist Items */}
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <Card key={item.id} className={cn("border-slate-200 shadow-sm transition-all", item.checked ? "bg-blue-50/30 border-blue-200" : "")}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {item.type === 'checkbox' && (
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={(c) => {
                                                    const newItems = [...items]
                                                    newItems[index].checked = c
                                                    setItems(newItems)
                                                }}
                                                disabled={isLocked}
                                                className="w-6 h-6 border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                        )}
                                        {item.type === 'text' && <MessageCircle className="w-6 h-6 text-slate-400" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className={cn("text-base font-bold", item.checked ? "text-blue-800" : "text-slate-700")}>
                                                {item.title}
                                            </Label>
                                            <div className="flex gap-2">
                                                {item.mandatory && <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">必須</Badge>}
                                                {item.points > 0 && <Badge variant="secondary" className="bg-amber-100 text-amber-800">+{item.points}pt</Badge>}
                                            </div>
                                        </div>
                                        {item.type === 'text' && (
                                            <Textarea
                                                placeholder="入力してください..."
                                                disabled={isLocked}
                                                className="bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Actions */}
                {!isLocked && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-blue-50 hover:text-blue-600 border-dashed border-slate-300">
                            <Plus className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">項目を追加</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-green-50 hover:text-green-600 border-dashed border-slate-300">
                            <MessageCircle className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">自由欄追加</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-pink-50 hover:text-pink-600 border-dashed border-slate-300">
                            <Heart className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">ありがとう</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-purple-50 hover:text-purple-600 border-dashed border-slate-300">
                            <Camera className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">写真追加</span>
                        </Button>
                    </div>
                )}

                {/* Thank You Section (Example) */}
                {!isLocked && (
                    <Card className="border-pink-200 bg-pink-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                                <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                                ありがとうを送る
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>誰に送りますか？</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="cursor-pointer hover:bg-pink-100 bg-white border-pink-200 text-pink-700 px-3 py-1">ToAll</Badge>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-pink-100 bg-white border-pink-200 text-pink-700 px-3 py-1">Toチーム</Badge>
                                    <Button size="sm" variant="ghost" className="h-6 text-xs text-slate-500">
                                        <Plus className="w-3 h-3 mr-1" />
                                        個別に選択
                                    </Button>
                                </div>
                            </div>
                            <Textarea placeholder="感謝のメッセージを入力..." className="min-h-[80px] bg-white border-pink-200 focus-visible:ring-pink-400" />
                            <div className="flex justify-end">
                                <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                                    送信 (+5pt)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Locked Message */}
                {isLocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">編集期間が終了しました</h3>
                            <p className="text-xs text-amber-700 mt-1">
                                記録から3日が経過したため、編集はロックされました。<br />
                                修正が必要な場合は、管理者または総務担当者に連絡してください。
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
