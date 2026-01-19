"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
    Lock,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { format, parseISO, endOfMonth, addMonths, startOfMonth, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function EvaluationEntryPage() {
    const params = useParams()
    const router = useRouter()
    const { currentUser } = useAuth()
    const userId = params.userId as string
    const dateStr = params.date as string

    const [isLocked, setIsLocked] = useState(false)
    const [canEdit, setCanEdit] = useState(false)
    const [stats, setStats] = useState<any>(null) // Team Stats
    const [personalGoal, setPersonalGoal] = useState<any>({
        contractTarget: 0,
        contractAchieved: 0,
        completionTarget: 0,
        completionAchieved: 0
    })
    const [isNumericGoalEnabled, setIsNumericGoalEnabled] = useState(true)
    const [calendarStats, setCalendarStats] = useState<Record<string, number>>({})
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

    const [items, setItems] = useState<any[]>([])
    const [thankYous, setThankYous] = useState<any[]>([])
    const [thankYouMessage, setThankYouMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [employeeName, setEmployeeName] = useState("")
    const [teamName, setTeamName] = useState("")

    const isAdminOrHrOrManager = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager'
    const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'

    // Goal Editing Lock Logic
    const isGoalLocked = (() => {
        if (isAdminOrHr) return false

        const targetDate = new Date(dateStr)
        const nextMonthEnd = endOfMonth(addMonths(targetDate, 1))
        const now = new Date()

        return now > nextMonthEnd
    })()

    useEffect(() => {
        // Set initial calendar date to the entry date
        if (dateStr) {
            setCurrentCalendarDate(new Date(dateStr))
        }
    }, [dateStr])

    // Load Calendar Stats whenever currentCalendarDate or userId changes
    useEffect(() => {
        if (!userId) return
        const dateString = format(currentCalendarDate, 'yyyy-MM-dd')
        fetch(`/api/evaluations/dashboard?date=${dateString}&employeeId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.calendar) {
                    setCalendarStats(data.calendar)
                }
            })
            .catch(e => console.error("Failed to load calendar stats", e))
    }, [currentCalendarDate, userId])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            // ステートをリセットして古いデータを表示しないように
            setItems([])
            setStats(null)
            setPersonalGoal({ contractTarget: 0, contractAchieved: 0, completionTarget: 0, completionAchieved: 0 })

            try {
                // 1. Fetch Submission and Employee Data in parallel
                const [subRes, empRes] = await Promise.all([
                    fetch(`/api/evaluations/submissions?date=${dateStr}&userId=${userId}`, {
                        headers: { 'x-employee-id': currentUser?.id || '' }
                    }),
                    fetch(`/api/evaluations/settings/employees/${userId}`)
                ])

                const subData = await subRes.json()
                const empData = await empRes.json()

                // 2. Set Employee Info & Stats (Always run)
                if (empData && empData.name) {
                    setEmployeeName(empData.name)
                    setTeamName(empData.personnelEvaluationTeam?.name || "")

                    // Set Numeric Goal Flag
                    if (empData.isNumericGoalEnabled !== undefined) {
                        setIsNumericGoalEnabled(empData.isNumericGoalEnabled)
                    }

                    // Fetch Team Stats
                    if (empData.personnelEvaluationTeamId) {
                        fetch(`/api/evaluations/dashboard?date=${dateStr}&teamId=${empData.personnelEvaluationTeamId}`)
                            .then(r => r.json())
                            .then(d => {
                                if (d.stats) setStats(d.stats.currentMonth)
                            })
                    }
                }

                // ... (rest of loading logic same as before but respecting isNumericGoalEnabled implicitly via UI check)

                // 3. Set Personal Goals
                if (subData.goal) {
                    setPersonalGoal({
                        contractTarget: Number(subData.goal.contractTargetAmount),
                        contractAchieved: Number(subData.goal.contractAchievedAmount),
                        completionTarget: Number(subData.goal.completionTargetAmount),
                        completionAchieved: Number(subData.goal.completionAchievedAmount)
                    })
                } else if (empData) {
                    // Fallback to employee settings
                    const currentPeriod = dateStr.slice(0, 7)
                    const pGoals = empData.personnelEvaluationGoals?.find((g: any) => g.period === currentPeriod)

                    if (pGoals) {
                        setPersonalGoal({
                            contractTarget: Number(pGoals.contractTargetAmount),
                            contractAchieved: Number(pGoals.contractAchievedAmount),
                            completionTarget: Number(pGoals.completionTargetAmount),
                            completionAchieved: Number(pGoals.completionAchievedAmount)
                        })
                    } else {
                        // Default goals from employee master
                        setPersonalGoal({
                            contractTarget: Number(empData.contractGoal) || 0,
                            contractAchieved: 0,
                            completionTarget: Number(empData.completionGoal) || 0,
                            completionAchieved: 0
                        })
                    }
                }

                // 4. Set Items (Submission or Pattern)
                // まずパターンを取得して正しいtype情報を得る
                const patternId = empData?.personnelEvaluationPatternId || empData?.personnelEvaluationPattern?.id
                let patternItemsMap: Record<string, any> = {}

                if (patternId) {
                    try {
                        const patRes = await fetch(`/api/evaluations/settings/patterns?id=${patternId}`)
                        const patData = await patRes.json()
                        if (patData && patData.items) {
                            patData.items.forEach((item: any) => {
                                patternItemsMap[item.id] = item
                            })
                        }
                    } catch (e) {
                        console.error("Failed to fetch pattern for type reference", e)
                    }
                }

                if (subData.submission) {
                    // Load from saved submission
                    const loadedItems = subData.submission.items.map((i: any) => {
                        // パターンから正しいtypeを取得（最も信頼性が高い）
                        let patternItem = patternItemsMap[i.itemId]

                        // itemIdでマッチしない場合、titleで検索（古いデータ対応）
                        if (!patternItem && i.title) {
                            patternItem = Object.values(patternItemsMap).find((p: any) => p.title === i.title)
                        }

                        let type = patternItem?.type || 'checkbox'

                        // パターンにない場合はフラグやヒューリスティクスで判定
                        if (!patternItem) {
                            if (i.isDescription) type = 'description'
                            else if (i.isFreeText) type = 'text'
                            else if (i.title === 'ありがとう送信') type = 'thank_you'
                            else if (i.title.includes('写真') || i.title === '写真') type = 'photo'
                            else if (i.title.includes('振り返り')) type = 'text'
                            // タイトルに「チェック」を含む項目は説明項目の可能性
                            else if (i.title.includes('チェック') && !i.points) type = 'description'
                        }

                        return {
                            ...i,
                            id: i.itemId || i.id,
                            itemId: i.itemId || patternItem?.id, // パターンから補完
                            type,
                            checked: i.isChecked,
                            value: i.textValue || '',
                            mandatory: patternItem?.isMandatory || false
                        }
                    }).filter((i: any) => i.type !== 'thank_you')
                    setItems(loadedItems)

                } else if (patternId && Object.keys(patternItemsMap).length > 0) {
                    // Load from Pattern (既に取得済み)
                    const patternItems = Object.values(patternItemsMap).map((i: any) => ({
                        id: i.id,
                        itemId: i.id,
                        type: i.type,
                        title: i.title,
                        description: i.description,
                        points: i.points,
                        checked: false,
                        value: '',
                        mandatory: i.isMandatory
                    }))
                    setItems(patternItems)
                } else {
                    setItems([])
                }

                // 5. Lock Logic
                setIsLocked(subData.isLocked)
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
                thankYous: thankYouMessage ? [{ to: [], message: thankYouMessage }] : [],
                goals: {
                    contractAchieved: personalGoal.contractAchieved,
                    completionAchieved: personalGoal.completionAchieved
                }
            }

            const res = await fetch('/api/evaluations/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-employee-id': currentUser?.id || ''
                },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                alert('保存しました')
                // カレンダーの統計を再取得してチェックマークを更新
                const dateString = format(currentCalendarDate, 'yyyy-MM-dd')
                fetch(`/api/evaluations/dashboard?date=${dateString}&employeeId=${userId}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.calendar) {
                            setCalendarStats(data.calendar)
                        }
                    })
                    .catch(e => console.error("Failed to refresh calendar stats", e))
            } else {
                const err = await res.json()
                alert(`エラー: ${err.error}\n詳細: ${err.details || ''}`)
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
                    <Link href="/evaluations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                    </Link>
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

            <main className="flex-1 container mx-auto p-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                    {/* Left Column: Calendar */}
                    <aside className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-4 sticky top-4">
                            <div className="flex flex-col gap-3">
                                <div className="text-slate-500 text-xs font-bold pl-1">
                                    表示年月:
                                </div>
                                <div className="flex items-center gap-1">
                                    <Select value={format(currentCalendarDate, 'yyyy')} onValueChange={(v) => {
                                        const newDate = new Date(currentCalendarDate)
                                        newDate.setFullYear(parseInt(v))
                                        setCurrentCalendarDate(newDate)
                                    }}>
                                        <SelectTrigger className="w-[70px] h-8 text-xs border-slate-200 px-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2026">2026</SelectItem>
                                            <SelectItem value="2025">2025</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-slate-500 font-bold whitespace-nowrap">年</span>
                                    <Select value={format(currentCalendarDate, 'M')} onValueChange={(v) => {
                                        const newDate = new Date(currentCalendarDate)
                                        newDate.setMonth(parseInt(v) - 1)
                                        setCurrentCalendarDate(newDate)
                                    }}>
                                        <SelectTrigger className="w-[50px] h-8 text-xs border-slate-200 px-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-slate-500 font-bold whitespace-nowrap">月</span>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                    <Button variant="outline" size="sm" className="h-7 w-8 px-0" onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}>
                                        <ChevronLeft className="w-3 h-3" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => setCurrentCalendarDate(new Date())}>
                                        今月
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 w-8 px-0" onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}>
                                        <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-400px)]">
                                <table className="w-full text-xs text-left border-collapse sticky top-0 z-10">
                                    <thead className="bg-[#1e293b] text-white">
                                        <tr>
                                            <th className="px-2 py-2 border-r border-slate-700 w-14 text-center whitespace-nowrap">{format(currentCalendarDate, 'M月')}</th>
                                            <th className="px-2 py-2 text-center whitespace-nowrap">状態</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <tbody className="divide-y divide-slate-200">
                                            {(() => {
                                                const year = currentCalendarDate.getFullYear()
                                                const month = currentCalendarDate.getMonth()
                                                const daysInMonth = new Date(year, month + 1, 0).getDate()

                                                return [...Array(daysInMonth)].map((_, i) => {
                                                    const day = i + 1
                                                    const date = new Date(year, month, day)
                                                    const dStr = format(date, 'yyyy-MM-dd')
                                                    const dayOfWeek = date.getDay()
                                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                                    const isSelected = dStr === dateStr
                                                    const isSubmitted = (calendarStats[dStr] || 0) > 0

                                                    return (
                                                        <tr
                                                            key={day}
                                                            onClick={isSelected ? undefined : () => {
                                                                // フルページリロードでデータを確実に再取得
                                                                window.location.href = `/evaluations/entry/${userId}/${dStr}`
                                                            }}
                                                            className={cn(
                                                                "cursor-pointer transition-colors",
                                                                isSelected ? "bg-blue-600 text-white hover:bg-blue-600" : "hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <td className={cn(
                                                                "px-2 py-2.5 text-center font-bold border-r w-14 whitespace-nowrap",
                                                                !isSelected && isWeekend ? "bg-slate-50 text-slate-500" : "",
                                                                isSelected ? "border-blue-500" : "border-slate-100"
                                                            )}>
                                                                {day}({['日', '月', '火', '水', '木', '金', '土'][dayOfWeek]})
                                                            </td>
                                                            <td className="px-2 py-2.5 text-center">
                                                                {isSubmitted ? (
                                                                    <CheckCircle2 className={cn("w-4 h-4 mx-auto", isSelected ? "text-white" : "text-emerald-500")} />
                                                                ) : (
                                                                    <span className={cn(isSelected ? "text-blue-200" : "text-slate-300")}>-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Column: Main Content */}
                    <div className="space-y-6">
                        {/* Stats Header (Reference Image 2 Style) */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                {/* Contract Stats */}
                                <div className="bg-slate-900 text-white p-4">
                                    <div className="flex items-center justify-center gap-2 font-bold mb-4 text-base bg-slate-800 py-1 rounded">
                                        {format(parseISO(dateStr), 'yyyy年M月', { locale: ja })}
                                        <Badge variant="secondary" className="text-[10px] bg-indigo-500 text-white border-indigo-400">チーム全体</Badge>
                                    </div>
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
                                        2025年11月
                                        <Badge variant="secondary" className="text-[10px] bg-slate-600 text-slate-200">確定: 2ヶ月前</Badge>
                                        <Badge variant="secondary" className="text-[10px] bg-indigo-500 text-white border-indigo-400">チーム全体</Badge>
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

                        {/* Personal Goals Input Section - Conditional Rendering */}
                        {isNumericGoalEnabled && (
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-700 text-sm">個人目標・実績管理</h3>
                                    <div className="flex items-center gap-2">
                                        {isGoalLocked && <Badge variant="secondary" className="bg-slate-200 text-slate-500 text-[10px]">編集期間終了</Badge>}
                                        <span className="text-lg font-bold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                                            {format(parseISO(dateStr), 'yyyy-MM-dd')} 現在
                                        </span>
                                        <Button size="sm" onClick={handleSave} disabled={!canEdit && !isAdminOrHr} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                                            <Save className="w-3 h-3 mr-1" />
                                            実績を保存
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-4 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Contract Goal */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-slate-700 font-bold flex flex-col">
                                                    <span className="text-base">契約実績金額</span>
                                                    <span className="text-[10px] text-slate-400 font-normal">リアルタイムで記入</span>
                                                </Label>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 block">目標設定額</span>
                                                    <span className="font-bold text-slate-600">¥{personalGoal.contractTarget.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                                <Input
                                                    type="number"
                                                    value={personalGoal.contractAchieved || ''}
                                                    onChange={(e) => !isGoalLocked && setPersonalGoal({ ...personalGoal, contractAchieved: e.target.value })}
                                                    className="pl-8 font-bold text-xl h-14 border-slate-300 focus-visible:ring-blue-500 shadow-sm"
                                                    placeholder="0"
                                                    disabled={isGoalLocked && !isAdminOrHr}
                                                />
                                            </div>
                                            <div className="flex justify-end text-xs font-medium">
                                                達成率: <span className={cn("font-bold ml-1 text-base", (personalGoal.contractAchieved / personalGoal.contractTarget) >= 1 ? "text-blue-600" : "text-slate-600")}>
                                                    {personalGoal.contractTarget > 0 ? ((Number(personalGoal.contractAchieved) / personalGoal.contractTarget) * 100).toFixed(1) : '0.0'}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Completion Goal */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-slate-700 font-bold text-base">完工実績金額</Label>
                                                    <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 border-slate-200">確定 2ヶ月前</Badge>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 block">目標設定額</span>
                                                    <span className="font-bold text-slate-600">¥{personalGoal.completionTarget.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                                <Input
                                                    type="number"
                                                    value={personalGoal.completionAchieved || ''}
                                                    onChange={(e) => !isGoalLocked && setPersonalGoal({ ...personalGoal, completionAchieved: e.target.value })}
                                                    className="pl-8 font-bold text-xl h-14 border-slate-300 focus-visible:ring-blue-500 shadow-sm"
                                                    placeholder="0"
                                                    disabled={isGoalLocked && !isAdminOrHr}
                                                />
                                            </div>
                                            <div className="flex justify-end text-xs font-medium">
                                                達成率: <span className={cn("font-bold ml-1 text-base", (personalGoal.completionAchieved / personalGoal.completionTarget) >= 1 ? "text-blue-600" : "text-slate-600")}>
                                                    {personalGoal.completionTarget > 0 ? ((Number(personalGoal.completionAchieved) / personalGoal.completionTarget) * 100).toFixed(1) : '0.0'}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Check Items */}
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
                                            item.type === 'description' ? "bg-slate-700 py-2 rounded-md my-1 pointer-events-none" : (item.checked ? "bg-blue-50/20 py-3" : "hover:bg-slate-50/50 py-3")
                                        )}>
                                            {/* Checkbox / Icon */}
                                            <div className="w-8 mr-3 flex justify-center pt-0.5">
                                                {item.type === 'description' ? (
                                                    <AlertCircle className="w-4 h-4 text-slate-300 mt-0.5" />
                                                ) : (item.type === 'checkbox' || !item.type) ? (
                                                    <Checkbox
                                                        checked={item.checked}
                                                        onCheckedChange={(c) => toggleCheck(index, !!c)}
                                                        disabled={!canEdit}
                                                        className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 w-5 h-5 rounded-md"
                                                    />
                                                ) : item.type === 'text' ? (
                                                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <div
                                                    className={cn(
                                                        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
                                                        item.type === 'description' ? "" : ((item.type === 'checkbox' || !item.type) && canEdit && "cursor-pointer")
                                                    )}
                                                    onClick={() => item.type !== 'description' && (item.type === 'checkbox' || !item.type) && canEdit && toggleCheck(index, !item.checked)}
                                                >
                                                    <Label className={cn(
                                                        "text-sm font-medium leading-snug break-words",
                                                        item.type === 'description' ? "text-white" : (item.checked ? "text-slate-400" : "text-slate-700"),
                                                        item.type !== 'description' && "cursor-pointer"
                                                    )}>
                                                        {item.title}
                                                    </Label>
                                                    {item.description && item.type !== 'description' && (
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
                                                            className={cn(
                                                                "text-xs min-h-[60px] resize-y w-full leading-relaxed",
                                                                item.type === 'description' ? "bg-transparent border-none px-0 py-0 shadow-none text-slate-300 resize-none h-auto min-h-0 pointer-events-none" : "bg-white border-slate-200 focus-visible:ring-blue-400"
                                                            )}
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
                                {items.filter(i => i.type === 'photo').map((item, idx) => {
                                    const photoIndex = items.findIndex(it => it.id === item.id)
                                    return (
                                        <Card key={item.id} className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors overflow-hidden">
                                            <CardContent className="p-4 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px] relative">
                                                {item.photoUrl ? (
                                                    <>
                                                        <img src={item.photoUrl} alt={item.title} className="w-full h-24 object-cover rounded" />
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="absolute top-2 right-2 h-6 px-2 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const newItems = [...items]
                                                                newItems[photoIndex] = { ...item, photoUrl: null }
                                                                setItems(newItems)
                                                            }}
                                                        >
                                                            削除
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="hidden"
                                                            disabled={!canEdit}
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0]
                                                                if (!file) return
                                                                // Convert to base64
                                                                const reader = new FileReader()
                                                                reader.onload = (ev) => {
                                                                    const newItems = [...items]
                                                                    newItems[photoIndex] = { ...item, photoUrl: ev.target?.result as string }
                                                                    setItems(newItems)
                                                                }
                                                                reader.readAsDataURL(file)
                                                            }}
                                                        />
                                                        <Camera className="w-8 h-8 opacity-50" />
                                                        <span className="text-xs font-bold mt-2">{item.title}</span>
                                                        <span className="text-[10px] text-slate-400 mt-1">タップして撮影</span>
                                                    </label>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
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

                    </div>
                </div>
            </main>
        </div>
    )
}
