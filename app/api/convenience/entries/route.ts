import { NextRequest, NextResponse } from "next/server"
import {
  ConvenienceUrlInput,
  createConvenienceEntry,
  ensureManagePermission,
  resolveConvenienceUser,
  serializeConvenienceEntry,
} from "@/lib/convenience-service"

export async function POST(request: NextRequest) {
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

    const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : ""
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const note = typeof body.note === "string" ? body.note : null
    const position = typeof body.position === "number" ? body.position : undefined
    const isArchived = typeof body.isArchived === "boolean" ? body.isArchived : false

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId は必須です" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
    }

    let urls: ConvenienceUrlInput[] | undefined
    if ("urls" in body) {
      if (!Array.isArray(body.urls)) {
        return NextResponse.json({ error: "urls は配列で指定してください" }, { status: 400 })
      }

      urls = body.urls.map((item: any) => {
        if (!item || typeof item !== "object") {
          throw new Error("urls の要素が不正です")
        }
        if (typeof item.url !== "string" || !item.url.trim()) {
          throw new Error("url は必須です")
        }

        return {
          id: typeof item.id === "string" ? item.id : undefined,
          url: item.url.trim(),
          description: typeof item.description === "string" ? item.description : null,
          position: typeof item.position === "number" ? item.position : undefined,
          _delete: Boolean(item._delete),
        }
      })
    }

    try {
      const entry = await createConvenienceEntry(
        {
          categoryId,
          title,
          note,
          position,
          isArchived,
          urls,
        },
        resolved.user.id,
      )

      return NextResponse.json({ entry: serializeConvenienceEntry(entry) }, { status: 201 })
    } catch (error) {
      if (error instanceof Error && error.message === "指定されたカテゴリが存在しません") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === "urls の要素が不正です") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && error.message === "url は必須です") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[convenience] POST /entries failed:", error)
    return NextResponse.json({ error: "リンクカードの作成に失敗しました" }, { status: 500 })
  }
}

