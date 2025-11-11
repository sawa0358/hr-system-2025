import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import {
  ensureManagePermission,
  reorderConvenienceItems,
  resolveConvenienceUser,
} from "@/lib/convenience-service"

type ReorderPayload = {
  id: string
  position: number
}

function validateReorderArray(value: unknown, label: string): ReorderPayload[] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} は配列で指定してください`)
  }

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${label} の要素が不正です`)
    }

    const id = typeof item.id === "string" ? item.id.trim() : ""
    if (!id) {
      throw new Error(`${label} の要素に id がありません`)
    }

    if (typeof item.position !== "number" || Number.isNaN(item.position)) {
      throw new Error(`${label} の要素に position がありません`)
    }

    return {
      id,
      position: item.position,
    }
  })
}

export async function PATCH(request: NextRequest) {
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

    let categories: ReorderPayload[] | undefined
    let entries: ReorderPayload[] | undefined
    let urls: ReorderPayload[] | undefined

    try {
      categories = validateReorderArray(body.categories, "categories")
      entries = validateReorderArray(body.entries, "entries")
      urls = validateReorderArray(body.urls, "urls")
    } catch (validationError) {
      if (validationError instanceof Error) {
        return NextResponse.json({ error: validationError.message }, { status: 400 })
      }
      throw validationError
    }

    if (
      (!categories || categories.length === 0) &&
      (!entries || entries.length === 0) &&
      (!urls || urls.length === 0)
    ) {
      return NextResponse.json({ error: "更新対象がありません" }, { status: 400 })
    }

    try {
      await reorderConvenienceItems({ categories, entries, urls })
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Error && error.message === "更新対象がありません") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "指定された項目が見つかりません" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("[convenience] PATCH /positions failed:", error)
    return NextResponse.json({ error: "並び順の更新に失敗しました" }, { status: 500 })
  }
}

