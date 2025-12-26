'use client'

import { useState, useEffect } from 'react'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, CheckCircle2, Coins, Settings, Layout, Copy, Menu, GripVertical, ArrowUpToLine, ArrowUp, ArrowDown, ArrowDownToLine } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { getWorkers } from '@/lib/workclock/api-storage'
import { Worker, ChecklistPattern, ChecklistItem } from '@/lib/workclock/types'
import { api } from '@/lib/workclock/api'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

export default function ChecklistSettingsPage() {
    const { currentUser } = useAuth()
    const [patterns, setPatterns] = useState<ChecklistPattern[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // ダイアログ状態: パターン作成用
    const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false)
    const [newPatternName, setNewPatternName] = useState('')

    const [workers, setWorkers] = useState<Worker[]>([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isMobile = useIsMobile()

    useEffect(() => {
        if (currentUser?.id) {
            getWorkers(currentUser.id).then(setWorkers)
            fetchPatterns()
        }
    }, [currentUser])

    const fetchPatterns = async () => {
        try {
            setIsLoading(true)
            const res = await api.checklist.patterns.getAll(true) as { patterns: ChecklistPattern[] }
            // itemsをposition順にソートしておく
            const sortedPatterns = res.patterns.map(p => ({
                ...p,
                items: p.items ? [...p.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []
            }))
            setPatterns(sortedPatterns)
            if (sortedPatterns.length > 0 && !selectedPatternId) {
                setSelectedPatternId(sortedPatterns[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch patterns:', error)
        } finally {
            setIsLoading(false)
        }
    }

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

    // ダイアログ状態: 項目編集用
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [itemFormData, setItemFormData] = useState({
        title: '',
        reward: '0',
        isMandatory: false,
        isFreeText: false,
        category: 'general'
    })

    const selectedPattern = patterns.find(p => p.id === selectedPatternId) || patterns[0] || { id: '', name: '', items: [] }

    const handleMoveItem = async (itemId: string, direction: 'top' | 'up' | 'down' | 'bottom') => {
        if (!selectedPatternId) return

        setPatterns(prev => prev.map(pattern => {
            if (pattern.id !== selectedPatternId || !pattern.items) return pattern

            const items = [...pattern.items]
            const currentIndex = items.findIndex(i => i.id === itemId)
            if (currentIndex === -1) return pattern

            let newIndex = currentIndex
            switch (direction) {
                case 'top': newIndex = 0; break;
                case 'up': newIndex = Math.max(0, currentIndex - 1); break;
                case 'down': newIndex = Math.min(items.length - 1, currentIndex + 1); break;
                case 'bottom': newIndex = items.length - 1; break;
            }

            if (newIndex === currentIndex) return pattern

            // 入替え
            const [movedItem] = items.splice(currentIndex, 1)
            items.splice(newIndex, 0, movedItem)

            // API保存
            const itemIds = items.map(i => i.id)
            api.checklist.patterns.reorder(selectedPatternId, itemIds).catch(console.error)

            return { ...pattern, items }
        }))
    }

    const handleAddPattern = async () => {
        if (!newPatternName) return
        try {
            const res = await api.checklist.patterns.create(newPatternName) as { pattern: ChecklistPattern }
            const newPattern = { ...res.pattern, items: [] }
            setPatterns([...patterns, newPattern])
            setSelectedPatternId(newPattern.id)
            setNewPatternName('')
            setIsPatternDialogOpen(false)
        } catch (error) {
            alert('パターンの作成に失敗しました')
        }
    }

    const handleDuplicatePattern = async () => {
        const patternToCopy = patterns.find(p => p.id === selectedPatternId)
        if (!patternToCopy) return
        try {
            const res = await api.checklist.patterns.create(`${patternToCopy.name} (コピー)`) as { pattern: ChecklistPattern }
            const newPattern = res.pattern

            // 項目もコピー
            if (patternToCopy.items && patternToCopy.items.length > 0) {
                // 同じ順序で作成
                const sortedItems = [...patternToCopy.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                for (const item of sortedItems) {
                    await api.checklist.items.create(newPattern.id, {
                        title: item.title,
                        reward: item.reward,
                        isMandatory: item.isMandatory,
                        category: item.category,
                        position: item.position
                    })
                }
            }

            fetchPatterns() // 全体再取得が確実
            setSelectedPatternId(newPattern.id)
        } catch (error) {
            alert('パターンの複製に失敗しました')
        }
    }

    const handleDeletePattern = async () => {
        if (!selectedPatternId || patterns.length <= 1) {
            alert('最後の1つのパターンは削除できません。')
            return
        }
        if (confirm(`パターン「${selectedPattern.name}」を削除してもよろしいですか？`)) {
            try {
                await api.checklist.patterns.delete(selectedPatternId)
                const newPatterns = patterns.filter(p => p.id !== selectedPatternId)
                setPatterns(newPatterns)
                setSelectedPatternId(newPatterns[0].id)
            } catch (error) {
                alert('パターンの削除に失敗しました')
            }
        }
    }

    const handleOpenItemDialog = (item?: any, isFreeText = false) => {
        if (item) {
            setEditingItem(item)
            setItemFormData({
                title: item.title,
                reward: String(item.reward),
                isMandatory: item.isMandatory,
                isFreeText: item.isFreeText || false,
                category: item.category
            })
        } else {
            setEditingItem(null)
            setItemFormData({ title: '', reward: '0', isMandatory: false, isFreeText, category: 'general' })
        }
        setIsItemDialogOpen(true)
    }

    const handleSaveItem = async () => {
        if (!itemFormData.title || !selectedPatternId) return

        try {
            if (editingItem) {
                await api.checklist.items.update(editingItem.id, {
                    title: itemFormData.title,
                    reward: Number(itemFormData.reward),
                    isMandatory: itemFormData.isMandatory,
                    isFreeText: itemFormData.isFreeText,
                    category: itemFormData.category
                })
            } else {
                await api.checklist.items.create(selectedPatternId, {
                    title: itemFormData.title,
                    reward: Number(itemFormData.reward),
                    isMandatory: itemFormData.isMandatory,
                    isFreeText: itemFormData.isFreeText,
                    category: itemFormData.category,
                    position: (selectedPattern.items?.length || 0)
                })
            }
            fetchPatterns()
            setIsItemDialogOpen(false)
        } catch (error) {
            alert('項目の保存に失敗しました')
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (confirm('この項目を削除してもよろしいですか？')) {
            try {
                await api.checklist.items.delete(itemId)
                fetchPatterns()
            } catch (error) {
                alert('項目の削除に失敗しました')
            }
        }
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
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">業務チェック設定</h1>
                            <p className="text-slate-500">パターンの作成と各項目の寸志（インセンティブ）を設定します</p>
                        </div>
                        <div className="bg-white border p-3 rounded-xl shadow-sm flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Items</span>
                                <span className="text-2xl font-black text-slate-700 leading-none">{selectedPattern.items?.length || 0}</span>
                            </div>
                            <div className="w-[1px] h-8 bg-slate-100 mx-2" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mandatory</span>
                                <span className="text-2xl font-black text-red-500 leading-none">{selectedPattern.items?.filter((i: any) => i.isMandatory).length || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* パターン選択エリア */}
                    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
                        <div className="flex items-center gap-2 mr-4">
                            <Layout className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">編集中のパターン:</span>
                        </div>
                        <Select value={selectedPatternId || ''} onValueChange={setSelectedPatternId}>
                            <SelectTrigger className="w-[280px] h-10 font-bold bg-slate-50 border-slate-200">
                                <SelectValue placeholder="パターンを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {patterns.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="font-medium">
                                        {p.name} ({p._count?.items || p.items?.length || 0}項目)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 border-l pl-4 ml-auto">
                            <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9">
                                        <Plus className="w-4 h-4 mr-2" /> 新規作成
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>新しいパターンの作成</DialogTitle>
                                        <DialogDescription>
                                            パターン名を入力してください（例: 早番清掃、閉店作業など）
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label htmlFor="patternName">パターン名</Label>
                                        <Input
                                            id="patternName"
                                            value={newPatternName}
                                            onChange={(e) => setNewPatternName(e.target.value)}
                                            placeholder="例: 早番メンテナンス"
                                            className="mt-2"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsPatternDialogOpen(false)}>キャンセル</Button>
                                        <Button onClick={handleAddPattern} className="bg-blue-600">作成する</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" onClick={handleDuplicatePattern} className="h-9">
                                <Copy className="w-4 h-4 mr-2" /> 複製
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleDeletePattern} className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" /> 削除
                            </Button>
                        </div>
                    </div>

                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                            <div>
                                <CardTitle className="text-lg">「{selectedPattern.name}」のチェック項目一覧</CardTitle>
                                <CardDescription>このパターンを割り当てられたワーカーに表示されます。</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => handleOpenItemDialog(undefined, true)} variant="outline" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
                                    <Plus className="w-4 h-4 mr-2" />
                                    自由欄追加
                                </Button>
                                <Button onClick={() => handleOpenItemDialog()} className="bg-slate-900 hover:bg-slate-800">
                                    <Plus className="w-4 h-4 mr-2" />
                                    項目を追加
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white hover:bg-white border-0">
                                        <TableHead className="w-12 pl-4"></TableHead>
                                        <TableHead className="">項目名</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>寸志金額</TableHead>
                                        <TableHead className="text-right pr-6">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                                                読み込み中...
                                            </TableCell>
                                        </TableRow>
                                    ) : selectedPattern.items && selectedPattern.items.length > 0 ? (
                                        selectedPattern.items.map((item, index) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 group bg-white">
                                                <TableCell className="pl-4 py-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors outline-none">
                                                                <GripVertical className="w-5 h-5" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            <DropdownMenuItem onClick={() => handleMoveItem(item.id, 'top')} disabled={index === 0}>
                                                                <ArrowUpToLine className="w-4 h-4 mr-2 opacity-50" /> 最上へ移動
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleMoveItem(item.id, 'up')} disabled={index === 0}>
                                                                <ArrowUp className="w-4 h-4 mr-2 opacity-50" /> 上へ移動
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleMoveItem(item.id, 'down')} disabled={index === (selectedPattern.items?.length || 0) - 1}>
                                                                <ArrowDown className="w-4 h-4 mr-2 opacity-50" /> 下へ移動
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleMoveItem(item.id, 'bottom')} disabled={index === (selectedPattern.items?.length || 0) - 1}>
                                                                <ArrowDownToLine className="w-4 h-4 mr-2 opacity-50" /> 最下へ移動
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-700">{item.title}</span>
                                                        <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.isFreeText ? (
                                                        <Badge className="bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-50 shadow-none font-bold text-[10px]">自由欄</Badge>
                                                    ) : item.isMandatory ? (
                                                        <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 shadow-none font-bold text-[10px]">必須</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 shadow-none font-bold text-[10px]">任意</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.reward > 0 ? (
                                                        <span className="font-mono font-bold text-yellow-700 tracking-tight">¥{item.reward.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-slate-300 font-mono">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenItemDialog(item)}>
                                                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                                                項目が登録されていません。右上のボタンから追加してください。
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {itemFormData.isFreeText ? '自由記入欄を追加' : (editingItem ? '項目の編集' : '新しい項目を追加')}
                        </DialogTitle>
                        <DialogDescription>
                            {itemFormData.isFreeText
                                ? 'ワーカーが自由にテキストを入力できる欄を追加します。'
                                : 'チェック項目の内容と、達成時の寸志を設定します。'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="title" className="text-xs font-bold text-slate-500">
                                {itemFormData.isFreeText ? '記入欄のタイトル' : '項目名'}
                            </Label>
                            <Input
                                id="title"
                                value={itemFormData.title}
                                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                                placeholder={itemFormData.isFreeText ? "例: 特記事項・申し送り" : "例: フィルター清掃実施"}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="reward" className="text-xs font-bold text-slate-500">寸志金額 (円)</Label>
                            <Input
                                id="reward"
                                type="number"
                                value={itemFormData.reward}
                                onChange={(e) => setItemFormData({ ...itemFormData, reward: e.target.value })}
                            />
                        </div>
                        {!itemFormData.isFreeText && (
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-xl bg-slate-50">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isMandatory" className="text-sm font-bold">必須項目にする</Label>
                                    <p className="text-[10px] text-slate-400">未チェック時に保存を防止します</p>
                                </div>
                                <Switch
                                    id="isMandatory"
                                    checked={itemFormData.isMandatory}
                                    onCheckedChange={(checked) => setItemFormData({ ...itemFormData, isMandatory: checked })}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsItemDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSaveItem} className="bg-blue-600">保存する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
