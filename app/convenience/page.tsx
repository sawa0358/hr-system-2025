"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, LinkIcon, Folder, FolderOpen, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type UtilityLink = {
  id: string
  title: string
  urls: string[]
  note: string
}

type UtilityCategory = {
  id: string
  name: string
  links: UtilityLink[]
}

type LinkEditorState =
  | {
      mode: "create"
      categoryId: string
      title: string
      urls: string[]
      note: string
    }
  | {
      mode: "edit"
      categoryId: string
      linkId: string
      title: string
      urls: string[]
      note: string
    }
  | null

const initialCategories: UtilityCategory[] = [
  {
    id: "cat-1",
    name: "よく使うリンク",
    links: [
      {
        id: "link-1",
        title: "社内ポータル",
        urls: ["https://portal.company.com"],
        note: "",
      },
      {
        id: "link-2",
        title: "勤怠システム",
        urls: ["https://attendance.company.com"],
        note: "毎日の出退勤を記録",
      },
    ],
  },
  {
    id: "cat-2",
    name: "手順メモ",
    links: [
      {
        id: "link-3",
        title: "新入社員登録手順",
        urls: ["https://docs.company.com/onboarding"],
        note: [
          "1. 基本情報を入力",
          "2. 所属部署を選択",
          "3. アクセス権限を設定",
          "参考: https://docs.company.com/onboarding",
        ].join("\n"),
      },
    ],
  },
]

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export default function ConveniencePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<UtilityCategory[]>(initialCategories)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryDraftName, setCategoryDraftName] = useState("")
  const [linkEditor, setLinkEditor] = useState<LinkEditorState>(null)
  const [selectedLink, setSelectedLink] = useState<{ categoryName: string; link: UtilityLink } | null>(null)

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return

    const next: UtilityCategory = {
      id: generateId("cat"),
      name: newCategoryName.trim(),
      links: [],
    }

    setCategories((prev) => [...prev, next])
    setNewCategoryName("")
    setIsAddingCategory(false)
  }

  const handleUpdateCategory = (categoryId: string) => {
    if (!categoryDraftName.trim()) {
      setEditingCategoryId(null)
      return
    }

    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, name: categoryDraftName.trim() } : category,
      ),
    )
    setEditingCategoryId(null)
    setCategoryDraftName("")
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId))

    if (linkEditor && linkEditor.categoryId === categoryId) {
      setLinkEditor(null)
    }
  }

  const handleOpenLinkEditor = (params: LinkEditorState) => {
    if (params.mode === "create") {
      setLinkEditor({
        ...params,
        urls: params.urls && params.urls.length > 0 ? params.urls : [""],
      })
      return
    }

    setLinkEditor({
      ...params,
      urls: params.urls && params.urls.length > 0 ? params.urls : [""],
    })
  }

  const handleCommitLink = () => {
    if (!linkEditor) return
    if (!linkEditor.title.trim()) return

    const sanitizedUrls = linkEditor.urls
      .map((url) => url.trim())
      .filter((url, index, arr) => url.length > 0 && arr.indexOf(url) === index)

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== linkEditor.categoryId) return category

        if (linkEditor.mode === "create") {
          const newLink: UtilityLink = {
            id: generateId("link"),
            title: linkEditor.title.trim(),
            urls: sanitizedUrls.length > 0 ? sanitizedUrls : [""],
            note: linkEditor.note,
          }
          return { ...category, links: [...category.links, newLink] }
        }

        return {
          ...category,
          links: category.links.map((link) =>
            link.id === linkEditor.linkId
              ? {
                  ...link,
                  title: linkEditor.title.trim(),
                  urls: sanitizedUrls.length > 0 ? sanitizedUrls : [""],
                  note: linkEditor.note,
                }
              : link,
          ),
        }
      }),
    )

    setLinkEditor(null)
  }

  const handleDeleteLink = (categoryId: string, linkId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, links: category.links.filter((link) => link.id !== linkId) }
          : category,
      ),
    )

    if (linkEditor?.mode === "edit" && linkEditor.linkId === linkId) {
      setLinkEditor(null)
    }
  }

  const activeCategoryForEditor =
    linkEditor && categories.find((category) => category.id === linkEditor.categoryId)

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
                <Button type="button" onClick={handleCreateCategory}>
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
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">カテゴリを追加</span>
            </Button>
          )}
        </section>

        <div className="flex flex-col gap-5">
          {categories.length === 0 && (
            <div className="rounded-2xl border border-teal-300 bg-white/70 p-6 text-center text-slate-600">
              まだカテゴリがありません。「カテゴリを追加」から作成を始めましょう。
            </div>
          )}

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
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setCategoryDraftName("")
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button type="button" size="sm" onClick={() => handleUpdateCategory(category.id)}>
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
                          onClick={() =>
                            handleOpenLinkEditor({
                              mode: "create",
                              categoryId: category.id,
                              title: "",
                              urls: [""],
                              note: "",
                            })
                          }
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
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </>
                    )}
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
                                  key={`${linkEditor.linkId}-${index}`}
                                  value={url}
                                  onChange={(e) =>
                                    setLinkEditor({
                                      ...linkEditor,
                                      urls: linkEditor.urls.map((prevUrl, idx) =>
                                        idx === index ? e.target.value : prevUrl,
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
                                    urls: [...linkEditor.urls, ""],
                                  })
                                }
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
                            <Button type="button" onClick={handleCommitLink}>
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
                                {link.urls.filter((url) => url.trim().length > 0).length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {link.urls
                                      .filter((url) => url.trim().length > 0)
                                      .map((url, index) => (
                                        <a
                                          key={`${link.id}-url-${index}`}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700"
                                        >
                                          {url}
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
                                  onClick={() =>
                                    handleOpenLinkEditor({
                                      mode: "edit",
                                      categoryId: category.id,
                                      linkId: link.id,
                                      title: link.title,
                                      urls: link.urls.length > 0 ? link.urls : [""],
                                      note: link.note,
                                    })
                                  }
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
                              value={url}
                              onChange={(e) =>
                                setLinkEditor({
                                  ...(linkEditor ?? {
                                    mode: "create",
                                    categoryId: category.id,
                                    title: "",
                                    urls: [""],
                                    note: "",
                                  }),
                                  urls: (linkEditor?.urls ?? [""]).map((prevUrl, idx) =>
                                    idx === index ? e.target.value : prevUrl,
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
                                  urls: [""],
                                  note: "",
                                }),
                                urls: [...(linkEditor?.urls ?? [""]), ""],
                              })
                            }
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
                                urls: [""],
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
                        <Button type="button" onClick={handleCommitLink}>
                          追加する
                        </Button>
                      </div>
                    </div>
                  )}

                  {category.links.length === 0 && !hasActiveEditor && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenLinkEditor({
                          mode: "create",
                          categoryId: category.id,
                          title: "",
                          urls: [""],
                          note: "",
                        })
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
                {selectedLink.link.urls.filter((url) => url.trim().length > 0).length > 0 && (
                  <div className="flex flex-col gap-2">
                    {selectedLink.link.urls
                      .filter((url) => url.trim().length > 0)
                      .map((url, index) => (
                        <a
                          key={`${selectedLink.link.id}-modal-url-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {url}
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

