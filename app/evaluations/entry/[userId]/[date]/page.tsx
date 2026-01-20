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
    Trash2,
    Send,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EvaluationEntryPage() {
    const params = useParams()
    const router = useRouter()
    const { currentUser } = useAuth()
    const userId = params.userId as string
    const dateStr = params.date as string

    const [isLocked, setIsLocked] = useState(false)
    const [canEdit, setCanEdit] = useState(false)
    const [stats, setStats] = useState<any>(null) // Team Stats
    const [pointStats, setPointStats] = useState({ daily: 0, monthly: 0, yearly: 0 })
    const [personalGoal, setPersonalGoal] = useState<any>({
        contractTarget: 0,
        contractAchieved: 0,
        completionTarget: 0,
        completionAchieved: 0
    })
    const [isNumericGoalEnabled, setIsNumericGoalEnabled] = useState(true)
    const [calendarStats, setCalendarStats] = useState<Record<string, { count: number, hasReceivedThankYou: boolean }>>({})
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

    // Add employees state
    const [employees, setEmployees] = useState<any[]>([])

    const [items, setItems] = useState<any[]>([])
    const [thankYouList, setThankYouList] = useState<{ id: string, to: string[], message: string, recipientType: string }[]>([])
    const [receivedThankYous, setReceivedThankYous] = useState<any[]>([])

    // Draft Thank You State
    const [draftTyMessage, setDraftTyMessage] = useState("")
    const [draftTyRecipient, setDraftTyRecipient] = useState<string>("")
    const [draftTyRecipientType, setDraftTyRecipientType] = useState<string>("") // '' | 'individual' | 'team' | 'all'

    // Formatted Input State helpers
    const [contractFocused, setContractFocused] = useState(false)
    const [completionFocused, setCompletionFocused] = useState(false)

    // Legacy or unused states (kept just in case used elsewhere, but effectively replaced)
    // const [thankYouMessage, setThankYouMessage] = useState("") 
    // const [thankYouRecipientType, setThankYouRecipientType] = useState("")
    // const [thankYouRecipient, setThankYouRecipient] = useState("")
    const [thankYouSelectedTeam, setThankYouSelectedTeam] = useState("")
    const [teamMembers, setTeamMembers] = useState<any[]>([])
    const [allEmployees, setAllEmployees] = useState<any[]>([])
    const [allTeams, setAllTeams] = useState<any[]>([])
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [employeeName, setEmployeeName] = useState("")
    const [teamName, setTeamName] = useState("")
    const [thankYouConfig, setThankYouConfig] = useState({ send: 5, receive: 10 })

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
            setPointStats({ daily: 0, monthly: 0, yearly: 0 }) // Reset point stats

            try {
                // 1. Fetch Submission and Employee Data in parallel
                const [subRes, empRes] = await Promise.all([
                    fetch(`/api/evaluations/submissions?date=${dateStr}&userId=${userId}`, {
                        headers: { 'x-employee-id': currentUser?.id || '' }
                    }),
                    fetch(`/api/evaluations/settings/employees?id=${userId}`) // URLをクエリパラメータ形式に修正
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

                    // Fetch All Employees for Thank You feature
                    fetch(`/api/evaluations/settings/employees`)
                        .then(r => r.json())
                        .then(employees => {
                            if (Array.isArray(employees)) {
                                setEmployees(employees) // Set full list
                                // 自分以外の全員
                                setAllEmployees(employees.filter((e: any) => e.id !== userId))
                                // 同じチームのメンバー
                                const members = employees.filter((e: any) =>
                                    e.teamId === empData.personnelEvaluationTeam?.id && e.id !== userId
                                )
                                setTeamMembers(members)
                            }
                        })
                        .catch(e => console.error("Failed to fetch employees", e))

                    // Fetch Teams
                    fetch(`/api/evaluations/settings/teams`)
                        .then(r => r.json())
                        .then(teams => {
                            if (Array.isArray(teams)) {
                                setAllTeams(teams)
                            }
                        })
                        .catch(e => console.error("Failed to fetch teams", e))

                    // Fetch Thank You Point Config
                    fetch(`/api/evaluations/settings/config`)
                        .then(r => r.json())
                        .then(config => {
                            if (config) {
                                setThankYouConfig({
                                    send: config.thankYouSendPoints ?? 5,
                                    receive: config.thankYouReceivePoints ?? 10
                                })
                            }
                        })
                        .catch(e => console.error("Failed to fetch point config", e))
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
                            mandatory: patternItem?.isMandatory || false // isMandatoryプロパティを使用
                        }
                    }).filter((i: any) => i.type !== 'thank_you')

                    // パターン変更への対応：パターンにあるがSubmissionにない項目を追加（マージ）
                    if (Object.keys(patternItemsMap).length > 0) {
                        const existingItemIds = new Set(loadedItems.map((i: any) => i.itemId).filter(Boolean))

                        const missingPatternItems = Object.values(patternItemsMap)
                            .filter((p: any) => !existingItemIds.has(p.id))
                            .map((p: any) => ({
                                id: p.id,
                                itemId: p.id,
                                type: p.type,
                                title: p.title,
                                description: p.description,
                                points: p.points,
                                checked: false,
                                value: '',
                                mandatory: p.mandatory,
                                photoUrl: null,
                                photoComment: ''
                            }))

                        let mergedItems = [...loadedItems, ...missingPatternItems]

                        // 写真の復元
                        if (subData.submission.photos && subData.submission.photos.length > 0) {
                            let photoIdx = 0
                            mergedItems = mergedItems.map(item => {
                                if (item.type === 'photo' && photoIdx < subData.submission.photos.length) {
                                    const photo = subData.submission.photos[photoIdx++]
                                    return {
                                        ...item,
                                        photoUrl: photo.url,
                                        photoComment: photo.comment || ''
                                    }
                                }
                                return item
                            })
                        }

                        setItems(mergedItems)
                    } else {
                        setItems(loadedItems)
                    }

                    // 4.5 ありがとうの復元
                    const tyItems = subData.submission.items.filter((i: any) => i.title === 'ありがとう送信')
                    const restoredTyList = tyItems.map((item: any) => {
                        let toIds: string[] = []
                        try {
                            toIds = JSON.parse(item.thankYouTo || "[]")
                        } catch (e) {
                            console.error("Failed to parse thankYouTo", e)
                        }
                        return {
                            id: item.id, // submission item id (or temporary)
                            to: toIds,
                            message: item.thankYouMessage || "",
                            recipientType: item.textValue || "individual"
                        }
                    })
                    setThankYouList(restoredTyList)


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
                        mandatory: i.mandatory // APIレスポンス形式
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

                // 6. Set Point Stats
                if (subData.stats) {
                    setPointStats(subData.stats)
                } else {
                    setPointStats({ daily: 0, monthly: 0, yearly: 0 })
                }

                // 7. 受信履歴 (submissionの有無に関わらず常に設定)
                if (subData.receivedThankYous) {
                    setReceivedThankYous(subData.receivedThankYous)
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

    // Calendar Auto-Scroll
    useEffect(() => {
        // 少し遅延させてレンダリング完了を待つ
        const timer = setTimeout(() => {
            const el = document.getElementById(`calendar-row-${dateStr}`)
            if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'center' })
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [dateStr])

    const handleSave = async (tempThankYous?: any[], successMessage: string = '保存しました', skipValidation: boolean = false) => {
        if (!canEdit) return

        // 必須チェック
        const missingMandatory = items.some(i => {
            if (!i.mandatory) return false
            if (i.type === 'checkbox' && !i.checked) return true
            if (i.type === 'text' && !i.value?.trim()) return true
            if (i.type === 'photo' && !i.photoUrl) return true
            return false
        })

        if (missingMandatory && !skipValidation) {
            alert('必須項目が未入力です。\n全ての必須項目（赤色のバッジ）を入力・チェックしてください。')
            return
        }

        try {
            // 写真・テキスト項目の自動チェック判定
            const processedItems = items.map(i => {
                let isChecked = i.checked
                if (i.type === 'text' && i.value?.trim()) isChecked = true
                else if (i.type === 'photo' && i.photoUrl) isChecked = true

                return {
                    itemId: i.itemId,
                    title: i.title,
                    description: i.description,
                    points: i.points,
                    checked: isChecked,
                    textValue: i.value,
                    type: i.type // APIログ用
                }
            })

            const photoPayload = items
                .filter(i => i.type === 'photo' && i.photoUrl)
                .map(i => ({
                    url: i.photoUrl,
                    comment: i.photoComment
                }))

            // ありがとうの宛先を決定 (Refactored to use thankYouList directly)
            // Legacy block removed

            const body = {
                date: dateStr,
                employeeId: userId,
                items: processedItems,
                photos: photoPayload,
                thankYous: tempThankYous || thankYouList,
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
                alert(successMessage)
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

    // ===== Render Functions =====
    // Thank You Section Render Function - Used in both mobile and desktop layouts
    const renderThankYouSection = () => (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-pink-600 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-pink-500" />
                ありがとうを送る
                <span className="text-[10px] text-pink-400 font-normal ml-2">（送信: +{thankYouConfig.send.toLocaleString()}pt / 受信: +{thankYouConfig.receive.toLocaleString()}pt）</span>
            </h2>
            {/* Draft Form */}
            <div className="bg-pink-50 rounded-lg p-4 space-y-3">
                <div className="space-y-4">
                    {/* 1. Recipient Selection */}
                    <div>
                        <Label className="text-xs text-slate-500 mb-1.5 block">誰に送りますか？</Label>
                        <Tabs value={draftTyRecipientType || 'individual'} onValueChange={setDraftTyRecipientType} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-2 h-8">
                                <TabsTrigger value="individual" className="text-xs">個人</TabsTrigger>
                                <TabsTrigger value="team" className="text-xs">チーム</TabsTrigger>
                                <TabsTrigger value="all" className="text-xs">全員</TabsTrigger>
                            </TabsList>

                            <TabsContent value="individual" className="mt-0">
                                <Select value={draftTyRecipient} onValueChange={setDraftTyRecipient}>
                                    <SelectTrigger className="bg-white h-9">
                                        <SelectValue placeholder="社員を選択..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees && employees.filter((e: any) => e.id !== userId).map((emp: any) => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TabsContent>

                            <TabsContent value="team" className="mt-0">
                                <Select value={draftTyRecipient} onValueChange={setDraftTyRecipient}>
                                    <SelectTrigger className="bg-white h-9">
                                        <SelectValue placeholder="チームを選択..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allTeams && allTeams.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TabsContent>

                            <TabsContent value="all" className="mt-0">
                                <div className="text-xs text-slate-500 bg-white p-2.5 rounded border border-slate-200">
                                    全社員に感謝を伝えます（{employees ? employees.length - 1 : 0}名）
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* 2. Message Input */}
                    <div>
                        <Label className="text-xs text-slate-500 mb-1.5 block">メッセージ</Label>
                        <Textarea
                            value={draftTyMessage}
                            onChange={e => setDraftTyMessage(e.target.value)}
                            placeholder="ありがとうの気持ちを伝えましょう"
                            className="bg-white min-h-[80px] resize-none text-sm"
                        />
                    </div>

                    {/* 3. Send Button */}
                    <div className="flex justify-end items-center gap-2">
                        <Button
                            onClick={() => {
                                if (!draftTyMessage.trim()) return;

                                let toIds: string[] = []
                                let type = draftTyRecipientType || 'individual'

                                if (type === 'all') {
                                    toIds = employees.filter((e: any) => e.id !== userId).map((e: any) => e.id)
                                } else if (type === 'team') {
                                    const teamEmpIds = employees.filter((e: any) => e.teamId === draftTyRecipient && e.id !== userId).map((e: any) => e.id)
                                    if (teamEmpIds.length === 0) return;
                                    toIds = teamEmpIds
                                } else {
                                    if (!draftTyRecipient) return;
                                    toIds = [draftTyRecipient]
                                }

                                const newItem = {
                                    id: crypto.randomUUID(),
                                    to: toIds,
                                    message: draftTyMessage,
                                    recipientType: type
                                }
                                const newList = [...thankYouList, newItem]

                                setThankYouList(newList)
                                handleSave(newList, '送信しました', true)

                                // Reset draft
                                setDraftTyMessage("")
                                setDraftTyRecipient("")
                                setDraftTyRecipientType("individual")
                            }}
                            className="bg-pink-500 hover:bg-pink-600 text-white gap-2"
                            disabled={!canEdit || !draftTyMessage.trim() || (draftTyRecipientType !== 'all' && (draftTyRecipientType === 'individual' || draftTyRecipientType === 'team') && !draftTyRecipient)}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                            送信する
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sent List */}
            {thankYouList.length > 0 && (
                <div className="space-y-2 mt-4">
                    <h3 className="text-xs font-bold text-slate-600">送信リスト</h3>
                    {thankYouList.map((item, idx) => (
                        <div key={item.id || idx} className="bg-white border rounded-md p-3 flex justify-between items-start group shadow-sm">
                            <div className="space-y-1 w-full">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">
                                        {item.recipientType === 'all' ? '全員' : item.recipientType === 'team' ? 'チーム' : '個人'}
                                    </span>
                                    <div className="text-xs text-slate-500 flex-1 min-w-0">
                                        {(() => {
                                            if (item.recipientType === 'individual') {
                                                return <span>{(employees && employees.find((e: any) => e.id === item.to[0])?.name || '不明')} へ</span>
                                            } else if (item.recipientType === 'team') {
                                                const firstEmp = employees ? employees.find((e: any) => e.id === item.to[0]) : null
                                                const teamName = (allTeams && firstEmp) ? allTeams.find((t: any) => t.id === firstEmp.teamId)?.name : ''
                                                const names = item.to.map((id: string) => employees?.find((e: any) => e.id === id)?.name).filter(Boolean).join('、')

                                                return (
                                                    <span className="inline-block">
                                                        <span className="font-bold text-slate-700 mr-1">{teamName || 'チーム'}</span>
                                                        <span className="mr-1">({item.to.length}名):</span>
                                                        <span className="text-slate-600 leading-tight">{names}</span>
                                                    </span>
                                                )
                                            } else {
                                                return <span>全社員 ({item.to.length}名) へ</span>
                                            }
                                        })()}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-1">{item.message}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-500 h-6 w-6 p-0"
                                onClick={() => {
                                    const newList = [...thankYouList]
                                    newList.splice(idx, 1)
                                    setThankYouList(newList)
                                    handleSave(newList, '削除しました', true)
                                }}
                                disabled={!canEdit}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Received History */}
            {receivedThankYous.length > 0 && (
                <div className="space-y-2 mt-6 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                        <Heart className="w-3 h-3 text-pink-400" />
                        今日届いたありがとう
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{receivedThankYous.length}</Badge>
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {receivedThankYous.map((item: any) => (
                            <div key={item.id} className="bg-white/80 border border-pink-100 rounded-md p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {item.submission?.employee?.avatarUrl || item.submission?.employee?.avatar ? (
                                            <img src={item.submission.employee.avatarUrl || item.submission.employee.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-500">{item.submission?.employee?.name?.[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{item.submission?.employee?.name || '不明'}</span>
                                    <span className="text-[10px] text-slate-400 ml-auto">{item.submission?.date ? new Date(item.submission.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                                <p className="text-sm text-slate-600 pl-7">{item.thankYouMessage}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        {(currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager') && (
                            <Link href="/evaluations" className="shrink-0">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                                </Button>
                            </Link>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
                                <span>{format(parseISO(dateStr), 'M月d日(E)', { locale: ja })} の考課入力</span>
                                {/* Desktop Badge */}
                                <span className="hidden md:inline-flex">
                                    {isLocked && !canEdit && <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Lock className="w-3 h-3" /> 編集不可</Badge>}
                                    {isLocked && canEdit && <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">ロック(修正は管理者へ)</Badge>}
                                </span>
                            </h1>
                            <p className="text-[10px] md:text-xs text-slate-500 truncate">{employeeName} {teamName && `(${teamName})`}</p>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Mobile Lock Icon Badge */}
                        {isLocked && !canEdit && <Badge variant="secondary" className="md:hidden px-2 py-1 bg-amber-100 text-amber-800"><Lock className="w-3 h-3" /></Badge>}
                        {isLocked && canEdit && (
                            <Badge
                                variant="outline"
                                className="md:hidden px-2 py-1 border-amber-600 text-amber-600 flex items-center justify-center cursor-help"
                                title="修正は管理者へ"
                            >
                                <Lock className="w-3.5 h-3.5" />
                            </Badge>
                        )}

                        {canEdit && (
                            <Button onClick={() => handleSave()} className="bg-blue-600 hover:bg-blue-700 shadow-sm h-8 px-3 text-xs md:h-9 md:px-4 md:text-sm">
                                <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                保存
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

                    {/* Left Column: Calendar */}
                    <aside className="space-y-4 w-full">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sticky top-4">
                            {/* Date Selector */}
                            <div className="flex items-center justify-between gap-2 mb-3 lg:mb-4 p-1">
                                <div className="flex items-center gap-1">
                                    <Select value={format(currentCalendarDate, 'yyyy')} onValueChange={(v) => {
                                        const newDate = new Date(currentCalendarDate)
                                        newDate.setFullYear(parseInt(v))
                                        setCurrentCalendarDate(newDate)
                                    }}>
                                        <SelectTrigger className="w-[64px] h-8 text-xs border-slate-200 px-1 bg-white">
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
                                        <SelectTrigger className="w-[44px] h-8 text-xs border-slate-200 px-1 bg-white">
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

                                <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                                    <Button variant="ghost" size="sm" className="h-7 w-8 px-0 hover:bg-white text-slate-600" onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-bold hover:bg-white text-slate-700 mx-0.5" onClick={() => setCurrentCalendarDate(new Date())}>
                                        今月
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-8 px-0 hover:bg-white text-slate-600 disabled:opacity-30"
                                        onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                                        disabled={(() => {
                                            const nextMonth = startOfMonth(addMonths(currentCalendarDate, 1))
                                            const currentRealMonth = startOfMonth(new Date())
                                            return nextMonth > currentRealMonth
                                        })()}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-3">
                                {/* Point Stats */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col gap-2 min-w-[120px] lg:w-full">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold">当日獲得pt</span>
                                        <span className="font-mono font-bold text-slate-700">{parseFloat(pointStats.daily.toString()).toLocaleString()}pt</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold">今月獲得pt</span>
                                        <span className="font-mono font-bold text-blue-600">{parseFloat(pointStats.monthly.toString()).toLocaleString()}pt</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                                        <span className="text-slate-500 font-bold">今年度獲得pt</span>
                                        <span className="font-mono font-bold text-indigo-600">{parseFloat(pointStats.yearly.toString()).toLocaleString()}pt</span>
                                    </div>
                                </div>

                                {/* Calendar Table */}
                                <div className="border rounded-lg overflow-hidden flex flex-col lg:max-h-[calc(100vh-400px)] max-h-[220px] flex-1">
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
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);

                                                    const year = currentCalendarDate.getFullYear()
                                                    const month = currentCalendarDate.getMonth()
                                                    const daysInMonth = new Date(year, month + 1, 0).getDate()

                                                    return [...Array(daysInMonth)].map((_, i) => {
                                                        const day = i + 1
                                                        const date = new Date(year, month, day)
                                                        // 未来の日付は表示しない
                                                        if (date > today) return null;

                                                        const dStr = format(date, 'yyyy-MM-dd')
                                                        const dayOfWeek = date.getDay()
                                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                                                        const isSelected = dStr === dateStr
                                                        const isSubmitted = (calendarStats[dStr]?.count || 0) > 0
                                                        const hasReceived = calendarStats[dStr]?.hasReceivedThankYou

                                                        return (
                                                            <tr
                                                                key={day}
                                                                id={`calendar-row-${dStr}`} // 自動スクロール用ID
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
                                                                <td className="px-2 py-2.5 text-center relative">
                                                                    {isSubmitted ? (
                                                                        <CheckCircle2 className={cn("w-4 h-4 mx-auto", isSelected ? "text-white" : "text-emerald-500")} />
                                                                    ) : (
                                                                        <span className={cn(isSelected ? "text-blue-200" : "text-slate-300")}>-</span>
                                                                    )}
                                                                    {hasReceived && (
                                                                        <Heart className={cn("w-3 h-3 absolute top-1 right-1", isSelected ? "text-pink-200 fill-pink-200" : "text-pink-500 fill-pink-500")} />
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
                        </div>
                        {/* Thank You Section - Desktop Only (in left column) */}
                        <div className="hidden lg:block mt-4 pt-4 border-t border-slate-200">
                            {renderThankYouSection()}
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
                                        <div className="text-lg font-bold">¥{(stats.contract?.achieved || 0).toLocaleString()}<span className="text-[10px] text-slate-400 ml-1">(千円)</span></div>
                                        <div className="text-lg font-bold">¥{(stats.contract?.target || 0).toLocaleString()}<span className="text-[10px] text-slate-400 ml-1">(千円)</span></div>
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
                                        <div className="text-lg font-bold">¥{(stats.completion?.achieved || 0).toLocaleString()}<span className="text-[10px] text-slate-400 ml-1">(千円)</span></div>
                                        <div className="text-lg font-bold">¥{(stats.completion?.target || 0).toLocaleString()}<span className="text-[10px] text-slate-400 ml-1">(千円)</span></div>
                                        <div className="text-xl font-black text-yellow-400">{stats.completion?.rate}%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personal Goals Input Section - Conditional Rendering */}
                        {isNumericGoalEnabled && (
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-700 text-sm">
                                        <span className="md:hidden">個人目標/<br />実績管理</span>
                                        <span className="hidden md:inline">個人目標・実績管理</span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isGoalLocked && <Badge variant="secondary" className="bg-slate-200 text-slate-500 text-[10px] hidden md:inline-flex">編集期間終了</Badge>}
                                        <div className="text-right md:text-left">
                                            <span className="text-lg font-bold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm inline-block">
                                                {/* Mobile: Single line, 90% size */}
                                                <span className="md:hidden text-[90%] whitespace-nowrap">
                                                    {format(parseISO(dateStr), 'yyyy年M月d日現在', { locale: ja })}
                                                </span>
                                                {/* Desktop */}
                                                <span className="hidden md:inline">
                                                    {format(parseISO(dateStr), 'yyyy-MM-dd')} 現在
                                                </span>
                                            </span>
                                        </div>
                                        <Button size="sm" onClick={() => handleSave()} disabled={!canEdit && !isAdminOrHr} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs whitespace-nowrap">
                                            <Save className="w-3 h-3 mr-1" />
                                            <span className="hidden md:inline">実績を保存</span>
                                            <span className="md:hidden">保存</span>
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
                                                    <span className="font-bold text-slate-600">¥{(personalGoal.contractTarget || 0).toLocaleString()}<span className="text-[10px] ml-1">(千円)</span></span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                                <Input
                                                    type={contractFocused ? "number" : "text"}
                                                    value={contractFocused ? personalGoal.contractAchieved : (personalGoal.contractAchieved ? Number(personalGoal.contractAchieved).toLocaleString() : '')}
                                                    onChange={(e) => !isGoalLocked && setPersonalGoal({ ...personalGoal, contractAchieved: (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                                                    onFocus={() => setContractFocused(true)}
                                                    onBlur={() => setContractFocused(false)}
                                                    className="pl-8 font-bold text-xl h-14 border-slate-300 focus-visible:ring-blue-500 shadow-sm pr-12"
                                                    placeholder="0"
                                                    disabled={isGoalLocked && !isAdminOrHr}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">(千円)</span>
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
                                                    <span className="font-bold text-slate-600">¥{(personalGoal.completionTarget || 0).toLocaleString()}<span className="text-[10px] ml-1">(千円)</span></span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                                                <Input
                                                    type={completionFocused ? "number" : "text"}
                                                    value={completionFocused ? personalGoal.completionAchieved : (personalGoal.completionAchieved ? Number(personalGoal.completionAchieved).toLocaleString() : '')}
                                                    onChange={(e) => !isGoalLocked && setPersonalGoal({ ...personalGoal, completionAchieved: (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                                                    onFocus={() => setCompletionFocused(true)}
                                                    onBlur={() => setCompletionFocused(false)}
                                                    className="pl-8 font-bold text-xl h-14 border-slate-300 focus-visible:ring-blue-500 shadow-sm pr-12"
                                                    placeholder="0"
                                                    disabled={isGoalLocked && !isAdminOrHr}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">(千円)</span>
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
                                                            disabled={item.type === 'description' || !canEdit} // Explicitly allow 'text' type if canEdit is true
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
                                                {item.points > 0 && <span className="text-[10px] font-bold text-slate-400 font-mono">+{parseFloat(item.points.toString()).toLocaleString()}</span>}
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
                                        <Card
                                            key={item.id}
                                            className="border-dashed border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors overflow-hidden"
                                            onDragOver={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (!canEdit) return

                                                const file = e.dataTransfer.files?.[0]
                                                if (file && file.type.startsWith('image/')) {
                                                    const reader = new FileReader()
                                                    reader.onload = (ev) => {
                                                        const newItems = [...items]
                                                        newItems[photoIndex] = { ...item, photoUrl: ev.target?.result as string }
                                                        setItems(newItems)
                                                    }
                                                    reader.readAsDataURL(file)
                                                }
                                            }}
                                        >
                                            <CardContent className="p-4 flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px] relative group">
                                                {/* Mandatory Badge */}
                                                {item.mandatory && (
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 bg-red-50 px-1 py-0 h-4 leading-none flex items-center">必須</Badge>
                                                    </div>
                                                )}

                                                {item.photoUrl ? (
                                                    <div className="w-full space-y-2">
                                                        <div className="relative">
                                                            <img src={item.photoUrl} alt={item.title} className="w-full h-32 object-cover rounded shadow-sm" />
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="absolute top-2 right-2 h-6 px-2 text-xs opacity-80 hover:opacity-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const newItems = [...items]
                                                                    newItems[photoIndex] = { ...item, photoUrl: null, photoComment: '' } // Clear url and comment
                                                                    setItems(newItems)
                                                                }}
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1" /> 削除
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            value={item.photoComment || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items]
                                                                newItems[photoIndex] = { ...item, photoComment: e.target.value }
                                                                setItems(newItems)
                                                            }}
                                                            placeholder="コメントを入力..."
                                                            className="text-xs h-8 bg-white"
                                                            disabled={!canEdit}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-4">
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
                                                        <Camera className="w-8 h-8 opacity-50 mb-2" />
                                                        <span className="text-xs font-bold text-slate-600">{item.title}</span>
                                                        <span className="text-[10px] text-slate-400 mt-1">タップして撮影・ドロップ</span>
                                                        {item.points > 0 && <span className="text-[10px] text-blue-500 font-bold mt-1">+{item.points}pt</span>}
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

                        {/* Thank You Section - Mobile Only (in right column) */}
                        <div className="lg:hidden pt-4 border-t border-slate-200">
                            {renderThankYouSection()}
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
