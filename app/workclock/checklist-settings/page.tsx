'use client'

import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, CheckCircle2, Coins, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'

// モックデータ (初期状態)
const INITIAL_MASTER_ITEMS = [
    { id: '1', title: '玄関の施錠確認', reward: 0, isMandatory: true, category: 'security', isActive: true },
    { id: '2', title: '機材の電源OFF', reward: 0, isMandatory: true, category: 'security', isActive: true },
    { id: '3', title: 'フィルター清掃実施', reward: 500, isMandatory: false, category: 'maintenance', isActive: true },
    { id: '4', title: '備品の在庫補充', reward: 300, isMandatory: false, category: 'maintenance', isActive: true },
    { id: '5', title: '日報の丁寧な記入', reward: 200, isMandatory: false, category: 'admin', isActive: true },
]

export default function ChecklistSettingsPage() {
    const { currentUser } = useAuth()
    const [items, setItems] = useState(INITIAL_MASTER_ITEMS)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    const [formData, setFormData] = useState({
        title: '',
        reward: '0',
        isMandatory: false,
        category: 'general'
    })

    const handleOpenDialog = (item?: any) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                title: item.title,
                reward: String(item.reward),
                isMandatory: item.isMandatory,
                category: item.category
            })
        } else {
            setEditingItem(null)
            setFormData({ title: '', reward: '0', isMandatory: false, category: 'general' })
        }
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (!formData.title) return

        if (editingItem) {
            setItems(items.map(item => item.id === editingItem.id ? {
                ...item,
                title: formData.title,
                reward: Number(formData.reward),
                isMandatory: formData.isMandatory,
                category: formData.category
            } : item))
        } else {
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                title: formData.title,
                reward: Number(formData.reward),
                isMandatory: formData.isMandatory,
                category: formData.category,
                isActive: true
            }
            setItems([...items, newItem])
        }
        setIsDialogOpen(false)
    }

    const handleDelete = (id: string) => {
        if (confirm('この項目を削除してもよろしいですか？')) {
            setItems(items.filter(item => item.id !== id))
        }
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
                            <h1 className="text-3xl font-bold text-slate-900">業務チェック設定</h1>
                            <p className="text-slate-500">ワーカーに表示するチェック項目と寸志（インセンティブ）を設定します</p>
                        </div>
                        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            項目を追加
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> 必須項目
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{items.filter(i => i.isMandatory).length} 件</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-yellow-600 flex items-center">
                                    <Coins className="w-4 h-4 mr-2" /> 寸志対象項目
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{items.filter(i => i.reward > 0).length} 件</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                                    <Settings className="w-4 h-4 mr-2" /> 合計項目数
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{items.length} 件</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>チェック項目マスター</CardTitle>
                            <CardDescription>
                                ここで設定した項目が、ワーカーの勤務記録入力画面に「業務チェックリスト」として表示されます。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-[40%]">項目名</TableHead>
                                        <TableHead>タイプ</TableHead>
                                        <TableHead>寸志金額</TableHead>
                                        <TableHead>カテゴリー</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    {item.title}
                                                    {item.isMandatory && <span className="text-[10px] text-red-500 font-bold">REQUIRED</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.isMandatory ? (
                                                    <Badge variant="destructive">必須</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">任意</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.reward > 0 ? (
                                                    <span className="font-mono font-bold text-yellow-700">¥ {item.reward.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                                        <Pencil className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? '項目の編集' : '新しい項目を追加'}</DialogTitle>
                        <DialogDescription>
                            チェック項目の内容と、達成時のインセンティブ（寸志）を設定します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">項目名</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="例: フィルター清掃実施"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reward">寸志金額 (円)</Label>
                            <Input
                                id="reward"
                                type="number"
                                value={formData.reward}
                                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-500">※0円の場合はインセンティブなしになります。</p>
                        </div>
                        <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <Label htmlFor="isMandatory" className="text-base">必須項目にする</Label>
                                <p className="text-xs text-slate-500">チェックしないと保存できなくなります。</p>
                            </div>
                            <Switch
                                id="isMandatory"
                                checked={formData.isMandatory}
                                onCheckedChange={(checked) => setFormData({ ...formData, isMandatory: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">保存して保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
