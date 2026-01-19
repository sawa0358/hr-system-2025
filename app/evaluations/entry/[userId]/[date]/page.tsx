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
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export default function EvaluationEntryPage() {
    const params = useParams()
    const router = useRouter()
    const { currentUser } = useAuth()
    const userId = params.userId as string
    const dateStr = params.date as string

    const [isLocked, setIsLocked] = useState(false)
    const [canEdit, setCanEdit] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [thankYous, setThankYous] = useState<any[]>([])
    const [thankYouMessage, setThankYouMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [employeeName, setEmployeeName] = useState("")
    const [teamName, setTeamName] = useState("")
    const [stats, setStats] = useState<any>(null)

    const isAdminOrHrOrManager = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager'

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Submission
                const subRes = await fetch(`/api/evaluations/submissions?date=${dateStr}&userId=${userId}`)
                const subData = await subRes.json()

                if (subData.submission) {
                    // Load from submission
                    // Convert submission items to UI items
                    const loadedItems = subData.submission.items.map((i: any) => ({
                        id: i.itemId || i.id, // items that came from pattern have itemId?
                        type: i.title === 'ありがとう送信' ? 'thank_you' : (i.title.includes('振り返り') ? 'text' : 'checkbox'), // Simple heuristic or need 'type' in submission item?
                        // Schema has 'type' in Item, but SubmissionItem doesn't store type explicitly? 
                        // SubmissionItem has `itemId`. Logic:
                        // If we want exact type, we might need to join pattern items.
                        // For now, let's assume 'checkbox' default unless textValue is present.
                        itemId: i.itemId,
                        title: i.title,
                        description: i.description,
                        points: i.points,
                        checked: i.isChecked,
                        value: i.textValue || '',
                        mandatory: false // Hard to know from here
                    })).filter((i: any) => i.type !== 'thank_you') // Filter out separate thank you logic if stored as items

                    setItems(loadedItems)
                } else {
                    // 2. No submission, fetch Pattern
                    const empRes = await fetch(`/api/evaluations/settings/employees/${userId}`)
                    const empData = await empRes.json()

                    if (empData && empData.name) {
                        setEmployeeName(empData.name)
                        setTeamName(empData.personnelEvaluationTeam?.name || "")

                        // Fetch Team Stats
                        if (empData.personnelEvaluationTeamId) {
                            fetch(`/api/evaluations/dashboard?date=${dateStr}&teamId=${empData.personnelEvaluationTeamId}`)
                                .then(r => r.json())
                                .then(d => {
                                    if (d.stats) setStats(d.stats.currentMonth)
                                })
                        }
                    }

                    const patternId = empData.personnelEvaluationPatternId || empData.personnelEvaluationPattern?.id
                    if (patternId) {
                        const patRes = await fetch(`/api/evaluations/settings/patterns?id=${patternId}`)
                        const patData = await patRes.json()
                        if (patData && patData.items) {
                            setItems(patData.items.map((i: any) => ({
                                id: i.id,
                                itemId: i.id,
                                type: i.type,
                                title: i.title,
                                description: i.description,
                                points: i.points,
                                checked: false,
                                value: '',
                                mandatory: i.isMandatory
                            })))
                        }
                    } else {
                        // Fallback or empty
                        setItems([])
                    }
                }

                // 3. Lock Logic
                setIsLocked(subData.isLocked)
                // If locked, only admin/hr/manager can edit
                if (subData.isLocked) {
                    setCanEdit(isAdminOrHrOrManager)
                } else {
                    setCanEdit(true)
                }

            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        if (userId && dateStr) {
            loadData()
        }
    }, [userId, dateStr, currentUser])

    const handleSave = async () => {
        if (!canEdit) return

        try {
            const body = {
                date: dateStr,
                employeeId: userId,
                items: items.map(i => ({
                    itemId: i.itemId,
                    title: i.title,
                    description: i.description,
                    points: i.points,
                    checked: i.checked,
                    textValue: i.value
                })),
                thankYous: thankYouMessage ? [{ to: [], message: thankYouMessage }] : [] // Simplified for now
            }

            const res = await fetch('/api/evaluations/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                alert('保存しました')
                // Reload or re-fetch?
            } else {
                const err = await res.json()
                alert(`エラー: ${err.error}`)
            }
        } catch (e) {
            console.error(e)
            alert('保存に失敗しました')
        }
    }

    const toggleCheck = (index: number, checked: boolean) => {
        if (!canEdit) return
        const newItems = [...items]
        newItems[index].checked = checked
        setItems(newItems)
    }

    const updateText = (index: number, val: string) => {
        if (!canEdit) return
        const newItems = [...items]
        newItems[index].value = val
        setItems(newItems)
    }

    if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>

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
                            {isLocked && !canEdit && <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Lock className="w-3 h-3" /> 編集不可</Badge>}
                            {isLocked && canEdit && <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">ロック期間外 (修正権限あり)</Badge>}
                        </h1>
                        <p className="text-xs text-slate-500">{employeeName} {teamName && `(${teamName})`}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canEdit && (
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            <Save className="w-4 h-4 mr-2" />
                            保存
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 max-w-3xl space-y-6">
                {/* Stats Header (Reference Image 2 Style) */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        {/* Contract Stats */}
                        <div className="bg-slate-900 text-white p-4">
                            <div className="text-center font-bold mb-4 text-base bg-slate-800 py-1 rounded">2026年1月</div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 mb-1">
                                <div>契約達成額</div>
                                <div>契約目標額</div>
                                <div>達成率</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center items-end">
                                <div className="text-lg font-bold">¥{(stats.contract?.achieved || 0).toLocaleString()}</div>
                                <div className="text-lg font-bold">¥{(stats.contract?.target || 0).toLocaleString()}</div>
                                <div className="text-xl font-black text-yellow-400">{stats.contract?.rate}%</div>
                            </div>
                        </div>
                        {/* Completion Stats */}
                        <div className="bg-slate-900 text-white p-4">
                            <div className="flex items-center justify-center gap-2 font-bold mb-4 text-base bg-slate-800 py-1 rounded">
                                2025年11月 <Badge variant="secondary" className="text-[10px] bg-slate-600 text-slate-200">確定: 2ヶ月前</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 mb-1">
                                <div>完工達成額</div>
                                <div>完工目標額</div>
                                <div>達成率</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center items-end">
                                <div className="text-lg font-bold">¥{(stats.completion?.achieved || 0).toLocaleString()}</div>
                                <div className="text-lg font-bold">¥{(stats.completion?.target || 0).toLocaleString()}</div>
                                <div className="text-xl font-black text-yellow-400">{stats.completion?.rate}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Check Items */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        チェック項目
                    </h2>

                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        {/* List Header */}
                        <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="w-8 text-center mr-3">Check</div>
                            <div className="flex-1">Content</div>
                            <div className="w-16 text-right">Info</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {items.filter(i => !['photo', 'thank_you'].includes(i.type)).length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic text-sm">評価項目が設定されていません</div>
                            )}

                            {items.filter(i => !['photo', 'thank_you'].includes(i.type)).map((item, index) => (
                                <div key={item.id} className={cn(
                                    "group flex items-start px-4 transition-colors",
                                    item.type === 'description' ? "bg-blue-50/70 py-1.5" : (item.checked ? "bg-blue-50/20 py-3" : "hover:bg-slate-50/50 py-3")
                                )}>
                                    {/* Checkbox / Icon */}
                                    <div className="w-8 mr-3 flex justify-center pt-0.5">
                                        {(item.type === 'checkbox' || !item.type) ? (
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={(c) => toggleCheck(index, !!c)}
                                                disabled={!canEdit}
                                                className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 w-5 h-5 rounded-md"
                                            />
                                        ) : (
                                            item.type === 'text' ? <MessageCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div
                                            className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", (item.type === 'checkbox' || !item.type) && canEdit && "cursor-pointer")}
                                            onClick={() => (item.type === 'checkbox' || !item.type) && canEdit && toggleCheck(index, !item.checked)}
                                        >
                                            <Label className={cn("text-sm font-medium leading-snug cursor-pointer break-words", item.checked ? "text-slate-400" : "text-slate-700")}>
                                                {item.title}
                                            </Label>
                                            {item.description && (
                                                <span className={cn("text-[10px] break-words leading-tight", item.checked ? "text-slate-300" : "text-slate-400")}>
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>

                                        {/* Input for Text/Desc */}
                                        {(item.type === 'text' || item.type === 'description') && (
                                            <div className="pt-1">
                                                <Textarea
                                                    value={item.value || ''}
                                                    onChange={(e) => updateText(index, e.target.value)}
                                                    placeholder={item.type === 'description' ? '' : "入力してください..."}
                                                    disabled={item.type === 'description' ? true : !canEdit}
                                                    className={cn("text-xs min-h-[60px] resize-y w-full leading-relaxed", item.type === 'description' ? "bg-transparent border-none px-0 py-0 shadow-none text-slate-500 resize-none h-auto min-h-0" : "bg-white border-slate-200 focus-visible:ring-blue-400")}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Badges/Right Info */}
                                    <div className="w-16 pl-2 text-right flex flex-col items-end gap-1 flex-shrink-0">
                                        {item.mandatory && <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 bg-red-50 px-1 py-0 h-4 leading-none flex items-center">必須</Badge>}
                                        {item.points > 0 && <span className="text-[10px] font-bold text-slate-400 font-mono">+{item.points}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Photo Section */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        写真アップロード
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Placeholder for photo upload UI */}
                        {items.filter(i => i.type === 'photo').map((item, index) => (
                            <Card key={item.id} className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px]">
                                    <Camera className="w-8 h-8 opacity-50" />
                                    <span className="text-xs font-bold">{item.title}</span>
                                </CardContent>
                            </Card>
                        ))}
                        {items.filter(i => i.type === 'photo').length === 0 && (
                            <div className="col-span-2 text-sm text-slate-400 italic">写真項目の設定はありません</div>
                        )}
                    </div>
                </div>

                {/* Thank You Section */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-pink-600 flex items-center gap-2">
                        <Heart className="w-4 h-4 fill-pink-500" />
                        ありがとうを送る
                    </h2>
                    {canEdit && (
                        <Card className="border-pink-200 bg-pink-50/30">
                            <CardContent className="p-4 space-y-4">
                                <Textarea
                                    value={thankYouMessage}
                                    onChange={e => setThankYouMessage(e.target.value)}
                                    placeholder="感謝のメッセージを入力..."
                                    className="min-h-[80px] bg-white border-pink-200 focus-visible:ring-pink-400"
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Locked Message */}
                {isLocked && !canEdit && (
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
