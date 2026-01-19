"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Copy, Trash2, Edit, Save, ArrowLeft, CheckSquare, Camera, MessageCircle, Type } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Mock data
// ... imports unchanged

export default function PatternSettingsPage() {
    const [patterns, setPatterns] = useState<any[]>([])
    const [editingPattern, setEditingPattern] = useState<any>(null)

    // Load patterns
    const fetchPatterns = async () => {
        try {
            const res = await fetch('/api/evaluations/settings/patterns')
            if (res.ok) {
                const data = await res.json()
                setPatterns(data)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchPatterns()
    }, [])

    const handleCreate = () => {
        const newPattern = {
            id: `new-${Date.now()}`,
            name: '新規パターン',
            description: '',
            itemsCount: 0,
            lastUpdated: new Date().toISOString().split('T')[0] // UI only
        }
        // UI上だけで追加し、保存時に確定
        setPatterns([newPattern, ...patterns])
        setEditingPattern(newPattern)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('このパターンを削除してもよろしいですか？')) return

        if (id.startsWith('new-')) {
            setPatterns(patterns.filter(p => p.id !== id))
            if (editingPattern?.id === id) setEditingPattern(null)
            return
        }

        try {
            const res = await fetch(`/api/evaluations/settings/patterns?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setPatterns(patterns.filter(p => p.id !== id))
                if (editingPattern?.id === id) setEditingPattern(null)
            } else {
                alert('削除に失敗しました')
            }
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        }
    }

    const handleDuplicate = async (pattern: any) => {
        // 複製ロジック: サーバー側でやるかクライアントでやるか。
        // ここでは詳細データを持っていないので、詳細を取得してから新規作成として保存するか、
        // あるいは単に「コピー」という名前でクライアント側で作って、編集画面でSAVEさせる。
        // 編集画面を開く際、IDが`copy-`なら元IDからfetchして...というロジックが必要になる。
        // 簡易実装: クライアント側で枠だけ作る。詳細は編集時に元IDからコピー...は複雑なので
        // 「詳細を開いてから保存」が良いが、ここでは枠だけコピー。
        // 実用的には backend に duplicate endpoint があると良いが、
        // 今回は「新規作成」と同じ扱いで、編集画面に入ったら中身が空... だと不便。
        // TODO: Detailed implementation. For now just standard Create.
        handleCreate()
    }

    // ... render details ...
    if (editingPattern) {
        return (
            <PatternEditor
                pattern={editingPattern}
                onSave={async () => {
                    await fetchPatterns()
                    setEditingPattern(null)
                }}
                onCancel={() => {
                    if (editingPattern.id.startsWith('new-')) {
                        // 保存せずキャンセルならリストから消す
                        setPatterns(patterns.filter(p => p.id !== editingPattern.id))
                    }
                    setEditingPattern(null)
                }}
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
                {patterns.length === 0 && <div className="p-4 text-slate-500">パターンがありません</div>}
                {patterns.map((pattern) => (
                    <Card key={pattern.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{pattern.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); setEditingPattern(pattern); }}>
                                        <Edit className="w-4 h-4" />
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
                                    {pattern.itemsCount || 0} 項目
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
    const [name, setName] = useState(pattern.name)
    const [description, setDescription] = useState(pattern.description)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // 新規でなければ詳細を取得
        if (pattern.id && !pattern.id.startsWith('new-')) {
            setLoading(true)
            fetch(`/api/evaluations/settings/patterns?id=${pattern.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.items) {
                        setItems(data.items)
                    }
                    setLoading(false)
                })
                .catch(e => {
                    console.error(e)
                    setLoading(false)
                })
        }
    }, [pattern.id])

    const handleSave = async () => {
        try {
            const payload = {
                id: pattern.id,
                name,
                description,
                items
            }
            const res = await fetch('/api/evaluations/settings/patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('Save failed')
            onSave()
        } catch (e) {
            alert('保存に失敗しました')
        }
    }

    const addItem = (type: string) => {
        const newItem = {
            id: `temp-${Date.now()}`,
            title: type === 'checkbox' ? '新規項目' : (type === 'text' ? '振り返り' : type === 'photo' ? '写真' : '説明文'),
            description: '',
            type,
            points: type === 'checkbox' ? 10 : 0,
            mandatory: false
        }
        setItems([...items, newItem])
    }

    const updateItem = (index: number, changes: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], ...changes }
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{name} の編集</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>キャンセル</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
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
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>説明</Label>
                                <Input value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>項目追加</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            {/* ... Buttons unchanged except onClick handlers ... */}
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => addItem('checkbox')}>
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">チェック項目</div>
                                    <div className="text-[10px] text-slate-500">達成/未達成</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => addItem('text')}>
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">自由記述</div>
                                    <div className="text-[10px] text-slate-500">テキスト入力</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => addItem('description')}>
                                <Type className="w-4 h-4 text-slate-500" />
                                <div className="text-left">
                                    <div className="font-bold text-xs">説明文</div>
                                    <div className="text-[10px] text-slate-500">ガイド表示</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start gap-2 h-auto py-3" onClick={() => addItem('photo')}>
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
                        {loading && <span className="text-xs text-slate-400">Loading...</span>}
                    </h3>

                    <div className="space-y-3">
                        {items.length === 0 && <div className="text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">項目がありません。左のパネルから追加してください。</div>}
                        {items.map((item, index) => (
                            <Card key={item.id} className="p-4 bg-white border border-slate-200 shadow-none rounded-xl transition-all hover:border-indigo-200 hover:shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* アイコン */}
                                        <div className="mt-2.5">
                                            {item.type === 'checkbox' && <CheckSquare className="w-5 h-5 text-indigo-500" />}
                                            {item.type === 'text' && <MessageCircle className="w-5 h-5 text-emerald-500" />}
                                            {item.type === 'photo' && <Camera className="w-5 h-5 text-purple-500" />}
                                            {item.type === 'description' && <Type className="w-5 h-5 text-slate-400" />}
                                        </div>
                                        {/* タイトル & コンテンツ */}
                                        <div className="flex-1 space-y-3">
                                            <Input
                                                value={item.title}
                                                onChange={e => updateItem(index, { title: e.target.value })}
                                                className="font-bold border-transparent hover:border-slate-200 focus:border-indigo-500 px-2 py-1 h-auto text-base w-full bg-transparent transition-colors placeholder:text-slate-300"
                                                placeholder="項目名を入力"
                                            />
                                            <Input
                                                value={item.description || ''}
                                                onChange={e => updateItem(index, { description: e.target.value })}
                                                className="border-transparent hover:border-slate-200 focus:border-indigo-500 px-2 py-0.5 h-auto text-xs w-full bg-transparent transition-colors text-slate-500 placeholder:text-slate-300"
                                                placeholder="補足説明（考課入力時に項目名の横に表示されます）"
                                            />

                                            {/* 獲得pt (Checkboxのみ) */}
                                            {item.type === 'checkbox' && (
                                                <div className="flex items-center gap-2 px-2">
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">獲得pt:</span>
                                                    <div className="relative group/pt">
                                                        <Input
                                                            type="number"
                                                            value={item.points}
                                                            onChange={e => updateItem(index, { points: e.target.value })}
                                                            className="w-20 h-9 pl-3 pr-8 text-center bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm font-bold shadow-sm"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold group-focus-within/pt:text-indigo-500 transition-colors">pt</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 右側アクション */}
                                    <div className="flex items-center gap-2 pl-4">
                                        <div
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => updateItem(index, { mandatory: !item.mandatory })}
                                        >
                                            {item.mandatory
                                                ? <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 px-2.5 py-0.5 rounded-full font-bold">必須</Badge>
                                                : <Badge variant="outline" className="text-slate-300 border-slate-200 bg-white px-2.5 py-0.5 rounded-full font-bold hover:text-slate-400 hover:border-slate-300">任意</Badge>
                                            }
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
