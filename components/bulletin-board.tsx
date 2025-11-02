"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pin, Calendar, Plus, Edit, Trash2, Tag } from "lucide-react"

interface Bulletin {
  id: number
  title: string
  content: string
  date: string
  category: string
  pinned: boolean
}

interface Category {
  id: number
  name: string
  color: "default" | "destructive" | "secondary" | "outline"
}

const initialBulletins: Bulletin[] = [
  {
    id: 1,
    title: "年末年始休暇のお知らせ",
    content: "12月29日から1月3日まで年末年始休暇となります。緊急連絡先は別途メールにてご案内いたします。",
    date: "2025-01-08",
    category: "重要",
    pinned: true,
  },
  {
    id: 2,
    title: "新人研修プログラムの開始について",
    content: "1月15日より新入社員向けの研修プログラムを開始します。各部署の担当者は準備をお願いします。",
    date: "2025-01-05",
    category: "人事",
    pinned: false,
  },
  {
    id: 3,
    title: "システムメンテナンスのお知らせ",
    content: "1月12日(日) 2:00-6:00の間、システムメンテナンスを実施します。この間、一部機能がご利用いただけません。",
    date: "2025-01-03",
    category: "システム",
    pinned: false,
  },
  {
    id: 4,
    title: "第4四半期の目標設定について",
    content: "各部署の目標設定を1月20日までに提出してください。評価面談は2月上旬を予定しています。",
    date: "2025-01-02",
    category: "評価",
    pinned: false,
  },
]

const initialCategories: Category[] = [
  { id: 1, name: "一般", color: "secondary" },
  { id: 2, name: "重要", color: "destructive" },
  { id: 3, name: "人事", color: "default" },
  { id: 4, name: "システム", color: "outline" },
  { id: 5, name: "評価", color: "secondary" },
]

interface BulletinBoardProps {
  isAdmin?: boolean
}

export function BulletinBoard({ isAdmin = false }: BulletinBoardProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>(initialBulletins)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    color: "secondary" as Category["color"],
  })
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "一般",
    pinned: false,
  })

  const isNewBulletin = (dateString: string) => {
    const bulletinDate = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - bulletinDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName)
    return category?.color || "secondary"
  }

  const handleAdd = () => {
    const newBulletin: Bulletin = {
      id: Math.max(...bulletins.map((b) => b.id)) + 1,
      title: formData.title,
      content: formData.content,
      date: new Date().toISOString().split("T")[0],
      category: formData.category,
      pinned: formData.pinned,
    }
    setBulletins([newBulletin, ...bulletins])
    setIsAddDialogOpen(false)
    setFormData({ title: "", content: "", category: "一般", pinned: false })
  }

  const handleEdit = () => {
    if (!editingBulletin) return
    setBulletins(
      bulletins.map((b) =>
        b.id === editingBulletin.id
          ? {
              ...b,
              title: formData.title,
              content: formData.content,
              category: formData.category,
              pinned: formData.pinned,
            }
          : b,
      ),
    )
    setIsEditDialogOpen(false)
    setEditingBulletin(null)
    setFormData({ title: "", content: "", category: "一般", pinned: false })
  }

  const handleDelete = (id: number) => {
    if (confirm("このお知らせを削除してもよろしいですか？")) {
      setBulletins(bulletins.filter((b) => b.id !== id))
    }
  }

  const openEditDialog = (bulletin: Bulletin) => {
    setEditingBulletin(bulletin)
    setFormData({
      title: bulletin.title,
      content: bulletin.content,
      category: bulletin.category,
      pinned: bulletin.pinned,
    })
    setIsEditDialogOpen(true)
  }

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: Math.max(...categories.map((c) => c.id)) + 1,
      name: categoryFormData.name,
      color: categoryFormData.color,
    }
    setCategories([...categories, newCategory])
    setCategoryFormData({ name: "", color: "secondary" })
  }

  const handleEditCategory = () => {
    if (!editingCategory) return
    setCategories(
      categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: categoryFormData.name,
              color: categoryFormData.color,
            }
          : c,
      ),
    )
    setEditingCategory(null)
    setCategoryFormData({ name: "", color: "secondary" })
  }

  const handleDeleteCategory = (id: number) => {
    if (confirm("このカテゴリを削除してもよろしいですか？")) {
      setCategories(categories.filter((c) => c.id !== id))
    }
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      color: category.color,
    })
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          {/* カテゴリ管理・追加ボタンを最上部に配置 */}
          {isAdmin && (
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setIsCategoryDialogOpen(true)} size="sm" variant="outline" className="gap-2">
                <Tag className="w-4 h-4" />
                カテゴリ管理
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                追加
              </Button>
            </div>
          )}
          {/* 次の段にお知らせタイトル */}
          <CardTitle className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-blue-600" />
            お知らせ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bulletins.map((bulletin) => (
              <div
                key={bulletin.id}
                className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors bg-white"
              >
                {/* スマホ: 一番上にカテゴリ・編集・削除アイコンを横並び */}
                <div className="flex items-center justify-between mb-3 md:hidden">
                  <Badge variant={getCategoryColor(bulletin.category)} className="text-xs">
                    {bulletin.category}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(bulletin)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(bulletin.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* PC: 通常のレイアウト（タイトルとカテゴリ・アイコンが横並び） */}
                <div className="hidden md:flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {bulletin.pinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />}
                    <h3 className="font-semibold text-slate-900">{bulletin.title}</h3>
                    {isAdmin && isNewBulletin(bulletin.date) && (
                      <Badge variant="default" className="bg-red-500 text-white text-xs">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getCategoryColor(bulletin.category)} className="text-xs">
                      {bulletin.category}
                    </Badge>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(bulletin)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(bulletin.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* タイトル（スマホ表示） */}
                <div className="flex items-center gap-2 mb-2 md:hidden">
                  {bulletin.pinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />}
                  <h3 className="font-semibold text-slate-900 flex-1">{bulletin.title}</h3>
                  {isAdmin && isNewBulletin(bulletin.date) && (
                    <Badge variant="default" className="bg-red-500 text-white text-xs">
                      NEW
                    </Badge>
                  )}
                </div>
                
                {/* 内容 */}
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{bulletin.content}</p>
                
                {/* 日付 */}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{bulletin.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>カテゴリ管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新しいカテゴリを追加</Label>
              <div className="flex gap-2">
                <Input
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="カテゴリ名"
                  className="flex-1"
                />
                <Select
                  value={categoryFormData.color}
                  onValueChange={(value: Category["color"]) =>
                    setCategoryFormData({ ...categoryFormData, color: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">青</SelectItem>
                    <SelectItem value="destructive">赤</SelectItem>
                    <SelectItem value="secondary">グレー</SelectItem>
                    <SelectItem value="outline">白</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={editingCategory ? handleEditCategory : handleAddCategory}
                  disabled={!categoryFormData.name}
                >
                  {editingCategory ? "更新" : "追加"}
                </Button>
                {editingCategory && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryFormData({ name: "", color: "secondary" })
                    }}
                  >
                    キャンセル
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>既存のカテゴリ</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={category.color}>{category.name}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditCategoryDialog(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCategoryDialogOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>お知らせを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="お知らせのタイトルを入力"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="お知らせの内容を入力"
                rows={4}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="pinned" className="cursor-pointer">
                ピン留めする
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAdd} disabled={!formData.title || !formData.content}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>お知らせを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">タイトル</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="お知らせのタイトルを入力"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">内容</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="お知らせの内容を入力"
                rows={4}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">カテゴリ</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-pinned"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="edit-pinned" className="cursor-pointer">
                ピン留めする
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEdit} disabled={!formData.title || !formData.content}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
