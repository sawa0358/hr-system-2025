import { NextRequest, NextResponse } from "next/server"
import {
  createConvenienceCategory,
  ensureManagePermission,
  resolveConvenienceUser,
  serializeConvenienceCategory,
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

    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 })
    }

    let tenantId: string | null | undefined = undefined
    if ("tenantId" in body) {
      if (body.tenantId === null) {
        tenantId = null
      } else if (typeof body.tenantId === "string") {
        tenantId = body.tenantId.trim() || null
      } else {
        return NextResponse.json({ error: "tenantId は文字列または null を指定してください" }, { status: 400 })
      }
    }

    const position = typeof body.position === "number" ? body.position : undefined
    const isArchived = typeof body.isArchived === "boolean" ? body.isArchived : false

    const category = await createConvenienceCategory({
      name,
      tenantId,
      position,
      isArchived,
      createdBy: resolved.user.id,
    })

    return NextResponse.json({ category: serializeConvenienceCategory(category) }, { status: 201 })
  } catch (error) {
    console.error("[convenience] POST /categories failed:", error)
    return NextResponse.json({ error: "カテゴリの作成に失敗しました" }, { status: 500 })
  }
}

