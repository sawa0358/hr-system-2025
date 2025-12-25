'use client'

import { useState } from 'react'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Camera, CheckCircle2, AlertTriangle, FileText, Mail, ChevronRight } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

// モックデータ: 日次のチェックリスト提出状況
const DAILY_SUMMARIES = [
    {
        id: 'w1',
        name: '田中 太郎',
        time: '09:00 - 18:00',
        status: 'completed',
        checkedCount: '6/6',
        reward: 1100,
        hasPhoto: true,
        memo: 'フィルターの汚れが激しかったため、念入りに清掃しました。替えのストックが残り1つです。',
        isSafetyAlert: false
    },
    {
        id: 'w2',
        name: '鈴木 花子',
        time: '10:00 - 15:00',
        status: 'partial',
        checkedCount: '4/6',
        reward: 500,
        hasPhoto: false,
        memo: '備品補充は時間が足りず未完了ですが、清掃は終わっています。',
        isSafetyAlert: false
    },
    {
        id: 'w3',
        name: '佐藤 健',
        time: '08:30 - 17:30',
        status: 'completed',
        checkedCount: '6/6',
        reward: 1100,
        hasPhoto: true,
        memo: '脚立の使用時に少しぐらつきを感じました。点検が必要かもしれません。',
        isSafetyAlert: true
    },
]

export default function ChecklistSummaryPage() {
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [aiReport, setAiReport] = useState<string | null>(null)

    const handleRunAI = () => {
        setIsSummarizing(true)
        setTimeout(() => {
            setAiReport(`
【本日の業務分析・総括】
・全体：3名中2名が全項目完了。1名は時間不足により一部未完了。
・清掃状況：全スタッフが「フィルター清掃」を完了。田中氏より「ストック不足」の報告あり、発注が必要です。
・安全性：佐藤氏より「脚立の不具合」に関するヒヤリハット報告あり。事故防止のため、明日の朝一番で点検または買い替えを推奨します。
・寸志合計：本日合計 ¥2,700 のインセンティブが発生しています。
      `)
            setIsSummarizing(false)
        }, 1500)
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <div className="hidden md:block w-64 flex-none border-r bg-[#add1cd]">
                <SidebarNav workers={[]} currentRole="admin" showHeader={true} collapsible={false} />
            </div>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">業務チェック集計</h1>
                            <p className="text-slate-500">2024年12月25日 (水) の報告状況とAI分析</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <Mail className="w-4 h-4 mr-2" />
                                結果をメール送信
                            </Button>
                            <Button onClick={handleRunAI} disabled={isSummarizing} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg">
                                <Sparkles className="w-4 h-4 mr-2" />
                                {isSummarizing ? '分析中...' : 'AIで総括レポート作成'}
                            </Button>
                        </div>
                    </div>

                    {/* AIレポート表示エリア */}
                    {aiReport && (
                        <Card className="border-2 border-purple-200 bg-purple-50/50 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-purple-700 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" /> AI総括レポート
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-white/60 p-4 rounded-lg border border-purple-100">
                                    {aiReport}
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <FileText className="w-4 h-4 mr-2 text-purple-600" />
                                        マニュアル作成案を生成
                                    </Button>
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <ChevronRight className="w-4 h-4 mr-2 text-purple-600" />
                                        翌日のタスクを割り当て
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>ワーカー別 報告一覧</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-[150px]">ワーカー名</TableHead>
                                            <TableHead>勤務時間</TableHead>
                                            <TableHead>完了 / 全体</TableHead>
                                            <TableHead>獲得寸志</TableHead>
                                            <TableHead>写真</TableHead>
                                            <TableHead className="w-[30%]">報告メモ / ヒヤリハット</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {DAILY_SUMMARIES.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-bold text-slate-900">{row.name}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{row.time}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {row.status === 'completed' ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">全完了</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">一部実行</Badge>
                                                        )}
                                                        <span className="text-xs font-mono">{row.checkedCount}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-yellow-700">¥ {row.reward.toLocaleString()}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {row.hasPhoto ? (
                                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                                                            <Camera className="w-4 h-4 mr-1" />
                                                            確認(2)
                                                        </Button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {row.isSafetyAlert && (
                                                            <div className="flex items-center text-xs font-bold text-red-500 bg-red-50 p-1 rounded border border-red-100 mb-1">
                                                                <AlertTriangle className="w-3 h-3 mr-1" /> ヒヤリハット報告あり
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                                                            "{row.memo}"
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">詳細</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
