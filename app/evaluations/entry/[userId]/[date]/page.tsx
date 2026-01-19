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
                        // setTeamName(empData.personnelEvaluationTeam?.name || "") // Optional
                    }

                    if (empData && empData.patternId) {
                        const patRes = await fetch(`/api/evaluations/settings/patterns?id=${empData.patternId}`)
                        const patData = await patRes.json()
                        if (patData && patData.items) {
                            setItems(patData.items.map((i: any) => ({
                                id: i.id,
                                itemId: i.id,
                                type: i.type,
                                title: i.title,
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
                {/* Check Goals (Mock presentation for now) */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex justify-around items-center text-center">
                        <div>
                            <div className="text-xs text-slate-500 font-bold mb-1">契約達成率</div>
                            <div className="text-2xl font-bold text-blue-700">--<span className="text-sm">%</span></div>
                            <div className="text-xs text-slate-400">¥0 / ¥0</div>
                        </div>
                        <div className="w-px h-12 bg-blue-200"></div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold mb-1">完工達成率</div>
                            <div className="text-2xl font-bold text-indigo-700">--<span className="text-sm">%</span></div>
                            <div className="text-xs text-slate-400">¥0 / ¥0</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist Items */}
                <div className="space-y-4">
                    {items.length === 0 && <div className="text-center py-8 text-slate-400">評価項目が設定されていません</div>}
                    {items.map((item, index) => (
                        <Card key={item.id} className={cn("border-slate-200 shadow-sm transition-all", item.checked ? "bg-blue-50/30 border-blue-200" : "")}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {(item.type === 'checkbox' || !item.type) && (
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={(c) => toggleCheck(index, !!c)}
                                                disabled={!canEdit}
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
                                        {(item.type === 'text' || item.type === 'description') && (
                                            <Textarea
                                                value={item.value || ''}
                                                onChange={(e) => updateText(index, e.target.value)}
                                                placeholder="入力してください..."
                                                disabled={!canEdit}
                                                className="bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Actions (Hidden if locked to avoid confusion, or strictly control) */}
                {canEdit && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-blue-50 hover:text-blue-600 border-dashed border-slate-300">
                            <Plus className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">項目を追加</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 hover:bg-green-50 hover:text-green-600 border-dashed border-slate-300">
                            <MessageCircle className="w-5 h-5 mb-1" />
                            <span className="text-xs font-bold">自由欄追加</span>
                        </Button>
                        {/* More buttons... */}
                    </div>
                )}

                {/* Thank You Section (Simple impl) */}
                {canEdit && (
                    <Card className="border-pink-200 bg-pink-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                                <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                                ありがとうを送る
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={thankYouMessage}
                                onChange={e => setThankYouMessage(e.target.value)}
                                placeholder="感謝のメッセージを入力..."
                                className="min-h-[80px] bg-white border-pink-200 focus-visible:ring-pink-400"
                            />
                            {/* Detailed recipient selection to be implemented */}
                        </CardContent>
                    </Card>
                )}

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
