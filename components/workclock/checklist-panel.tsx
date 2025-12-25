'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react'

// モックデータ: チェックリスト項目の定義
const MOCK_CHECKLIST_ITEMS = [
    { id: '1', title: '玄関の施錠確認', reward: 0, isMandatory: true, category: 'security' },
    { id: '2', title: '機材の電源OFF', reward: 0, isMandatory: true, category: 'security' },
    { id: '3', title: 'フィルター清掃実施', reward: 500, isMandatory: false, category: 'maintenance' },
    { id: '4', title: '備品の在庫補充', reward: 300, isMandatory: false, category: 'maintenance' },
    { id: '5', title: '日報の丁寧な記入', reward: 200, isMandatory: false, category: 'admin' },
    { id: '6', title: 'ゴミ出し', reward: 100, isMandatory: false, category: 'cleaning' },
]

export function ChecklistPanel() {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [reportText, setReportText] = useState('')

    const handleToggle = (id: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    // 合計獲得寸志の計算
    const currentRewardTotal = MOCK_CHECKLIST_ITEMS.reduce((total, item) => {
        return total + (checkedItems[item.id] ? item.reward : 0)
    }, 0)

    // 必須項目が全てチェックされているか
    const pendingMandatoryItems = MOCK_CHECKLIST_ITEMS.filter(item => item.isMandatory && !checkedItems[item.id])
    const isAllMandatoryChecked = pendingMandatoryItems.length === 0

    return (
        <div className="flex flex-col h-full space-y-4">

            {/* 上部ステータスバー */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-2xl">💰</span> 本日の獲得予定寸志
                    </h3>
                    <p className="text-sm text-slate-500">全ての業務を完了してボーナスを獲得しましょう</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-mono text-2xl font-bold ${currentRewardTotal > 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-slate-200 text-slate-400'}`}>
                        ¥ {currentRewardTotal.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">

                {/* 左カラム: チェックリスト */}
                <Card className="flex flex-col h-full overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center justify-between">
                            業務チェック項目
                            {!isAllMandatoryChecked && (
                                <Badge variant="destructive" className="animate-pulse">
                                    必須項目が未完了です
                                </Badge>
                            )}
                            {isAllMandatoryChecked && (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> 必須完了
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            本日の業務内容を確認し、チェックを行ってください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                        <ScrollArea className="flex-1 w-full px-6">
                            <div className="space-y-4 py-4">
                                {MOCK_CHECKLIST_ITEMS.map(item => (
                                    <div key={item.id}
                                        className={`flex items-start justify-between p-3 rounded-lg border transition-all duration-200 
                                ${checkedItems[item.id] ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}
                                ${item.isMandatory && !checkedItems[item.id] ? 'border-l-4 border-l-red-400' : ''}
                                `}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <Switch
                                                id={`item-${item.id}`}
                                                checked={!!checkedItems[item.id]}
                                                onCheckedChange={() => handleToggle(item.id)}
                                            />
                                            <div className="grid gap-1">
                                                <Label
                                                    htmlFor={`item-${item.id}`}
                                                    className={`text-base font-medium cursor-pointer ${checkedItems[item.id] ? 'text-blue-800' : 'text-slate-700'}`}
                                                >
                                                    {item.title}
                                                </Label>
                                                <div className="flex gap-2">
                                                    {item.isMandatory && (
                                                        <span className="text-xs font-bold text-red-500 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-0.5" /> 必須
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {item.reward > 0 && (
                                            <Badge variant="secondary" className={`ml-2 whitespace-nowrap ${checkedItems[item.id] ? 'bg-yellow-200 text-yellow-800' : 'bg-slate-100 text-slate-500'}`}>
                                                + ¥{item.reward}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* 追加ボタン（仮） */}
                        <div className="p-4 border-t bg-slate-50 text-center">
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                                + 項目を追加（管理者のみ）
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 右カラム: 写真報告 & メモ */}
                <div className="flex flex-col gap-6 h-full overflow-hidden">
                    {/* 写真アップロード */}
                    <Card className="flex-1 shadow-sm h-[200px] flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">現場写真・報告</CardTitle>
                            <CardDescription>
                                不具合箇所や実施報告があれば写真を添付してください。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group h-full">
                                <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">写真を撮影 / アップロード</p>
                                <p className="text-xs text-slate-400 mt-1">またはここにファイルをドロップ</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 報告メモ */}
                    <Card className="flex-[1.5] shadow-sm flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center justify-between">
                                業務報告メモ
                                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">AI分析対象</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <Textarea
                                placeholder="ヒヤリハット、特記事項、明日の担当者への申し送りなど..."
                                className="h-full resize-none text-base"
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 mt-2 text-right">
                                入力内容はAIが解析し、日報として管理者に送信されます。
                            </p>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
