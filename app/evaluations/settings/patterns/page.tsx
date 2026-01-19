"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Copy, Trash2, Edit, Save, ArrowLeft, CheckSquare, Camera, MessageCircle, Type } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Mock data
const INITIAL_PATTERNS = [
    {
        id: 'p1',
        name: '一般社員用チェックリスト',
        description: '日々の業務報告用',
        itemsCount: 5,
        lastUpdated: '2025-01-15'
    },
    {
        id: 'p2',
        name: '店長用チェックリスト',
        description: '店舗管理・運営報告用',
        itemsCount: 8,
        lastUpdated: '2025-01-14'
    }
]

export default function PatternSettingsPage() {
    const [patterns, setPatterns] = useState(INITIAL_PATTERNS)
    const [editingPattern, setEditingPattern] = useState<any>(null)

    const handleCreate = () => {
        const newPattern = {
            id: `new-${Date.now()}`,
            name: '新規パターン',
            description: '',
            itemsCount: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
        }
        setPatterns([...patterns, newPattern])
        setEditingPattern(newPattern)
    }

    const handleDelete = (id: string) => {
        if (confirm('このパターンを削除してもよろしいですか？')) {
            setPatterns(patterns.filter(p => p.id !== id))
            if (editingPattern?.id === id) setEditingPattern(null)
        }
    }

    const handleDuplicate = (pattern: any) => {
        const newPattern = {
            ...pattern,
            id: `copy-${Date.now()}`,
            name: `${pattern.name}のコピー`,
            lastUpdated: new Date().toISOString().split('T')[0]
        }
        setPatterns([...patterns, newPattern])
    }

    if (editingPattern) {
        return (
            <PatternEditor
                pattern={editingPattern}
                onSave={() => setEditingPattern(null)}
                onCancel={() => setEditingPattern(null)}
            />
        )
    }

    return (
        <div className="container mx-auto p-8 max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/evaluations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">評価チェック設定</h1>
                        <p className="text-slate-500">評価パターンの作成・編集を行います</p>
                    </div>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新規作成
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patterns.map((pattern) => (
                    <Card key={pattern.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{pattern.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); setEditingPattern(pattern); }}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-green-600" onClick={(e) => { e.stopPropagation(); handleDuplicate(pattern); }}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(pattern.id); }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                {pattern.description || '説明なし'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">
                                    {pattern.itemsCount} 項目
                                </Badge>
                                <span>最終更新: {pattern.lastUpdated}</span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600"
                                onClick={() => setEditingPattern(pattern)}
                            >
                                編集する
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function PatternEditor({ pattern, onSave, onCancel }: { pattern: any, onSave: () => void, onCancel: () => void }) {
    // Mock items
    const [items, setItems] = useState([
        { id: '1', title: '制服着用', type: 'checkbox', points: 10, mandatory: true },
        { id: '2', title: '笑顔での挨拶', type: 'checkbox', points: 5, mandatory: true },
        { id: '3', title: '売場写真', type: 'photo', points: 0, mandatory: false },
        { id: '4', title: '本日の振り返り', type: 'text', points: 0, mandatory: false },
    ])

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{pattern.name} の編集</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>キャンセル</Button>
                    <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        保存して終了
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8">
                {/* Settings Panel */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>基本設定</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>パターン名</Label>
                                <Input defaultValue={pattern.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>説明</Label>
                                <Input defaultValue={pattern.description} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>項目追加</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">チェック項目</div>
                                    <div className="text-[10px] text-slate-500">達成/未達成</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">自由記述</div>
                                    <div className="text-[10px] text-slate-500">テキスト入力</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                                <Type className="w-4 h-4 text-slate-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">説明文</div>
                                    <div className="text-[10px] text-slate-500">ガイド表示</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                                <Camera className="w-4 h-4 text-purple-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">写真</div>
                                    <div className="text-[10px] text-slate-500">画像アップロード</div>
                                </div>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Preview/Edit */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <span>チェックリスト項目</span>
                        <Badge variant="outline">{items.length}</Badge>
                    </h3>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <Card key={item.id} className="relative group border-slate-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-400 transition-colors rounded-l-md" />
                                <CardContent className="p-4 pl-6 flex items-start gap-4">
                                    <div className="mt-1">
                                        {item.type === 'checkbox' && <CheckSquare className="w-5 h-5 text-blue-500" />}
                                        {item.type === 'text' && <MessageCircle className="w-5 h-5 text-green-500" />}
                                        {item.type === 'photo' && <Camera className="w-5 h-5 text-purple-500" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Input defaultValue={item.title} className="font-bold border-transparent hover:border-slate-200 focus:border-blue-500 p-0 h-auto text-base" />
                                            {item.mandatory && <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-red-100">必須</Badge>}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            {item.type === 'checkbox' && (
                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded">
                                                    <span className="text-xs font-bold text-slate-400">獲得pt:</span>
                                                    <Input type="number" defaultValue={item.points} className="w-16 h-6 text-right" />
                                                    <span className="text-xs">pt</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
