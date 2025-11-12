import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import {
  ensureManagePermission,
  resolveConvenienceUser,
  serializeConvenienceCategory,
  softDeleteConvenienceCategory,
  updateConvenienceCategory,
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
      name?: string
      position?: number
      isArchived?: boolean
      isAdminOnly?: boolean
      tenantId?: string | null
    } = {}

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return NextResponse.json({ error: "名称は文字列で指定してください" }, { status: 400 })
      }
      payload.name = body.name
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

    if ("tenantId" in body) {
      if (body.tenantId === null) {
        payload.tenantId = null
      } else if (typeof body.tenantId === "string") {
        payload.tenantId = body.tenantId.trim() || null
      } else {
        return NextResponse.json({ error: "tenantId は文字列または null を指定してください" }, { status: 400 })
      }
    }

    try {
      const category = await updateConvenienceCategory(params.id, payload, resolved.user.id)
      return NextResponse.json({ category: serializeConvenienceCategory(category) })
    } catch (error) {
      if (error instanceof Error && error.message === "名称は必須です") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error instanceof Error && error.message === "更新対象のフィールドがありません") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "対象のカテゴリが見つかりません" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("[convenience] PATCH /categories/:id failed:", error)
    return NextResponse.json({ error: "カテゴリの更新に失敗しました" }, { status: 500 })
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
      await softDeleteConvenienceCategory(params.id, resolved.user.id)
      return NextResponse.json({ success: true })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "対象のカテゴリが見つかりません" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("[convenience] DELETE /categories/:id failed:", error)
    return NextResponse.json({ error: "カテゴリの削除に失敗しました" }, { status: 500 })
  }
}

