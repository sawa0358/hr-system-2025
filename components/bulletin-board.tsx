"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Edit, Pin, Plus, Tag, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const CATEGORY_COLORS = ["default", "destructive", "secondary", "outline"] as const
const NONE_CATEGORY_VALUE = "__none__"

type CategoryColor = typeof CATEGORY_COLORS[number]

type Category = {
  id: string
  name: string
  color: CategoryColor
}

type Bulletin = {
  id: string
  title: string
  content: string
  publishedAt: string
  pinned: boolean
  categoryId: string | null
  categoryName: string | null
  categoryColor: CategoryColor
}

interface BulletinBoardProps {
  isAdmin?: boolean
}

interface BulletinFormData {
  title: string
  content: string
  categoryId: string
  pinned: boolean
}

interface CategoryFormData {
  name: string
  color: CategoryColor
}

const normalizeCategoryOption = (category: Category | null, fallbackName: string | null): { name: string; color: CategoryColor } => {
  if (category) {
    return { name: category.name, color: category.color }
  }
  return { name: fallbackName ?? "未分類", color: "secondary" }
}

export function BulletinBoard({ isAdmin = false }: BulletinBoardProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<BulletinFormData>({
    title: "",
    content: "",
    categoryId: NONE_CATEGORY_VALUE,
    pinned: false,
  })
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({ name: "", color: "secondary" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(
    async (options: { silently?: boolean } = {}) => {
      if (!options.silently) {
        setLoading(true)
      }
      try {
        setError(null)
        const response = await fetch("/api/bulletins", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch bulletins")
        }
        const data = await response.json()
        setCategories(data.categories ?? [])
        setBulletins(data.bulletins ?? [])
      } catch (err) {
        console.error(err)
        setError("お知らせの取得に失敗しました")
      } finally {
        if (!options.silently) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (categories.length > 0) {
      setFormData((prev) => {
        if (prev.categoryId !== NONE_CATEGORY_VALUE && categories.some((category) => category.id === prev.categoryId)) {
          return prev
        }
        return { ...prev, categoryId: categories[0].id }
      })
    } else {
      setFormData((prev) => ({ ...prev, categoryId: NONE_CATEGORY_VALUE }))
    }
  }, [categories])

  const isNewBulletin = useCallback((publishedAt: string) => {
    const bulletinDate = new Date(publishedAt)
    const diffTime = Date.now() - bulletinDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }, [])

  const bulletinList = useMemo(() => {
    return bulletins.map((bulletin) => {
      const category = categories.find((item) => item.id === bulletin.categoryId) ?? null
      const { name, color } = normalizeCategoryOption(category, bulletin.categoryName)
      return {
        ...bulletin,
        categoryName: name,
        categoryColor: color,
      }
    })
  }, [bulletins, categories])

  const resetBulletinForm = () => {
    setFormData({ title: "", content: "", categoryId: categories[0]?.id ?? NONE_CATEGORY_VALUE, pinned: false })
  }

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", color: "secondary" })
    setEditingCategory(null)
  }

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("タイトルと内容を入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/bulletins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          pinned: formData.pinned,
          categoryId: formData.categoryId === NONE_CATEGORY_VALUE ? null : formData.categoryId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "お知らせの追加に失敗しました")
      }

      await fetchData({ silently: true })
      setIsAddDialogOpen(false)
      resetBulletinForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "お知らせの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingBulletin) return
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("タイトルと内容を入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bulletins/${editingBulletin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          categoryId: formData.categoryId === NONE_CATEGORY_VALUE ? null : formData.categoryId,
          pinned: formData.pinned,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "お知らせの更新に失敗しました")
      }

      await fetchData({ silently: true })
      setIsEditDialogOpen(false)
      setEditingBulletin(null)
      resetBulletinForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "お知らせの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("このお知らせを削除してもよろしいですか？")) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bulletins/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "お知らせの削除に失敗しました")
      }
      await fetchData({ silently: true })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "お知らせの削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (bulletin: Bulletin) => {
    setEditingBulletin(bulletin)
    setFormData({
      title: bulletin.title,
      content: bulletin.content,
      categoryId: bulletin.categoryId ?? NONE_CATEGORY_VALUE,
      pinned: bulletin.pinned,
    })
    setIsEditDialogOpen(true)
  }

  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setError("カテゴリ名を入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/bulletin-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryFormData.name,
          color: categoryFormData.color,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "カテゴリの追加に失敗しました")
      }

      await fetchData({ silently: true })
      resetCategoryForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "カテゴリの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory) return
    if (!categoryFormData.name.trim()) {
      setError("カテゴリ名を入力してください")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bulletin-categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryFormData.name,
          color: categoryFormData.color,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "カテゴリの更新に失敗しました")
      }

      await fetchData({ silently: true })
      resetCategoryForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "カテゴリの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("このカテゴリを削除してもよろしいですか？")) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bulletin-categories/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "カテゴリの削除に失敗しました")
      }

      await fetchData({ silently: true })
      resetCategoryForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "カテゴリの削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({ name: category.name, color: category.color })
  }

  const renderBulletinList = () => {
    if (loading) {
      return <p className="text-sm text-slate-600">読み込み中です...</p>
    }

    if (error) {
      return <p className="text-sm text-red-600">{error}</p>
    }

    if (bulletinList.length === 0) {
      return <p className="text-sm text-slate-500">現在表示できるお知らせはありません。</p>
    }

    return (
      <div className="space-y-4">
        {bulletinList.map((bulletin) => (
          <div
            key={bulletin.id}
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors bg-white"
          >
            <div className="flex items-center justify-between mb-3 md:hidden">
              <Badge variant={bulletin.categoryColor} className="text-xs">
                {bulletin.categoryName}
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

            <div className="hidden md:flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                {bulletin.pinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />}
                <h3 className="font-semibold text-slate-900">{bulletin.title}</h3>
                {isAdmin && isNewBulletin(bulletin.publishedAt) && (
                  <Badge variant="default" className="bg-red-500 text-white text-xs">
                    NEW
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bulletin.categoryColor} className="text-xs">
                  {bulletin.categoryName}
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

            <div className="flex items-center gap-2 mb-2 md:hidden">
              {bulletin.pinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />}
              <h3 className="font-semibold text-slate-900 flex-1">{bulletin.title}</h3>
              {isAdmin && isNewBulletin(bulletin.publishedAt) && (
                <Badge variant="default" className="bg-red-500 text-white text-xs">
                  NEW
                </Badge>
              )}
            </div>

            <p className="text-sm text-slate-600 mb-3 leading-relaxed whitespace-pre-wrap break-words">
              {bulletin.content}
            </p>

            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(bulletin.publishedAt).toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          {isAdmin && (
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setIsCategoryDialogOpen(true)} size="sm" variant="outline" className="gap-2">
                <Tag className="w-4 h-4" />
                カテゴリ管理
              </Button>
              <Button
                onClick={() => {
                  resetBulletinForm()
                  setIsAddDialogOpen(true)
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                追加
              </Button>
            </div>
          )}
          <CardTitle className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-blue-600" />
            お知らせ
          </CardTitle>
        </CardHeader>
        <CardContent>{renderBulletinList()}</CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open)
        if (!open) {
          resetCategoryForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>カテゴリ管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新しいカテゴリを追加</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  value={categoryFormData.name}
                  onChange={(event) => setCategoryFormData({ ...categoryFormData, name: event.target.value })}
                  placeholder="カテゴリ名"
                  className="flex-1"
                />
                <Select
                  value={categoryFormData.color}
                  onValueChange={(value: CategoryColor) => setCategoryFormData({ ...categoryFormData, color: value })}
                >
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">青</SelectItem>
                    <SelectItem value="destructive">赤</SelectItem>
                    <SelectItem value="secondary">グレー</SelectItem>
                    <SelectItem value="outline">白</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    onClick={editingCategory ? handleEditCategory : handleAddCategory}
                    disabled={isSubmitting || !categoryFormData.name.trim()}
                  >
                    {editingCategory ? "更新" : "追加"}
                  </Button>
                  {editingCategory && (
                    <Button
                      variant="outline"
                      onClick={resetCategoryForm}
                      disabled={isSubmitting}
                    >
                      キャンセル
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>既存のカテゴリ</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.length === 0 && <p className="text-sm text-slate-500">カテゴリはまだ登録されていません。</p>}
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
                        disabled={isSubmitting}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          resetBulletinForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>お知らせを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タイトル</Label>
              <Input
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                placeholder="タイトルを入力"
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={formData.content}
                onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                placeholder="内容を入力"
                rows={6}
              />
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex-1 space-y-2">
                <Label>カテゴリ</Label>
                <Select
                  value={formData.categoryId ?? NONE_CATEGORY_VALUE}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value === NONE_CATEGORY_VALUE ? NONE_CATEGORY_VALUE : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY_VALUE}>未分類</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-8">
                <Checkbox
                  id="pinned"
                  checked={formData.pinned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, pinned: checked === true ? true : false })
                  }
                />
                <Label htmlFor="pinned">トップに固定</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingBulletin(null)
          resetBulletinForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>お知らせを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>タイトル</Label>
              <Input
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={formData.content}
                onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                rows={6}
              />
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex-1 space-y-2">
                <Label>カテゴリ</Label>
                <Select
                  value={formData.categoryId ?? NONE_CATEGORY_VALUE}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value === NONE_CATEGORY_VALUE ? NONE_CATEGORY_VALUE : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY_VALUE}>未分類</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-8">
                <Checkbox
                  id="edit-pinned"
                  checked={formData.pinned}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, pinned: checked === true ? true : false })
                  }
                />
                <Label htmlFor="edit-pinned">トップに固定</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
