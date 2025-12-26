'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sparkles,
    Camera,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Mail,
    ChevronRight,
    Menu,
    Plus,
    Settings,
    MessageSquare,
    ChevronDown,
    ChevronLeft,
    Bot,
    Calendar as CalendarIcon,
    Filter,
    Search,
    History,
    Clock,
    FileSearch,
    Pencil,
    Trash2,
    Image as ImageIcon
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getWorkers, getTeams } from '@/lib/workclock/api-storage'
import { Worker } from '@/lib/workclock/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Toaster, toast } from 'sonner'
import { AIAskButton } from '@/components/ai-ask-button'
import { format, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'

// AIレポートの型定義
interface AIReport {
    id: string
    date: string
    summary: string
    promptId: string | null
    promptName: string | null
    workerCount: number
    alerts: number
    totalReward: number
    createdBy: string
    createdAt: string
    updatedAt: string
}

interface AIReportPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}


// モックデータ: 日次のチェックリスト提出状況
const DAILY_SUMMARIES = [
    {
        id: 'w1',
        name: '田中 太郎',
        team: '清掃Aチーム',
        employmentType: '業務委託',
        role: 'worker',
        time: '09:00 - 18:00',
        status: 'completed',
        checkedCount: '6/6',
        reward: 1100,
        hasPhoto: true,
        memo: 'フィルターの汚れが激しかったため、念入りに清掃しました。替えのストックが残り1つです。',
        isSafetyAlert: false,
        createdAt: '2023-12-01T09:00:00Z',
        items: [
            { title: '特記事項', isFreeText: true, freeTextValue: 'ロビーの電球が切れかけています。' },
            { title: '備品発注', isFreeText: true, freeTextValue: '洗剤2個発注済み' }
        ]
    },
    {
        id: 'w2',
        name: '鈴木 花子',
        team: '清掃Bチーム',
        employmentType: '外注先',
        role: 'worker',
        time: '10:00 - 15:00',
        status: 'partial',
        checkedCount: '4/6',
        reward: 500,
        hasPhoto: false,
        memo: '備品補充は時間が足りず未完了ですが、清掃は終わっています。',
        isSafetyAlert: false,
        createdAt: '2023-12-02T10:00:00Z',
        items: []
    },
    {
        id: 'w3',
        name: '佐藤 健',
        team: '特別清掃チーム',
        employmentType: '業務委託',
        role: 'admin',
        time: '08:30 - 17:30',
        status: 'completed',
        checkedCount: '6/6',
        reward: 1100,
        hasPhoto: true,
        memo: '脚立の使用時に少しぐらつきを感じました。点検が必要かもしれません。',
        isSafetyAlert: true,
        createdAt: '2023-12-03T08:30:00Z',
        items: [
            { title: '安全確認備考', isFreeText: true, freeTextValue: '階段の滑り止めが剥がれかかっている箇所がありました。' }
        ]
    },
]

const INITIAL_PROMPTS = [
    { id: '1', name: '標準的な総括', content: '本日の報告内容を要約し、重要な注意点やヒヤリハット報告を抽出してください。' },
    { id: '2', name: '改善提案重視', content: '本日の報告から、今後の業務改善に繋がるポイントを3つ提案してください。' },
    { id: '3', name: 'インセンティブ分析', content: '獲得報酬の傾向を分析し、スタッフのモチベーションについて考察してください。' }
]

export default function ChecklistSummaryPage() {
    const { currentUser } = useAuth()
    const [workers, setWorkers] = useState<Worker[]>([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isMobile = useIsMobile()

    useEffect(() => {
        if (currentUser?.id) {
            getWorkers(currentUser.id).then(setWorkers)
        }
    }, [currentUser])

    const ownWorker = useMemo(
        () => workers.find((w) => w.employeeId === currentUser?.id) || null,
        [workers, currentUser?.id],
    )
    const isLeader = ownWorker?.role === 'admin'

    // モバイル時のスクロールでメニューを閉じる
    useEffect(() => {
        if (!isMobile || !isMenuOpen) return
        const handleScroll = () => setIsMenuOpen(false)
        window.addEventListener('scroll', handleScroll, { passive: true })
        document.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            document.removeEventListener('scroll', handleScroll)
        }
    }, [isMobile, isMenuOpen])

    const [isSummarizing, setIsSummarizing] = useState(false)
    const [aiReport, setAiReport] = useState<string | null>(null)

    // フィルター状態
    const [filterTeam, setFilterTeam] = useState('all')
    const [filterEmployment, setFilterEmployment] = useState('all')
    const [filterRole, setFilterRole] = useState('all')
    const [filterDate, setFilterDate] = useState<Date>(new Date())
    const [sortOrder, setSortOrder] = useState('newest')
    const [teams, setTeams] = useState<string[]>([])

    // AIプロンプト状態
    const [prompts, setPrompts] = useState(INITIAL_PROMPTS)
    const [selectedPromptId, setSelectedPromptId] = useState(INITIAL_PROMPTS[0].id)
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
    const [newPromptName, setNewPromptName] = useState('')
    const [newPromptContent, setNewPromptContent] = useState('')
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null)

    // モーダル状態
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'daily' | 'period'>('daily')
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date()
    })

    const isInitialMount = useRef(true)
    const [realSummaries, setRealSummaries] = useState<any[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)

    // AIレポート履歴用state
    const [historicalReports, setHistoricalReports] = useState<AIReport[]>([])
    const [reportPagination, setReportPagination] = useState<AIReportPagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
    const [reportLimit, setReportLimit] = useState(20) // 1ページの表示件数
    const [isLoadingReports, setIsLoadingReports] = useState(false)
    const [selectedAIReport, setSelectedAIReport] = useState<AIReport | null>(null)
    const [isPeriodSummarizing, setIsPeriodSummarizing] = useState(false)
    const [isAIReportModalOpen, setIsAIReportModalOpen] = useState(false)

    // AIプロンプトの永続化（localStorage）
    useEffect(() => {
        const savedPrompts = localStorage.getItem('checklist_ai_prompts')
        if (savedPrompts) {
            try {
                const parsed = JSON.parse(savedPrompts)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPrompts(parsed)
                    // 初期選択プロンプトの整合性チェック
                    if (selectedPromptId && !parsed.find((p: any) => p.id === selectedPromptId)) {
                        setSelectedPromptId(parsed[0].id)
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved prompts', e)
            }
        }
    }, [])

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        if (prompts.length > 0) {
            localStorage.setItem('checklist_ai_prompts', JSON.stringify(prompts))
        }
    }, [prompts])

    useEffect(() => {
        if (currentUser?.id) {
            getTeams(currentUser.id).then(setTeams)
        }
    }, [currentUser])

    // AIレポートの取得（autoGenerate=trueで未生成日を自動生成）
    const fetchAIReports = async (page = 1, autoGenerate = true, limit = reportLimit) => {
        if (!currentUser?.id || !dateRange?.from || !dateRange?.to) return
        setIsLoadingReports(true)
        try {
            const startDate = format(dateRange.from, 'yyyy-MM-dd')
            const endDate = format(dateRange.to, 'yyyy-MM-dd')
            const autoGenerateParam = autoGenerate ? '&autoGenerate=true' : ''
            const response = await fetch(`/api/workclock/ai-reports?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}${autoGenerateParam}`, {
                headers: { 'x-employee-id': currentUser.id }
            })
            const data = await response.json()
            if (data.reports) {
                setHistoricalReports(data.reports)
                setReportPagination(data.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch AI reports:', error)
        } finally {
            setIsLoadingReports(false)
        }
    }

    // 表示件数の変更
    const handleLimitChange = (newLimit: string) => {
        const limit = parseInt(newLimit)
        setReportLimit(limit)
        fetchAIReports(1, true, limit)
    }

    // 期間統合AIレポート生成
    const handlePeriodSummarize = async () => {
        if (!currentUser?.id || !dateRange?.from || !dateRange?.to) {
            console.error('[handlePeriodSummarize] Missing required data:', { userId: currentUser?.id, dateRange })
            return
        }

        setIsPeriodSummarizing(true)
        setIsSummarizing(true) // ボタンのローディング状態も同期

        try {
            const startDate = format(dateRange.from, 'yyyy-MM-dd')
            const endDate = format(dateRange.to, 'yyyy-MM-dd')

            console.log('[handlePeriodSummarize] Fetching for:', startDate, 'to', endDate)

            const response = await fetch('/api/workclock/ai-reports/summarize-period', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-employee-id': currentUser.id
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    promptName: selectedPrompt.name,
                    promptContent: selectedPrompt.content
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'APIエラーが発生しました')
            }

            const data = await response.json()
            if (data.summary) {
                setAiReport(data.summary)
                toast.success('統合分析が完了しました')
                // 履歴リストを更新
                fetchAIReports(1, true, reportLimit)
            } else {
                setAiReport('レポートが見つかりませんでした。')
            }
        } catch (error: any) {
            console.error('Failed to generate period summary:', error)
            setAiReport(`エラー: ${error.message || '期間統合レポートの生成に失敗しました。'}`)
            toast.error(error.message || '分析に失敗しました')
        } finally {
            setIsPeriodSummarizing(false)
            setIsSummarizing(false)
        }
    }

    // 期間モードに切り替わった時、または日付範囲が変更された時にレポートを取得
    useEffect(() => {
        if (viewMode === 'period' && dateRange?.from && dateRange?.to && currentUser?.id) {
            fetchAIReports(1, true, reportLimit)
        }
    }, [viewMode, dateRange, currentUser?.id])

    // データの取得
    const fetchSummaries = async () => {
        if (!currentUser?.id) return
        setIsLoadingData(true)
        try {
            const dateStr = format(filterDate, 'yyyy-MM-dd')
            const options = {
                headers: {
                    'x-employee-id': currentUser.id
                }
            }

            // 1. 全ワーカーを取得
            const workers = await getWorkers(currentUser.id)

            // 2. 提出データを取得
            const response = await fetch(`/api/workclock/checklist/submissions?startDate=${dateStr}&endDate=${dateStr}`, options)
            const data = await response.json()
            const submissions = data.submissions || []
            const submissionMap = submissions.reduce((acc: any, s: any) => {
                acc[s.workerId] = s
                return acc
            }, {})

            // 3. 勤務時間を取得してマッピング
            const timeEntriesRes = await fetch(`/api/workclock/time-entries?startDate=${dateStr}&endDate=${dateStr}`, options)
            const timeData = await timeEntriesRes.json()
            const timeEntries = Array.isArray(timeData) ? timeData : (timeData?.entries || [])
            const timeMap = timeEntries.reduce((acc: any, entry: any) => {
                acc[entry.workerId] = `${entry.startTime} - ${entry.endTime}`
                return acc
            }, {})

            // 4. 全ワーカーをベースにマッピング（未提出者を含む）
            const mapped = workers.map((w: any) => {
                const s = submissionMap[w.id]
                const totalItems = s?.items?.length || 0
                const checkedItems = (s?.items || []).filter((it: any) =>
                    it.isChecked || (it.isFreeText && it.freeTextValue?.trim())
                ).length
                const mandatoryItems = (s?.items || []).filter((it: any) => it.isMandatory)
                const checkedMandatory = mandatoryItems.filter((it: any) =>
                    it.isChecked || (it.isFreeText && it.freeTextValue?.trim())
                ).length

                const isCompleted = mandatoryItems.length > 0 ? (checkedMandatory === mandatoryItems.length) : (s ? true : false)

                let parsedTeams: string[] = []
                try {
                    parsedTeams = typeof w.teams === 'string' ? JSON.parse(w.teams) : (w.teams || [])
                } catch (e) {
                    parsedTeams = []
                }

                return {
                    id: s?.id || `no-submission-${w.id}`,
                    workerId: w.id,
                    name: w.name || '不明',
                    team: parsedTeams[0] || '未所属',
                    teams: parsedTeams,
                    employmentType: w.companyName || '業務委託',
                    role: w.role || 'worker',
                    time: timeMap[w.id] || '未登録',
                    status: s ? (isCompleted ? 'completed' : 'partial') : 'none',
                    checkedCount: s ? `${checkedItems}/${totalItems}` : '未報告',
                    reward: s?.items?.reduce((acc: number, it: any) => {
                        const isEligible = it.isChecked || (it.isFreeText && it.freeTextValue?.trim())
                        return acc + (isEligible ? it.reward : 0)
                    }, 0) || 0,
                    hasPhoto: s?.hasPhoto || false,
                    memo: s?.memo || '',
                    isSafetyAlert: s?.isSafetyAlert || false,
                    createdAt: s?.createdAt || null,
                    items: s?.items || []
                }
            })
            setRealSummaries(mapped)
        } catch (error) {
            console.error('Failed to fetch summaries:', error)
            setRealSummaries([])
        } finally {
            setIsLoadingData(false)
        }
    }

    useEffect(() => {
        fetchSummaries()
    }, [filterDate, currentUser])

    const selectedPrompt = prompts.find(p => p.id === selectedPromptId) || prompts[0]

    const filteredSummaries = realSummaries.filter(row => {
        // リーダー権限の場合は自分のチーム所属者のみ（自身含む）
        if (isLeader) {
            const ownTeams = ownWorker?.teams || []
            const workerTeams = row.teams || []
            const isSameTeam = workerTeams.some((t: any) => ownTeams.includes(t))
            const isMe = row.workerId === ownWorker?.id
            if (!isSameTeam && !isMe) return false
        }

        if (filterTeam !== 'all' && !row.teams.includes(filterTeam)) return false
        if (filterEmployment !== 'all' && row.employmentType !== filterEmployment) return false
        if (filterRole !== 'all' && row.role !== filterRole) return false
        return true
    }).sort((a, b) => {
        if (sortOrder === 'newest') {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
        }
        if (sortOrder === 'oldest') {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity
            return dateA - dateB
        }
        if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'ja')
        if (sortOrder === 'team_asc') return a.team.localeCompare(b.team, 'ja')
        if (sortOrder === 'role_desc') return (a.role === 'admin' ? 0 : 1) - (b.role === 'admin' ? 0 : 1)
        return 0
    })

    // historicalReportsはAPIから取得済みなのでフィルタリング不要（APIで期間指定）
    const filteredHistoricalReports = historicalReports

    const handleSavePrompt = () => {
        if (!newPromptName || !newPromptContent) return

        if (editingPromptId) {
            // 編集保存
            setPrompts(prompts.map(p =>
                p.id === editingPromptId
                    ? { ...p, name: newPromptName, content: newPromptContent }
                    : p
            ))
            setEditingPromptId(null)
        } else {
            // 新規作成
            const newPrompt = {
                id: Math.random().toString(36).substr(2, 9),
                name: newPromptName,
                content: newPromptContent
            }
            setPrompts([...prompts, newPrompt])
            setSelectedPromptId(newPrompt.id)
        }

        setNewPromptName('')
        setNewPromptContent('')
        setIsPromptDialogOpen(false)
    }

    const handleDeletePrompt = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (prompts.length <= 1) {
            alert('少なくとも1つのプロンプトが必要です。')
            return
        }
        if (window.confirm('このプロンプトを削除してもよろしいですか？')) {
            const nextPrompts = prompts.filter(p => p.id !== id)
            setPrompts(nextPrompts)
            if (selectedPromptId === id) {
                setSelectedPromptId(nextPrompts[0].id)
            }
        }
    }

    const startEditPrompt = (p: typeof INITIAL_PROMPTS[0], e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingPromptId(p.id)
        setNewPromptName(p.name)
        setNewPromptContent(p.content)
        setIsPromptDialogOpen(true)
    }

    const handleRunAI = async () => {
        if (viewMode === 'period') {
            // 期間モードの場合は統合APIを直接呼び出す
            await handlePeriodSummarize()
        } else {
            // 日次モードの場合
            setIsSummarizing(true)
            try {
                const workerCount = filteredSummaries.length
                const completedCount = filteredSummaries.filter((s: any) => s.status === 'completed').length
                const totalReward = filteredSummaries.reduce((acc: number, s: any) => acc + s.reward, 0)
                const alertCount = filteredSummaries.filter((s: any) => s.isSafetyAlert).length
                const alerts = filteredSummaries.filter((s: any) => s.isSafetyAlert).map((s: any) => `${s.name}: ${s.memo}`).join('\n')

                const reportSummary = `【${selectedPrompt.name} に基づく分析】
プロンプト: ${selectedPrompt.content}

対象者: ${workerCount}名（全完了: ${completedCount}名）
合計報酬: ¥${totalReward.toLocaleString()}

【総括】
・現在のフィルター条件に基づき、${workerCount}名の報告を分析しました。
・特筆すべき点: ${alerts || '不具合報告はありません。'}
・AIの見解: 稼働率が安定しており、${selectedPrompt.id === '2' ? '備品管理の自動化を検討すべきです。' : '全体的に良好なコンディションです。'}`

                setAiReport(reportSummary)

                // データベースに保存
                if (currentUser?.id) {
                    try {
                        await fetch('/api/workclock/ai-reports', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-employee-id': currentUser.id
                            },
                            body: JSON.stringify({
                                date: format(filterDate, 'yyyy-MM-dd'),
                                summary: reportSummary,
                                promptId: selectedPrompt.id,
                                promptName: selectedPrompt.name,
                                workerCount: workerCount,
                                alerts: alertCount,
                                totalReward: totalReward
                            })
                        })
                    } catch (error) {
                        console.error('Failed to save AI report:', error)
                    }
                }
            } finally {
                setIsSummarizing(false)
            }
        }
    }

    return (
        <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }} translate="no">
            <Toaster position="top-center" richColors />
            {isMobile ? (
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50">
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                                style={{ backgroundColor: '#f5f4cd' }}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                    </div>
                    <SheetContent side="top" className="p-0 w-full h-auto max-h-[80vh]">
                        <SheetHeader className="px-4 py-3 border-b">
                            <SheetTitle>時間管理システム</SheetTitle>
                        </SheetHeader>
                        <div className="max-h-[calc(80vh-60px)] overflow-y-auto">
                            <SidebarNav workers={workers} currentRole="admin" showHeader={false} collapsible={false} />
                        </div>
                    </SheetContent>
                </Sheet>
            ) : (
                <>
                    <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                            style={{ backgroundColor: '#f5f4cd' }}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                    <div
                        className={`h-full overflow-hidden border-r border-slate-200 bg-sidebar transition-all duration-300 ${isMenuOpen ? 'w-72' : 'w-0'
                            }`}
                        style={{ backgroundColor: '#add1cd' }}
                    >
                        {isMenuOpen && (
                            <>
                                <div className="px-4 py-3 border-b">
                                    <h2 className="text-base font-semibold text-sidebar-foreground">
                                        時間管理システム
                                    </h2>
                                </div>
                                <SidebarNav workers={workers} currentRole="admin" showHeader={false} collapsible={false} />
                            </>
                        )}
                    </div>
                </>
            )}

            <main className={`flex-1 overflow-y-auto ${isMobile ? 'pt-20' : 'pt-16'}`}>
                <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {viewMode === 'daily' ? '業務チェック集計' : 'AI総括レポート履歴'}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                {viewMode === 'daily'
                                    ? `${format(filterDate, 'yyyy年MM月dd日 (E)', { locale: ja })} の報告状況とAI分析`
                                    : `${dateRange?.from ? format(dateRange.from, 'yyyy/MM/dd') : ''} 〜 ${dateRange?.to ? format(dateRange.to, 'yyyy/MM/dd') : ''} の期間分析`
                                }
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-white/40 backdrop-blur-sm border border-white/60 p-1 rounded-2xl shadow-sm">
                                <Button
                                    variant={viewMode === 'daily' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                        "rounded-xl px-4 h-8 text-xs font-bold transition-all duration-300",
                                        viewMode === 'daily' ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" : "text-slate-500 hover:text-indigo-600"
                                    )}
                                    onClick={() => setViewMode('daily')}
                                >
                                    <Clock className="w-3.5 h-3.5 mr-2" />
                                    日次
                                </Button>
                                <Button
                                    variant={viewMode === 'period' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn(
                                        "rounded-xl px-4 h-8 text-xs font-bold transition-all duration-300",
                                        viewMode === 'period' ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" : "text-slate-500 hover:text-indigo-600"
                                    )}
                                    onClick={() => setViewMode('period')}
                                >
                                    <History className="w-3.5 h-3.5 mr-2" />
                                    期間
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "h-10 px-4 justify-start text-left font-bold text-xs bg-white rounded-xl border-slate-100 shadow-sm transition-all hover:bg-slate-50",
                                                !(viewMode === 'daily' ? filterDate : dateRange) && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                            {viewMode === 'daily' ? (
                                                filterDate ? format(filterDate, "yyyy/MM/dd") : <span>日付を選択</span>
                                            ) : (
                                                dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "MM/dd")} - {format(dateRange.to, "MM/dd")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "MM/dd")
                                                    )
                                                ) : (
                                                    <span>期間を選択</span>
                                                )
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        {viewMode === 'daily' ? (
                                            <Calendar
                                                mode="single"
                                                selected={filterDate}
                                                onSelect={(date) => date && setFilterDate(date)}
                                                initialFocus
                                                locale={ja}
                                            />
                                        ) : (
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                                locale={ja}
                                            />
                                        )}
                                    </PopoverContent>
                                </Popover>

                                <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                    <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                                        <SelectTrigger className="w-[180px] h-9 border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 rounded-xl px-3 group">
                                            <div className="flex items-center gap-2 truncate text-xs font-bold text-slate-700">
                                                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="truncate">
                                                    {prompts.find(p => p.id === selectedPromptId)?.name || 'プロンプトを選択'}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {prompts.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="relative group/item pr-16 py-2.5">
                                                        <span className="text-xs font-medium">
                                                            {p.name}
                                                        </span>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm pl-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={(e) => startEditPrompt(p, e)}
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDeletePrompt(p.id, e)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={isPromptDialogOpen} onOpenChange={(open) => {
                                        setIsPromptDialogOpen(open)
                                        if (!open) {
                                            setEditingPromptId(null)
                                            setNewPromptName('')
                                            setNewPromptContent('')
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg ml-1"
                                                onClick={() => {
                                                    setEditingPromptId(null)
                                                    setNewPromptName('')
                                                    setNewPromptContent('')
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{editingPromptId ? 'AIプロンプトの編集' : 'AIプロンプトの追加'}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>プロンプト名</Label>
                                                    <Input
                                                        placeholder="例: マニュアル改善用"
                                                        value={newPromptName}
                                                        onChange={(e) => setNewPromptName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>命令文 (プロンプト)</Label>
                                                    <Textarea
                                                        placeholder="AIへの具体的な指示を入力..."
                                                        className="h-32"
                                                        value={newPromptContent}
                                                        onChange={(e) => setNewPromptContent(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>キャンセル</Button>
                                                <Button onClick={handleSavePrompt} disabled={!newPromptName || !newPromptContent}>保存する</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Button
                                    onClick={handleRunAI}
                                    disabled={isSummarizing || isPeriodSummarizing}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md h-10 px-5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSummarizing || isPeriodSummarizing ? (
                                        <>
                                            <Bot className="w-3.5 h-3.5 mr-2 animate-bounce" />
                                            <span>統合分析中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                                            <span>
                                                {viewMode === 'period' ? `全${reportPagination.total}件を統合分析` : 'AIレポートを生成'}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200/60 hidden md:block mx-1" />

                            <AIAskButton
                                context={`【業務チェック分析コンテキスト】
                                日付: ${format(filterDate, 'yyyy年MM月dd日')}
                                対象ワーカー数: ${filteredSummaries.length}名
                                フィルタ: ${filterTeam !== 'all' ? `チーム:${filterTeam}` : '全チーム'} | ${filterEmployment !== 'all' ? `形態:${filterEmployment}` : '全形態'}
                                
                                報告データ概要:
                                ${filteredSummaries.map(s => {
                                    const freeTextSummary = s.items?.filter((i: any) => i.isFreeText && i.freeTextValue)
                                        .map((i: any) => `${i.title}: "${i.freeTextValue}"`)
                                        .join(', ') || 'なし'
                                    return `- ${s.name} (${s.team}): ${s.checkedCount}完了, 報酬:¥${s.reward}, メモ:"${s.memo}", 自由記入欄:[${freeTextSummary}]`
                                }).join('\n')}
                                
                                AIによる総括が生成されている場合:
                                ${aiReport ? aiReport : '未生成'}
                                `}
                            />
                        </div>
                    </div>

                    {viewMode === 'daily' ? (
                        <>
                            {/* フィルタエリア */}
                            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                                <CardContent className="p-4">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[140px] space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">チーム</Label>
                                            <Select value={filterTeam} onValueChange={setFilterTeam}>
                                                <SelectTrigger className="bg-white border-slate-200 h-9">
                                                    <SelectValue placeholder="すべて" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべて</SelectItem>
                                                    {teams
                                                        .filter(team => {
                                                            if (isLeader) {
                                                                return (ownWorker?.teams || []).includes(team)
                                                            }
                                                            return true
                                                        })
                                                        .map((team) => (
                                                            <SelectItem key={team} value={team}>{team}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* ... other filters ... */}
                                        <div className="flex-1 min-w-[140px] space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">雇用形態</Label>
                                            <Select value={filterEmployment} onValueChange={setFilterEmployment}>
                                                <SelectTrigger className="bg-white border-slate-200 h-9">
                                                    <SelectValue placeholder="すべて" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべて</SelectItem>
                                                    <SelectItem value="業務委託">業務委託</SelectItem>
                                                    <SelectItem value="外注先">外注先</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-[140px] space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">権限</Label>
                                            <Select value={filterRole} onValueChange={setFilterRole}>
                                                <SelectTrigger className="bg-white border-slate-200 h-9">
                                                    <SelectValue placeholder="すべて" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">すべて</SelectItem>
                                                    <SelectItem value="admin">リーダー</SelectItem>
                                                    <SelectItem value="worker">業務委託・外注先</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-[140px] space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">並び順</Label>
                                            <Select value={sortOrder} onValueChange={setSortOrder}>
                                                <SelectTrigger className="bg-white border-slate-200 h-9">
                                                    <SelectValue placeholder="登録日時（新しい順）" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="newest">登録日時（新しい順）</SelectItem>
                                                    <SelectItem value="oldest">登録日時（古い順）</SelectItem>
                                                    <SelectItem value="name_asc">名前順</SelectItem>
                                                    <SelectItem value="team_asc">チーム名順</SelectItem>
                                                    <SelectItem value="role_desc">権限順</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* AIレポート表示エリア */}
                            {aiReport && (
                                <Card className="border-2 border-purple-200 bg-purple-50/50 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-purple-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5" /> AI総括レポート
                                            </div>
                                            <Badge variant="outline" className="text-[10px] bg-white/50 border-purple-200 text-purple-600">
                                                対象: {filteredSummaries.length}名
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-white/60 p-4 rounded-lg border border-purple-100 italic font-medium">
                                            {aiReport}
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button variant="ghost" size="sm" className="text-[11px] h-8 text-slate-400" onClick={() => setAiReport(null)}>
                                                閉じる
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                <Card className="shadow-sm border-none bg-white/80 overflow-hidden">
                                    <CardHeader className="pb-0 border-b border-slate-100 bg-white/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <CardTitle className="text-lg">ワーカー別 報告一覧</CardTitle>
                                            <span className="text-xs text-slate-400 font-medium">該当件数: {filteredSummaries.length}件</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                    <TableHead className="w-[180px] text-xs font-bold py-3 pl-6">ワーカー名 / チーム</TableHead>
                                                    <TableHead className="text-xs font-bold py-3">完了 / 全体</TableHead>
                                                    <TableHead className="text-xs font-bold py-3">獲得寸志</TableHead>
                                                    <TableHead className="text-xs font-bold py-3">画像・メモ</TableHead>
                                                    <TableHead className="text-right pr-6 py-3">詳細</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoadingData ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                                <p className="text-sm font-medium animate-pulse">解析中...</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filteredSummaries.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                                                            該当する報告がありません
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredSummaries.map((row) => (
                                                        <TableRow
                                                            key={row.id}
                                                            className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedReport(row)
                                                                setIsDetailModalOpen(true)
                                                            }}
                                                        >
                                                            <TableCell className="pl-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-900">{row.name}</span>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <Badge variant="outline" className="text-[10px] px-1 h-4 bg-slate-50 border-slate-200 text-slate-500 font-normal">
                                                                            {row.team}
                                                                        </Badge>
                                                                        <span className="text-[10px] text-slate-400">{row.employmentType}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        {row.status === 'completed' ? (
                                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                                                        ) : row.status === 'partial' ? (
                                                                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                                                        ) : (
                                                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                                        )}
                                                                        <span className="text-sm font-bold text-slate-700">{row.checkedCount}</span>
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400 lowercase">{row.time}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-yellow-600 text-sm">¥{row.reward.toLocaleString()}</span>
                                                                    <span className="text-[9px] text-slate-300 font-mono">INC_DAILY</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col gap-1.5 min-w-[300px] max-w-[600px]">
                                                                    <div className="flex gap-1">
                                                                        {row.photoUrl ? (
                                                                            <div className="w-8 h-8 rounded overflow-hidden border border-slate-200">
                                                                                <img src={row.photoUrl} className="w-full h-full object-cover" />
                                                                            </div>
                                                                        ) : row.hasPhoto && (
                                                                            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 text-[9px] h-4">画像あり</Badge>
                                                                        )}
                                                                        {row.isSafetyAlert && (
                                                                            <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100 text-[9px] h-4 flex items-center gap-0.5">
                                                                                <AlertTriangle className="w-2 h-2" /> ヒヤリハット
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {(() => {
                                                                        // memoがあればそれを表示、なければitemsの自由記入欄を表示
                                                                        const memo = row.memo?.trim()
                                                                        const freeTexts = (row.items || [])
                                                                            .filter((it: any) => it.isFreeText && it.freeTextValue?.trim())
                                                                            .map((it: any) => it.freeTextValue)
                                                                            .join(' / ')
                                                                        const displayText = memo || freeTexts

                                                                        return displayText ? (
                                                                            <p className="text-xs text-slate-500 leading-snug break-words line-clamp-2">
                                                                                {displayText}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-xs text-slate-300 italic">記入なし</p>
                                                                        )
                                                                    })()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 py-4">
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <Search className="w-4 h-4 text-slate-400" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* 期間統合AIレポートの表示エリア */}
                            {aiReport && (
                                <Card className="shadow-lg border-none bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Bot className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                                    </div>
                                    <CardHeader className="pb-3 border-b border-indigo-100/50 bg-white/40">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                                                AI期間統合分析レポート
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setAiReport('')}
                                                className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50 rounded-full"
                                            >
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="prose prose-sm max-w-none">
                                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-inner min-h-[100px] whitespace-pre-wrap leading-relaxed text-slate-700 font-medium text-sm">
                                                {aiReport}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full border border-indigo-100 text-[10px] text-indigo-600 font-bold">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {format(dateRange?.from || new Date(), 'MM/dd')} - {format(dateRange?.to || new Date(), 'MM/dd')}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">※このレポートは期間内の日次総括を元に生成されました</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="shadow-sm border-none bg-white/80 overflow-hidden">
                                <CardHeader className="pb-4 bg-white/50 border-b border-slate-100">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <History className="w-5 h-5 text-indigo-600" /> AI総括レポート履歴
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {isLoadingReports ? (
                                            <div className="py-16 text-center text-slate-400">
                                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-sm font-medium text-indigo-600">レポートを集計しています...</p>
                                                <p className="text-xs text-slate-400 mt-1">チェックリストデータを分析中</p>
                                            </div>
                                        ) : filteredHistoricalReports.length === 0 ? (
                                            <div className="py-10 text-center text-slate-400">
                                                <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">選択された期間にチェックリスト提出がありません</p>
                                            </div>
                                        ) : filteredHistoricalReports.map((report, idx) => (
                                            <div
                                                key={report.id || idx}
                                                className="px-4 py-2 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center gap-3"
                                                onClick={() => {
                                                    setSelectedAIReport(report)
                                                    setIsAIReportModalOpen(true)
                                                }}
                                            >
                                                {/* 日付 */}
                                                <div className="w-32 flex-shrink-0">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {format(new Date(report.date), 'MM/dd (E)', { locale: ja })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        {format(new Date(report.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>

                                                {/* バッジ類 */}
                                                <div className="w-32 flex-shrink-0 flex items-center gap-1">
                                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] px-1.5 py-0">
                                                        {report.workerCount}名
                                                    </Badge>
                                                    {report.alerts > 0 && (
                                                        <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] px-1.5 py-0">
                                                            ⚠{report.alerts}
                                                        </Badge>
                                                    )}
                                                    {report.promptName && (
                                                        <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[9px] px-1.5 py-0 truncate max-w-[60px]">
                                                            {report.promptName}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* サマリー */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-600 truncate">
                                                        {report.summary.replace(/\n/g, ' ').substring(0, 80)}...
                                                    </p>
                                                </div>

                                                {/* 合計インセンティブ */}
                                                <div className="w-24 flex-shrink-0 text-right">
                                                    <span className="text-sm font-bold text-indigo-600">¥{report.totalReward.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                {/* ページネーションと表示件数選択 */}
                                <div className="px-6 py-4 border-t border-slate-100 bg-white/50 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400">
                                            全{reportPagination.total}件中 {reportPagination.total > 0 ? ((reportPagination.page - 1) * reportPagination.limit) + 1 : 0} - {Math.min(reportPagination.page * reportPagination.limit, reportPagination.total)}件を表示
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">表示:</span>
                                            <Select value={String(reportLimit)} onValueChange={handleLimitChange}>
                                                <SelectTrigger className="w-[80px] h-7 text-xs bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10件</SelectItem>
                                                    <SelectItem value="20">20件</SelectItem>
                                                    <SelectItem value="50">50件</SelectItem>
                                                    <SelectItem value="100">100件</SelectItem>
                                                    <SelectItem value="200">200件</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {reportPagination.totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-xs"
                                                disabled={reportPagination.page <= 1 || isLoadingReports}
                                                onClick={() => fetchAIReports(reportPagination.page - 1, false)}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            {/* ページ番号を表示 */}
                                            {Array.from({ length: reportPagination.totalPages }, (_, i) => i + 1)
                                                .filter(p => {
                                                    // 現在のページの前後2ページと最初・最後を表示
                                                    const current = reportPagination.page
                                                    return p === 1 || p === reportPagination.totalPages ||
                                                        (p >= current - 1 && p <= current + 1)
                                                })
                                                .map((p, idx, arr) => (
                                                    <>
                                                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                            <span key={`ellipsis-${p}`} className="text-xs text-slate-300 px-1">...</span>
                                                        )}
                                                        <Button
                                                            key={p}
                                                            variant={p === reportPagination.page ? "default" : "outline"}
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 w-8 text-xs p-0",
                                                                p === reportPagination.page && "bg-indigo-600 text-white"
                                                            )}
                                                            disabled={isLoadingReports}
                                                            onClick={() => fetchAIReports(p, false)}
                                                        >
                                                            {p}
                                                        </Button>
                                                    </>
                                                ))}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 text-xs"
                                                disabled={reportPagination.page >= reportPagination.totalPages || isLoadingReports}
                                                onClick={() => fetchAIReports(reportPagination.page + 1, false)}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </main >

            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-3xl overflow-hidden p-0 gap-0 bg-[#f8fafc] border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    {selectedReport?.name} の業務チェック詳細
                                </DialogTitle>
                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {format(filterDate, 'yyyy年MM月dd日 (E)', { locale: ja })}
                                    <span className="mx-1">•</span>
                                    {selectedReport?.team}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 pr-8">
                                <AIAskButton
                                    context={`ワーカー「${selectedReport?.name}」の${format(filterDate, 'yyyy年MM月dd日')}における業務チェック報告詳細です。
                                    完了状況: ${selectedReport?.checkedCount}
                                    メモ: ${selectedReport?.memo}
                                    獲得報酬: ¥${selectedReport?.reward}
                                    
                                    このレポートについて深掘り質問ができます。`}
                                />
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="p-6 space-y-6">
                            {/* 基本情報カード */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">報告ステータス</Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        {selectedReport?.status === 'completed' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> 完了済
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                                                一部完了
                                            </Badge>
                                        )}
                                        <span className="text-xs font-bold text-slate-600">{selectedReport?.time}</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">インセンティブ</Label>
                                    <div className="mt-2">
                                        <span className="text-xl font-bold text-blue-600">¥{selectedReport?.reward.toLocaleString()}</span>
                                        <span className="text-[9px] text-slate-300 ml-2">本日の成果分</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">リスク管理</Label>
                                    <div className="mt-2">
                                        {selectedReport?.isSafetyAlert ? (
                                            <Badge className="bg-red-50 text-red-600 border-red-100">
                                                <AlertTriangle className="w-3 h-3 mr-1" /> ヒヤリハット報告あり
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">異常報告なし</span>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* チェック項目リスト (モック) */}
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> チェック項目詳細
                                    </h3>
                                    <span className="text-xs font-medium text-slate-400">実績: {selectedReport?.checkedCount}</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {[
                                        { item: "入室時の検温・消毒", status: true },
                                        { item: "床面・カーペットの清掃", status: true },
                                        { item: "ゴミ箱の回収とライナー交換", status: true },
                                        { item: "備品の補充（ペーパー類）", status: true },
                                        { item: "最終確認・鍵のかけ忘れ確認", status: selectedReport?.status === 'completed' },
                                        { item: "作業箇所の写真撮影", status: selectedReport?.hasPhoto },
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                                            <span className="text-sm text-slate-600">{item.item}</span>
                                            {item.status ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* メモ・画像セクション */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-500 flex items-center gap-2 ml-1">
                                    <MessageSquare className="w-4 h-4" /> 現場からの報告メモ
                                </Label>
                                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm italic text-slate-600 text-sm leading-relaxed">
                                    "{selectedReport?.memo}"
                                </div>

                                {selectedReport?.photoUrl ? (
                                    <div className="mt-4">
                                        <Label className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-2 ml-1">
                                            <ImageIcon className="w-4 h-4" /> 報告用写真
                                        </Label>
                                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                                            <img
                                                src={selectedReport.photoUrl}
                                                alt="Report"
                                                className="w-full h-auto max-h-[400px] object-contain mx-auto"
                                            />
                                        </div>
                                    </div>
                                ) : selectedReport?.hasPhoto && (
                                    <div className="grid grid-cols-2 gap-4 mt-4 opacity-50">
                                        <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-dashed border-slate-300">
                                            <Camera className="w-8 h-8 text-slate-300" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 bg-slate-50/80 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                            閉じる
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 shadow-md rounded-xl">
                            承認して保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AIレポート詳細モーダル */}
            <Dialog open={isAIReportModalOpen} onOpenChange={setIsAIReportModalOpen}>
                <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0 bg-[#f8fafc] border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    AI総括レポート詳細
                                </DialogTitle>
                                {selectedAIReport && (
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        {format(new Date(selectedAIReport.date), 'yyyy年MM月dd日 (E)', { locale: ja })}
                                        <span className="text-slate-300">|</span>
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(selectedAIReport.createdAt), 'HH:mm')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-6 space-y-4">
                            {/* 統計カード */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">報告者数</Label>
                                    <div className="mt-2">
                                        <span className="text-2xl font-bold text-blue-600">{selectedAIReport?.workerCount}</span>
                                        <span className="text-sm text-slate-400 ml-1">名</span>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">リスク報告</Label>
                                    <div className="mt-2">
                                        {selectedAIReport?.alerts && selectedAIReport.alerts > 0 ? (
                                            <span className="text-2xl font-bold text-red-600">{selectedAIReport.alerts}件</span>
                                        ) : (
                                            <span className="text-sm text-green-600 font-medium">なし ✓</span>
                                        )}
                                    </div>
                                </Card>
                                <Card className="p-4 bg-white border-slate-100 shadow-sm">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">合計インセンティブ</Label>
                                    <div className="mt-2">
                                        <span className="text-2xl font-bold text-indigo-600">¥{selectedAIReport?.totalReward.toLocaleString()}</span>
                                    </div>
                                </Card>
                            </div>

                            {/* プロンプト名 */}
                            {selectedAIReport?.promptName && (
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-purple-50 text-purple-600 border-purple-100">
                                        {selectedAIReport.promptName}
                                    </Badge>
                                </div>
                            )}

                            {/* サマリー全文 */}
                            <Card className="p-6 bg-white border-slate-100 shadow-sm">
                                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">AIレポート内容</Label>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedAIReport?.summary}
                                </p>
                            </Card>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 bg-slate-50/80 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsAIReportModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                            閉じる
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
