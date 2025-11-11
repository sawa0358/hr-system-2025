"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, LinkIcon, Folder, FolderOpen, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
}

type UtilityCategory = {
  id: string
  name: string
  links: UtilityLink[]
  position: number
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
    }
  | {
      mode: "edit"
      categoryId: string
      linkId: string
      title: string
      urls: EditorUrlItem[]
      note: string
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryDraftName, setCategoryDraftName] = useState("")
  const [linkEditor, setLinkEditor] = useState<LinkEditorState>(null)
  const [selectedLink, setSelectedLink] = useState<{ categoryName: string; link: UtilityLink } | null>(null)
  const permissions = useMemo(() => (currentUser?.role ? getPermissions(currentUser.role) : null), [currentUser?.role])
  const canManage = !!permissions?.manageConvenience

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
        links:
          category.entries?.map((entry: any) => ({
            id: entry.id,
            title: entry.title,
            note: entry.note,
            position: entry.position ?? 0,
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
          .sort((a, b) => a.position - b.position)
          .map((cat) => ({
            ...cat,
            links: cat.links
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
    if (!canManage || !currentUser?.id) return
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
      setIsAddingCategory(false)
    } catch (error) {
      console.error("[convenience] create category failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "カテゴリの作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (categoryId: string) => {
    if (!canManage || !currentUser?.id) return
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
    } catch (error) {
      console.error("[convenience] update category failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "カテゴリの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!canManage || !currentUser?.id) return

    setIsSubmitting(true)
    setErrorMessage(null)
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
      if (linkEditor && linkEditor.categoryId === categoryId) {
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
    if (!canManage) return
    setLinkEditor({
      mode: "create",
      categoryId,
      title: "",
      urls: [{ value: "" }],
      note: "",
    })
  }

  const openLinkEditorForEdit = (categoryId: string, link: UtilityLink) => {
    if (!canManage) return
    setLinkEditor({
      mode: "edit",
      categoryId,
      linkId: link.id,
      title: link.title,
      note: link.note ?? "",
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
    if (!linkEditor || !canManage || !currentUser?.id) return
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

  const handleDeleteLink = async (categoryId: string, linkId: string) => {
    if (!canManage || !currentUser?.id) return

    setIsSubmitting(true)
    setErrorMessage(null)
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
      if (linkEditor?.mode === "edit" && linkEditor.linkId === linkId) {
        setLinkEditor(null)
      }
      if (selectedLink?.link.id === linkId) {
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
      <div className="min-h-screen bg-gradient-to-br from-teal-200 via-teal-100 to-teal-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-teal-300 bg-teal-200/70 p-6 shadow-xl backdrop-blur">
          <header className="flex items-start justify-between gap-4">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-teal-700/80">
              Productivity Toolkit
            </span>
            <h1 className="mt-1 text-3xl font-bold text-teal-900">便利機能</h1>
            <p className="mt-2 text-sm text-slate-600">
              よく使うリンクや手順メモをまとめておくことで、日々の業務をスムーズに進められます。
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full border border-transparent text-teal-700 hover:border-teal-400 hover:bg-teal-100/80"
          >
            <X className="h-5 w-5" />
          </Button>
          </header>

          {canManage && (
            <section className="rounded-2xl border border-dashed border-teal-400/70 bg-teal-100/60 p-4">
            {isAddingCategory ? (
              <div className="flex flex-col gap-3 rounded-xl border border-teal-300 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-teal-600" />
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="カテゴリ名を入力"
                    className="flex-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCategoryName("")
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
                variant="ghost"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-teal-300/70 bg-teal-50/70 text-teal-700 hover:bg-teal-100"
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
              <div className="rounded-2xl border border-teal-300 bg-white/70 p-6 text-center text-slate-600">
                読み込み中です...
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border border-teal-300 bg-white/70 p-6 text-center text-slate-600">
                まだカテゴリがありません。{canManage ? "「カテゴリを追加」から作成を始めましょう。" : "管理者にカテゴリの追加を依頼してください。"}
              </div>
            ) : (
              <>
                {categories.map((category) => {
                  const isEditing = editingCategoryId === category.id
                  const hasActiveEditor = linkEditor && linkEditor.categoryId === category.id

                  return (
                    <section
                key={category.id}
                className="rounded-2xl border border-teal-300/80 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <header className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 items-center gap-3">
                    <Folder className="h-5 w-5 text-teal-600" />
                    {isEditing ? (
                      <Input
                        value={categoryDraftName}
                        onChange={(e) => setCategoryDraftName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <h2 className="text-lg font-semibold text-teal-900">{category.name}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setCategoryDraftName("")
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
                          onClick={() => handleDeleteCategory(category.id)}
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
                        className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                            <LinkIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div
                                role="button"
                                tabIndex={0}
                                className="flex-1 cursor-pointer select-none text-left outline-none"
                                onClick={() => setSelectedLink({ categoryName: category.name, link })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    setSelectedLink({ categoryName: category.name, link })
                                  }
                                }}
                              >
                                <h3 className="text-base font-semibold text-slate-900">{link.title}</h3>
                                {link.urls.filter((url) => url.url.trim().length > 0).length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {link.urls
                                      .filter((url) => url.url.trim().length > 0)
                                      .map((url, index) => (
                                        <a
                                          key={`${link.id}-url-${url.id ?? index}`}
                                          href={url.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700"
                                        >
                                          {url.url}
                                        </a>
                                      ))}
                                  </div>
                                )}
                                {link.note && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 line-clamp-3">
                                    {link.note}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
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
                                  onClick={() => handleDeleteLink(category.id, link.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
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
                              }),
                              note: e.target.value,
                            })
                          }
                          placeholder="メモを入力"
                          rows={4}
                        />
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

                  {canManage && category.links.length === 0 && !hasActiveEditor && (
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
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-slate-900">{selectedLink.link.title}</DialogTitle>
                {selectedLink.categoryName && (
                  <DialogDescription className="text-sm font-medium text-teal-700">
                    {selectedLink.categoryName}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-4">
                {selectedLink.link.urls.filter((url) => url.url.trim().length > 0).length > 0 && (
                  <div className="flex flex-col gap-2">
                    {selectedLink.link.urls
                      .filter((url) => url.url.trim().length > 0)
                      .map((url, index) => (
                        <a
                          key={`${selectedLink.link.id}-modal-url-${url.id ?? index}`}
                          href={url.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {url.url}
                        </a>
                      ))}
                  </div>
                )}
                {selectedLink.link.note && (
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700 shadow-inner">
                    {selectedLink.link.note.split("\n").map((line, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

