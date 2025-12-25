'use client'

import { useState, useEffect } from 'react'
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
    Bot,
    Calendar as CalendarIcon,
    Filter,
    Search,
    History,
    Clock,
    FileSearch,
    Pencil,
    Trash2
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
import { AIAskButton } from '@/components/ai-ask-button'
import { format, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'

// 歴史的AIレポートのモック
const HISTORICAL_REPORTS = [
    {
        date: subDays(new Date(), 1),
        summary: "全完了。清掃クオリティが非常に高く、クレームゼロでした。特にAチームの連携が良好です。",
        workerCount: 12,
        alerts: 0,
        reward: 12500
    },
    {
        date: subDays(new Date(), 2),
        summary: "一部未完了あり。Bチームで欠員が出ていましたが、他チームのバックアップで概ねカバーされました。",
        workerCount: 11,
        alerts: 1,
        reward: 10800
    },
    {
        date: subDays(new Date(), 3),
        summary: "ヒヤリハット報告1件あり。脚立の安全性に問題が見つかったため、明日の朝礼で周知が必要です。",
        workerCount: 13,
        alerts: 1,
        reward: 14200
    },
    {
        date: subDays(new Date(), 4),
        summary: "順調。マニュアル通りの運用が徹底されており、作業時間が平均15%短縮されました。",
        workerCount: 12,
        alerts: 0,
        reward: 13000
    },
]

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

    useEffect(() => {
        if (currentUser?.id) {
            getTeams(currentUser.id).then(setTeams)
        }
    }, [currentUser])

    const selectedPrompt = prompts.find(p => p.id === selectedPromptId) || prompts[0]

    const filteredSummaries = DAILY_SUMMARIES.filter(row => {
        if (filterTeam !== 'all' && row.team !== filterTeam) return false
        if (filterEmployment !== 'all' && row.employmentType !== filterEmployment) return false
        if (filterRole !== 'all' && row.role !== filterRole) return false
        return true
    }).sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'ja')
        if (sortOrder === 'team_asc') return a.team.localeCompare(b.team, 'ja')
        if (sortOrder === 'role_desc') return (a.role === 'admin' ? 0 : 1) - (b.role === 'admin' ? 0 : 1)
        return 0
    })

    const filteredHistoricalReports = HISTORICAL_REPORTS.filter(report => {
        if (!dateRange?.from || !dateRange?.to) return true
        const d = new Date(report.date)
        d.setHours(0, 0, 0, 0)
        const from = new Date(dateRange.from)
        from.setHours(0, 0, 0, 0)
        const to = new Date(dateRange.to)
        to.setHours(23, 59, 59, 999)
        return d >= from && d <= to
    }).sort((a, b) => b.date.getTime() - a.date.getTime())

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

    const handleRunAI = () => {
        setIsSummarizing(true)
        setTimeout(() => {
            if (viewMode === 'daily') {
                const workerCount = filteredSummaries.length
                const completedCount = filteredSummaries.filter((s: any) => s.status === 'completed').length
                const totalReward = filteredSummaries.reduce((acc: number, s: any) => acc + s.reward, 0)
                const alerts = filteredSummaries.filter((s: any) => s.isSafetyAlert).map((s: any) => `${s.name}: ${s.memo}`).join('\n')

                setAiReport(`
【${selectedPrompt.name} に基づく分析】
プロンプト: ${selectedPrompt.content}

対象者: ${workerCount}名（全完了: ${completedCount}名）
合計報酬: ¥${totalReward.toLocaleString()}

【総括】
・現在のフィルター条件に基づき、${workerCount}名の報告を分析しました。
・特筆すべき点: ${alerts || '不具合報告はありません。'}
・AIの見解: 稼働率が安定しており、${selectedPrompt.id === '2' ? '備品管理の自動化を検討すべきです。' : '全体的に良好なコンディションです。'}
      `)
            } else {
                const reportCount = filteredHistoricalReports.length
                const totalWorkerCount = filteredHistoricalReports.reduce((acc, r) => acc + r.workerCount, 0)
                const totalReward = filteredHistoricalReports.reduce((acc, r) => acc + r.reward, 0)
                const totalAlerts = filteredHistoricalReports.reduce((acc, r) => acc + r.alerts, 0)

                setAiReport(`
【${selectedPrompt.name} に基づく期間分析】
プロンプト: ${selectedPrompt.content}

対象期間: ${dateRange?.from ? format(dateRange.from, 'yyyy/MM/dd') : ''} 〜 ${dateRange?.to ? format(dateRange.to, 'yyyy/MM/dd') : ''}
対象レポート数: ${reportCount}件（延べ作業者数: ${totalWorkerCount}名）
合計報酬: ¥${totalReward.toLocaleString()}

【期間総括】
・選択された期間において、計${reportCount}件のAIレポートを統合分析しました。
・リスク報告（${totalAlerts}件）の傾向を分析し、安全管理のさらなる強化が必要です。
・AIによる改善提案: 
  ${selectedPrompt.id === '2' ? '特定の工程における遅延が常態化している可能性があります。' : '安定した出力が得られていますが、インセンティブ配分の最適化による更なる意欲向上の余地があります。'}
      `)
            }
            setIsSummarizing(false)
        }, 1500)
    }

    return (
        <div className="flex h-screen" style={{ backgroundColor: '#bddcd9' }}>
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
                                        <SelectTrigger className="w-[160px] h-7 border-none shadow-none focus:ring-0 text-xs font-bold p-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {prompts.map(p => (
                                                <div key={p.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 cursor-pointer rounded-sm" onClick={() => setSelectedPromptId(p.id)}>
                                                    <span className={cn("text-xs flex-1", selectedPromptId === p.id && "font-bold text-indigo-600")}>
                                                        {p.name}
                                                    </span>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 text-slate-400 hover:text-indigo-600 p-0"
                                                            onClick={(e) => startEditPrompt(p, e)}
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 text-slate-400 hover:text-red-600 p-0"
                                                            onClick={(e) => handleDeletePrompt(p.id, e)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
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
                                    disabled={isSummarizing || (viewMode === 'daily' ? filteredSummaries.length === 0 : filteredHistoricalReports.length === 0)}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md h-10 px-5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                                    {isSummarizing ? '分析中...' : 'AIレポート'}
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
                                                    {teams.map((team) => (
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
                                        <div className="flex gap-4 mt-4">
                                            <Button variant="outline" size="sm" className="bg-white text-[11px] h-8">
                                                <FileText className="w-3.5 h-3.5 mr-2 text-purple-600" />
                                                マニュアル作成案を生成
                                            </Button>
                                            <Button variant="outline" size="sm" className="bg-white text-[11px] h-8">
                                                <ChevronRight className="w-3.5 h-3.5 mr-2 text-purple-600" />
                                                翌日のタスクを割り当て
                                            </Button>
                                            <Button variant="ghost" size="sm" className="ml-auto text-[11px] h-8 text-slate-400" onClick={() => setAiReport(null)}>
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
                                                {filteredSummaries.length === 0 ? (
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
                                                                        ) : (
                                                                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
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
                                                                        {row.hasPhoto && (
                                                                            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 text-[9px] h-4">画像あり</Badge>
                                                                        )}
                                                                        {row.isSafetyAlert && (
                                                                            <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100 text-[9px] h-4 flex items-center gap-0.5">
                                                                                <AlertTriangle className="w-2 h-2" /> ヒヤリハット
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 italic leading-snug break-words">
                                                                        "{row.memo}"
                                                                    </p>
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
                            <Card className="shadow-sm border-none bg-white/80 overflow-hidden">
                                <CardHeader className="pb-4 bg-white/50 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <History className="w-5 h-5 text-indigo-600" /> AI総括レポート履歴
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-white border-slate-200">
                                                <FileSearch className="w-3.5 h-3.5 mr-1" /> 歴史データの取得
                                            </Button>
                                            <Badge variant="outline" className="bg-white/50 text-[10px]">過去の分析結果一覧</Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {filteredHistoricalReports.length === 0 ? (
                                            <div className="py-20 text-center text-slate-400">
                                                <FileSearch className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p>選択された期間のレポートはありません</p>
                                            </div>
                                        ) : filteredHistoricalReports.map((report, idx) => (
                                            <div key={idx} className="p-6 hover:bg-white/90 transition-all cursor-pointer group">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                                                                {format(report.date, 'yyyy年MM月dd日 (E)', { locale: ja })}
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">
                                                                    {report.workerCount}名 報告
                                                                </Badge>
                                                                {report.alerts > 0 && (
                                                                    <Badge className="bg-red-50 text-red-600 border-red-100 text-[10px]">
                                                                        リスク {report.alerts}件
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                                                            <p className="text-sm text-slate-700 leading-relaxed italic">
                                                                "{report.summary}"
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pl-1">
                                                            <span className="flex items-center gap-1">
                                                                <Search className="w-3 h-3" /> 詳細を確認
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" /> この日のAIに質問
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 text-right">
                                                        <div className="text-xs text-slate-400">合計インセンティブ</div>
                                                        <div className="text-xl font-bold text-indigo-600">¥{report.reward.toLocaleString()}</div>
                                                        <Button variant="ghost" size="sm" className="mt-2 text-indigo-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>

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

                                {selectedReport?.hasPhoto && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden relative group">
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:bg-black/5 transition-colors">
                                                <Camera className="w-8 h-8" />
                                            </div>
                                            <Badge className="absolute top-2 left-2 bg-black/50 text-white backdrop-blur-md border-none">現場撮影 01</Badge>
                                        </div>
                                        <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden relative group">
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:bg-black/5 transition-colors">
                                                <Camera className="w-8 h-8" />
                                            </div>
                                            <Badge className="absolute top-2 left-2 bg-black/50 text-white backdrop-blur-md border-none">作業後確認 02</Badge>
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
        </div >
    )
}
