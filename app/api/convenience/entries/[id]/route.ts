import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import {
  ConvenienceUrlInput,
  ensureManagePermission,
  resolveConvenienceUser,
  serializeConvenienceEntry,
  softDeleteConvenienceEntry,
  updateConvenienceEntry,
} from "@/lib/convenience-service"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-employee-id")
    const resolved = ensureManagePermission(await resolveConvenienceUser(userId))

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
    }

    const payload: {
      title?: string
      note?: string | null
      position?: number
      isArchived?: boolean
      isAdminOnly?: boolean
      categoryId?: string
      urls?: ConvenienceUrlInput[]
    } = {}

    if ("title" in body) {
      if (typeof body.title !== "string") {
        return NextResponse.json({ error: "タイトルは文字列で指定してください" }, { status: 400 })
      }
      payload.title = body.title
    }

    if ("note" in body) {
      if (body.note !== null && typeof body.note !== "string") {
        return NextResponse.json({ error: "メモは文字列か null を指定してください" }, { status: 400 })
      }
      payload.note = body.note
    }

    if ("position" in body) {
      if (typeof body.position !== "number" || Number.isNaN(body.position)) {
        return NextResponse.json({ error: "position は数値で指定してください" }, { status: 400 })
      }
      payload.position = body.position
    }

    if ("isArchived" in body) {
      if (typeof body.isArchived !== "boolean") {
        return NextResponse.json({ error: "isArchived は真偽値で指定してください" }, { status: 400 })
      }
      payload.isArchived = body.isArchived
    }

    if ("isAdminOnly" in body) {
      if (typeof body.isAdminOnly !== "boolean") {
        return NextResponse.json({ error: "isAdminOnly は真偽値で指定してください" }, { status: 400 })
      }
      payload.isAdminOnly = body.isAdminOnly
    }

    if ("categoryId" in body) {
      if (typeof body.categoryId !== "string" || !body.categoryId.trim()) {
        return NextResponse.json({ error: "categoryId は文字列で指定してください" }, { status: 400 })
      }
      payload.categoryId = body.categoryId.trim()
    }

    if ("urls" in body) {
      if (!Array.isArray(body.urls)) {
        return NextResponse.json({ error: "urls は配列で指定してください" }, { status: 400 })
      }

      const urls: ConvenienceUrlInput[] = []
      for (const item of body.urls) {
        if (!item || typeof item !== "object") {
          return NextResponse.json({ error: "urls の要素が不正です" }, { status: 400 })
        }

        const url = typeof item.url === "string" ? item.url.trim() : ""
        if (!url && !item._delete) {
          return NextResponse.json({ error: "url は必須です" }, { status: 400 })
        }

        urls.push({
          id: typeof item.id === "string" ? item.id : undefined,
          url,
          description: typeof item.description === "string" ? item.description : null,
          position: typeof item.position === "number" ? item.position : undefined,
          _delete: Boolean(item._delete),
        })
      }

      payload.urls = urls
    }

    try {
      const entry = await updateConvenienceEntry(params.id, payload, resolved.user.id)
      return NextResponse.json({ entry: serializeConvenienceEntry(entry) })
    } catch (error) {
      if (error instanceof Error && (error.message === "タイトルは必須です" || error.message === "更新対象のフィールドがありません")) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "対象のリンクカードが見つかりません" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("[convenience] PATCH /entries/:id failed:", error)
    return NextResponse.json({ error: "リンクカードの更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-employee-id")
    const resolved = ensureManagePermission(await resolveConvenienceUser(userId))

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status })
    }

    try {
      await softDeleteConvenienceEntry(params.id, resolved.user.id)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "対象のリンクカードが見つかりません" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("[convenience] DELETE /entries/:id failed:", error)
    return NextResponse.json({ error: "リンクカードの削除に失敗しました" }, { status: 500 })
  }
}

