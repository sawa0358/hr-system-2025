"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, LinkIcon, Folder, FolderOpen, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getPermissions } from "@/lib/permissions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type UtilityUrl = {
  id: string
  url: string
  description: string | null
  position: number
}

type UtilityLink = {
  id: string
  title: string
  urls: UtilityUrl[]
  note: string | null
  position: number
  isAdminOnly: boolean
}

type UtilityCategory = {
  id: string
  name: string
  links: UtilityLink[]
  position: number
  isAdminOnly: boolean
}

type EditorUrlItem = {
  id?: string
  value: string
}

type LinkEditorState =
  | {
      mode: "create"
      categoryId: string
      title: string
      urls: EditorUrlItem[]
      note: string
      isAdminOnly: boolean
    }
  | {
      mode: "edit"
      categoryId: string
      linkId: string
      title: string
      urls: EditorUrlItem[]
      note: string
      isAdminOnly: boolean
    }
  | null

export default function ConveniencePage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [categories, setCategories] = useState<UtilityCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIsAdminOnly, setNewCategoryIsAdminOnly] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryDraftName, setCategoryDraftName] = useState("")
  const [categoryDraftIsAdminOnly, setCategoryDraftIsAdminOnly] = useState(false)
  const [linkEditor, setLinkEditor] = useState<LinkEditorState>(null)
  const [selectedLink, setSelectedLink] = useState<{ categoryName: string; link: UtilityLink } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'link'; id: string; name: string } | null>(null)
  const permissions = useMemo(() => (currentUser?.role ? getPermissions(currentUser.role) : null), [currentUser?.role])
  const canManage = !!permissions?.manageConvenience
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  const fetchCategories = useCallback(async () => {
    if (!currentUser?.id) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/convenience", {
        headers: {
          "x-employee-id": currentUser.id,
        },
        cache: "no-store",
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("[convenience] fetchCategories error response:", { status: res.status, data })
        throw new Error(data?.error ?? "便利機能データの取得に失敗しました")
      }
      const data = await res.json()
      console.info("[convenience] fetchCategories success:", { status: res.status, categoryCount: data.categories?.length ?? 0 })
      const mapped: UtilityCategory[] = (data.categories ?? []).map((category: any) => ({
        id: category.id,
        name: category.name,
        position: category.position ?? 0,
        isAdminOnly: category.isAdminOnly ?? false,
        links:
          category.entries?.map((entry: any) => ({
            id: entry.id,
            title: entry.title,
            note: entry.note,
            position: entry.position ?? 0,
            isAdminOnly: entry.isAdminOnly ?? false,
            urls:
              entry.urls?.map((url: any) => ({
                id: url.id,
                url: url.url,
                description: url.description ?? null,
                position: url.position ?? 0,
              })) ?? [],
          })) ?? [],
      }))
      setCategories(
        mapped
          .filter((cat) => isAdminOrHR || !cat.isAdminOnly)
          .sort((a, b) => a.position - b.position)
          .map((cat) => ({
            ...cat,
            links: cat.links
              .filter((link) => isAdminOrHR || !link.isAdminOnly)
              .sort((a, b) => a.position - b.position)
              .map((link) => ({
                ...link,
                urls: link.urls.sort((a, b) => a.position - b.position),
              })),
          })),
      )
    } catch (error) {
      console.error("[convenience] fetchCategories failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "便利機能データの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) return
    fetchCategories()
  }, [currentUser?.id, fetchCategories])

  useEffect(() => {
    if (!selectedLink) return
    const exists = categories.some((category) =>
      category.links.some((link) => link.id === selectedLink.link.id),
    )
    if (!exists) {
      setSelectedLink(null)
    }
  }, [categories, selectedLink])

  const handleCreateCategory = async () => {
    if (!isAdminOrHR || !currentUser?.id) return
    if (!newCategoryName.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/convenience/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUser.id,
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          name: newCategoryName.trim(),
          position: categories.length,
          isAdminOnly: newCategoryIsAdminOnly,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("[convenience] create category error:", { status: res.status, data })
        throw new Error(data?.error ?? "カテゴリの作成に失敗しました")
      }
      const data = await res.json().catch(() => null)
      console.info("[convenience] create category success:", { status: res.status, data })

      await fetchCategories()
      setNewCategoryName("")
      setNewCategoryIsAdminOnly(false)
      setIsAddingCategory(false)
    } catch (error) {
      console.error("[convenience] create category failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "カテゴリの作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (categoryId: string) => {
    if (!isAdminOrHR || !currentUser?.id) return
    if (!categoryDraftName.trim()) {
      setEditingCategoryId(null)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/convenience/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUser.id,
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          name: categoryDraftName.trim(),
          isAdminOnly: categoryDraftIsAdminOnly,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("[convenience] update category error:", { status: res.status, data })
        throw new Error(data?.error ?? "カテゴリの更新に失敗しました")
      }
      const data = await res.json().catch(() => null)
      console.info("[convenience] update category success:", { status: res.status, data })

      await fetchCategories()
      setEditingCategoryId(null)
      setCategoryDraftName("")
      setCategoryDraftIsAdminOnly(false)
    } catch (error) {
      console.error("[convenience] update category failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "カテゴリの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDeleteCategory = (categoryId: string, categoryName: string) => {
    setDeleteTarget({ type: 'category', id: categoryId, name: categoryName })
  }

  const handleDeleteCategory = async () => {
    if (!deleteTarget || deleteTarget.type !== 'category' || !isAdminOrHR || !currentUser?.id) return
    const categoryId = deleteTarget.id

    setIsSubmitting(true)
    setErrorMessage(null)
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/convenience/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "x-employee-id": currentUser.id,
        },
        cache: "no-store",
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("[convenience] delete category error:", { status: res.status, data })
        throw new Error(data?.error ?? "カテゴリの削除に失敗しました")
      }
      const data = await res.json().catch(() => null)
      console.info("[convenience] delete category success:", { status: res.status, data })

      await fetchCategories()
      const deletedCategoryId = categoryId
      if (linkEditor && linkEditor.categoryId === deletedCategoryId) {
        setLinkEditor(null)
      }
      if (selectedLink?.link && selectedLink.link.id) {
        setSelectedLink(null)
      }
    } catch (error) {
      console.error("[convenience] delete category failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "カテゴリの削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openLinkEditorForCreate = (categoryId: string) => {
    if (!isAdminOrHR) return
    setLinkEditor({
      mode: "create",
      categoryId,
      title: "",
      urls: [{ value: "" }],
      note: "",
      isAdminOnly: false,
    })
  }

  const openLinkEditorForEdit = (categoryId: string, link: UtilityLink) => {
    if (!isAdminOrHR) return
    setLinkEditor({
      mode: "edit",
      categoryId,
      linkId: link.id,
      title: link.title,
      note: link.note ?? "",
      isAdminOnly: link.isAdminOnly ?? false,
      urls:
        link.urls.length > 0
          ? link.urls.map((item) => ({
              id: item.id,
              value: item.url,
            }))
          : [{ value: "" }],
    })
  }

  const handleCommitLink = async () => {
    if (!linkEditor || !isAdminOrHR || !currentUser?.id) return
    if (!linkEditor.title.trim()) return

    const sanitizedUrls = linkEditor.urls
      .map((url) => ({
        id: url.id,
        value: url.value.trim(),
      }))
      .filter((url, index, arr) => url.value.length > 0 && arr.findIndex((item) => item.value === url.value && item.id === url.id) === index)

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (linkEditor.mode === "create") {
        const res = await fetch("/api/convenience/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser.id,
          },
          cache: "no-store",
          credentials: "include",
          body: JSON.stringify({
            categoryId: linkEditor.categoryId,
            title: linkEditor.title.trim(),
            note: linkEditor.note.trim().length > 0 ? linkEditor.note : null,
            isAdminOnly: linkEditor.isAdminOnly,
            urls:
              sanitizedUrls.length > 0
                ? sanitizedUrls.map((item, index) => ({
                    url: item.value,
                    position: index,
                  }))
                : [],
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          console.error("[convenience] create entry error:", { status: res.status, data })
          throw new Error(data?.error ?? "リンクカードの作成に失敗しました")
        }
        const data = await res.json().catch(() => null)
        console.info("[convenience] create entry success:", { status: res.status, data })
      } else {
        const category = categories.find((cat) => cat.id === linkEditor.categoryId)
        const existingLink = category?.links.find((link) => link.id === linkEditor.linkId)
        const payloadUrls: any[] =
          sanitizedUrls.length > 0
            ? sanitizedUrls.map((item, index) => ({
                ...(item.id ? { id: item.id } : {}),
                url: item.value,
                position: index,
              }))
            : []

        if (existingLink) {
          for (const url of existingLink.urls) {
            const stillExists = sanitizedUrls.some((item) => item.id === url.id)
            if (!stillExists) {
              payloadUrls.push({
                id: url.id,
                url: url.url,
                _delete: true,
              })
            }
          }
        }

        const res = await fetch(`/api/convenience/entries/${linkEditor.linkId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-employee-id": currentUser.id,
          },
          cache: "no-store",
          credentials: "include",
          body: JSON.stringify({
            title: linkEditor.title.trim(),
            note: linkEditor.note.trim().length > 0 ? linkEditor.note : null,
            isAdminOnly: linkEditor.isAdminOnly,
            urls: payloadUrls,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          console.error("[convenience] update entry error:", { status: res.status, data })
          throw new Error(data?.error ?? "リンクカードの更新に失敗しました")
        }
        const data = await res.json().catch(() => null)
        console.info("[convenience] update entry success:", { status: res.status, data })
      }

      await fetchCategories()
      setLinkEditor(null)
    } catch (error) {
      console.error("[convenience] commit link failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "リンクカードの保存に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDeleteLink = (linkId: string, linkTitle: string) => {
    setDeleteTarget({ type: 'link', id: linkId, name: linkTitle })
  }

  const handleDeleteLink = async () => {
    if (!deleteTarget || deleteTarget.type !== 'link' || !isAdminOrHR || !currentUser?.id) return
    const linkId = deleteTarget.id

    setIsSubmitting(true)
    setErrorMessage(null)
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/convenience/entries/${linkId}`, {
        method: "DELETE",
        headers: {
          "x-employee-id": currentUser.id,
        },
        cache: "no-store",
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("[convenience] delete entry error:", { status: res.status, data })
        throw new Error(data?.error ?? "リンクカードの削除に失敗しました")
      }
      const data = await res.json().catch(() => null)
      console.info("[convenience] delete entry success:", { status: res.status, data })

      await fetchCategories()
      const deletedLinkId = linkId
      if (linkEditor?.mode === "edit" && linkEditor.linkId === deletedLinkId) {
        setLinkEditor(null)
      }
      if (selectedLink?.link.id === deletedLinkId) {
        setSelectedLink(null)
      }
    } catch (error) {
      console.error("[convenience] delete link failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "リンクカードの削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeCategoryForEditor =
    linkEditor && categories.find((category) => category.id === linkEditor.categoryId)

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teal-100 px-4 py-10 text-slate-600">
        ログイン情報を取得しています...
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">便利機能</h1>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
          </header>

          {isAdminOrHR && (
            <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            {isAddingCategory ? (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-slate-600" />
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="カテゴリ名を入力"
                    className="flex-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="new-category-admin-only"
                    checked={newCategoryIsAdminOnly}
                    onCheckedChange={setNewCategoryIsAdminOnly}
                  />
                  <Label htmlFor="new-category-admin-only" className="text-sm flex items-center gap-1 cursor-pointer">
                    <Lock className="h-4 w-4" />
                    総務・管理者のみ表示
                  </Label>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCategoryName("")
                      setNewCategoryIsAdminOnly(false)
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isSubmitting || !newCategoryName.trim()}
                  >
                    追加する
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="flex h-12 w-full items-center justify-center gap-2"
                onClick={() => setIsAddingCategory(true)}
                disabled={isSubmitting}
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">カテゴリを追加</span>
              </Button>
            )}
            </section>
          )}

          <div className="flex flex-col gap-5">
            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
                読み込み中です...
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
                まだカテゴリがありません。{isAdminOrHR ? "「カテゴリを追加」から作成を始めましょう。" : "管理者にカテゴリの追加を依頼してください。"}
              </div>
            ) : (
              <>
                {categories.map((category) => {
                  const isEditing = editingCategoryId === category.id
                  const hasActiveEditor = linkEditor && linkEditor.categoryId === category.id

                    return (
                      <section
                        key={category.id}
                        className="rounded-lg border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md"
                        style={{ backgroundColor: '#bddcd9' }}
                      >
                        <header className="mb-4 flex flex-wrap items-center gap-3">
                          <div className="flex flex-1 items-center gap-3">
                    <Folder className="h-5 w-5 text-slate-600" />
                    {isEditing ? (
                      <Input
                        value={categoryDraftName}
                        onChange={(e) => setCategoryDraftName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        {category.isAdminOnly && (
                          <Lock
                            className="h-4 w-4 flex-shrink-0"
                            style={{ color: "#ffc108", strokeWidth: 2.5 }}
                            aria-hidden="true"
                            title="総務・管理者のみ表示"
                          />
                        )}
                        <span>{category.name}</span>
                      </h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminOrHR && (isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setCategoryDraftName("")
                            setCategoryDraftIsAdminOnly(false)
                          }}
                          disabled={isSubmitting}
                        >
                          キャンセル
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleUpdateCategory(category.id)} disabled={isSubmitting}>
                          保存
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => openLinkEditorForCreate(category.id)}
                          disabled={isSubmitting}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditingCategoryId(category.id)
                            setCategoryDraftName(category.name)
                            setCategoryDraftIsAdminOnly(category.isAdminOnly ?? false)
                          }}
                          disabled={isSubmitting}
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-red-500 hover:text-red-600"
                          onClick={() => confirmDeleteCategory(category.id, category.name)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </>
                    ))}
                  </div>
                </header>

                <div className="space-y-3">
                  {category.links.map((link) => {
                    const isEditingLink =
                      linkEditor?.mode === "edit" &&
                      linkEditor.categoryId === category.id &&
                      linkEditor.linkId === link.id

                    if (isEditingLink && linkEditor) {
                      return (
                        <div
                          key={link.id}
                          className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm"
                        >
                          <div className="grid gap-3">
                            <Input
                              value={linkEditor.title}
                              onChange={(e) =>
                                setLinkEditor({
                                  ...linkEditor,
                                  title: e.target.value,
                                })
                              }
                              placeholder="タイトル"
                            />
                            <div className="space-y-2">
                              {linkEditor.urls.map((url, index) => (
                                <Input
                                  key={`${linkEditor.linkId ?? "create"}-${index}`}
                                  value={url.value}
                                  onChange={(e) =>
                                    setLinkEditor({
                                      ...linkEditor,
                                      urls: linkEditor.urls.map((prevUrl, idx) =>
                                        idx === index ? { ...prevUrl, value: e.target.value } : prevUrl,
                                      ),
                                    })
                                  }
                                  placeholder="https://example.com"
                                />
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() =>
                                  setLinkEditor({
                                    ...linkEditor,
                                    urls: [...linkEditor.urls, { value: "" }],
                                  })
                                }
                                disabled={isSubmitting}
                              >
                                <Plus className="h-4 w-4" />
                                URLを追加
                              </Button>
                            </div>
                            <Textarea
                              value={linkEditor.note}
                              onChange={(e) =>
                                setLinkEditor({
                                  ...linkEditor,
                                  note: e.target.value,
                                })
                              }
                              placeholder="メモを入力"
                              rows={4}
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                id="edit-link-admin-only"
                                checked={linkEditor.isAdminOnly}
                                onCheckedChange={(checked) =>
                                  setLinkEditor({
                                    ...linkEditor,
                                    isAdminOnly: checked,
                                  })
                                }
                              />
                              <Label htmlFor="edit-link-admin-only" className="text-sm flex items-center gap-1 cursor-pointer">
                                <Lock className="h-4 w-4" />
                                総務・管理者のみ表示
                              </Label>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setLinkEditor(null)}
                            >
                              キャンセル
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCommitLink}
                              disabled={isSubmitting || !linkEditor.title.trim()}
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <article
                        key={link.id}
                        className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm break-words overflow-hidden"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 break-words flex-1">
                              {link.isAdminOnly && (
                                <Lock
                                  className="h-4 w-4 flex-shrink-0"
                                  style={{ color: "#ffc108", strokeWidth: 2.5 }}
                                  aria-hidden="true"
                                  title="総務・管理者のみ表示"
                                />
                              )}
                              <span className="break-words">{link.title}</span>
                            </h3>
                            {isAdminOrHR && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => openLinkEditorForEdit(category.id, link)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => confirmDeleteLink(link.id, link.title)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer select-none text-left outline-none"
                            onClick={() => setSelectedLink({ categoryName: category.name, link })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setSelectedLink({ categoryName: category.name, link })
                              }
                            }}
                          >
                            {link.urls.filter((url) => url.url.trim().length > 0).length > 0 && (
                              <div className="flex flex-col gap-1 overflow-hidden">
                                {link.urls
                                  .filter((url) => url.url.trim().length > 0)
                                  .map((url, index) => (
                                    <a
                                      key={`${link.id}-url-${url.id ?? index}`}
                                      href={url.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="block text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 break-all overflow-hidden"
                                      style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                                    >
                                      {url.url}
                                    </a>
                                  ))}
                              </div>
                            )}
                            {link.note && (
                              <p 
                                className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 line-clamp-3 break-words overflow-hidden"
                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                              >
                                {link.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}

                  {hasActiveEditor && linkEditor?.mode === "create" && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4">
                      <div className="grid gap-3">
                        <Input
                          value={linkEditor.title}
                          onChange={(e) =>
                            setLinkEditor({
                              ...(linkEditor ?? { mode: "create", categoryId: category.id, title: "", url: "", note: "" }),
                              title: e.target.value,
                            })
                          }
                          placeholder="タイトル"
                          autoFocus
                        />
                        <div className="space-y-2">
                          {linkEditor.urls.map((url, index) => (
                            <Input
                              key={`create-${category.id}-${index}`}
                              value={url.value}
                              onChange={(e) =>
                                setLinkEditor({
                                  ...(linkEditor ?? {
                                    mode: "create",
                                    categoryId: category.id,
                                    title: "",
                                    urls: [{ value: "" }],
                                    note: "",
                                  }),
                                  urls: (linkEditor?.urls ?? [{ value: "" }]).map((prevUrl, idx) =>
                                    idx === index ? { ...prevUrl, value: e.target.value } : prevUrl,
                                  ),
                                })
                              }
                              placeholder="https://example.com"
                            />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() =>
                              setLinkEditor({
                                ...(linkEditor ?? {
                                  mode: "create",
                                  categoryId: category.id,
                                  title: "",
                                  urls: [{ value: "" }],
                                  note: "",
                                }),
                                urls: [...(linkEditor?.urls ?? [{ value: "" }]), { value: "" }],
                              })
                            }
                            disabled={isSubmitting}
                          >
                            <Plus className="h-4 w-4" />
                            URLを追加
                          </Button>
                        </div>
                        <Textarea
                          value={linkEditor.note}
                          onChange={(e) =>
                            setLinkEditor({
                              ...(linkEditor ?? {
                                mode: "create",
                                categoryId: category.id,
                                title: "",
                                urls: [{ value: "" }],
                                note: "",
                                isAdminOnly: false,
                              }),
                              note: e.target.value,
                            })
                          }
                          placeholder="メモを入力"
                          rows={4}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            id="create-link-admin-only"
                            checked={linkEditor.isAdminOnly}
                            onCheckedChange={(checked) =>
                              setLinkEditor({
                                ...(linkEditor ?? {
                                  mode: "create",
                                  categoryId: category.id,
                                  title: "",
                                  urls: [{ value: "" }],
                                  note: "",
                                  isAdminOnly: false,
                                }),
                                isAdminOnly: checked,
                              })
                            }
                          />
                          <Label htmlFor="create-link-admin-only" className="text-sm flex items-center gap-1 cursor-pointer">
                            <Lock className="h-4 w-4" />
                            総務・管理者のみ表示
                          </Label>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setLinkEditor(null)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCommitLink}
                          disabled={isSubmitting || !linkEditor.title.trim()}
                        >
                          追加する
                        </Button>
                      </div>
                    </div>
                  )}

                  {isAdminOrHR && category.links.length === 0 && !hasActiveEditor && (
                    <button
                      type="button"
                      onClick={() =>
                        openLinkEditorForCreate(category.id)
                      }
                      className={cn(
                        "flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 text-sm font-medium text-slate-500 transition hover:bg-white",
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      リンクやメモを追加
                    </button>
                  )}
                </div>
                    </section>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedLink)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLink(null)
          }
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-xl overflow-hidden">
          {selectedLink && (
            <div className="overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-slate-900 break-words">
                  <span className="flex items-center gap-2">
                    {selectedLink.link.isAdminOnly && (
                      <Lock
                        className="h-5 w-5"
                        style={{ color: "#ffc108" }}
                        aria-hidden="true"
                        title="総務・管理者のみ表示"
                      />
                    )}
                    <span className="break-words">{selectedLink.link.title}</span>
                  </span>
                </DialogTitle>
                {selectedLink.categoryName && (
                  <DialogDescription className="text-sm font-medium text-teal-700">
                    {selectedLink.categoryName}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-4 overflow-hidden">
                {selectedLink.link.urls.filter((url) => url.url.trim().length > 0).length > 0 && (
                  <div className="flex flex-col gap-2 overflow-hidden">
                    {selectedLink.link.urls
                      .filter((url) => url.url.trim().length > 0)
                      .map((url, index) => (
                        <a
                          key={`${selectedLink.link.id}-modal-url-${url.id ?? index}`}
                          href={url.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 break-all overflow-hidden"
                          style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                        >
                          <LinkIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="break-all overflow-hidden">{url.url}</span>
                        </a>
                      ))}
                  </div>
                )}
                {selectedLink.link.note && (
                  <div 
                    className="max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700 shadow-inner break-words"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {selectedLink.link.note.split("\n").map((line, index) => (
                      <p key={index} className="whitespace-pre-wrap break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'category' 
                ? `カテゴリ「${deleteTarget.name}」を削除してもよろしいですか？このカテゴリ内の全てのリンクも削除されます。`
                : `リンク「${deleteTarget?.name}」を削除してもよろしいですか？`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>いいえ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteTarget?.type === 'category') {
                  handleDeleteCategory()
                } else {
                  handleDeleteLink()
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              はい、削除します
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

