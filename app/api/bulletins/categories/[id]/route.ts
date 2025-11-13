import { NextRequest, NextResponse } from "next/server"

import {
  ensureCanManageAnnouncements,
  normalizeCategoryColor,
} from "@/lib/bulletin-service"
import { prisma } from "@/lib/prisma"

function serializeCategory(category: { id: string; name: string; color: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: category.id,
    name: category.name,
    color: normalizeCategoryColor(category.color),
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }
}

function buildErrorResponse(error: unknown, defaultMessage: string) {
  console.error(defaultMessage, error)
  const message = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = params?.id
    if (!categoryId) {
      return NextResponse.json({ error: "IDが指定されていません" }, { status: 400 })
    }

    const { error } = await ensureCanManageAnnouncements(request.headers.get("x-employee-id"))
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (typeof body?.name === "string") {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 })
      }
      updateData.name = name
    }

    if (Object.prototype.hasOwnProperty.call(body, "color")) {
      updateData.color = normalizeCategoryColor(body.color)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "更新する項目が指定されていません" }, { status: 400 })
    }

    const updated = await prisma.bulletinCategory.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json({ category: serializeCategory(updated) })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 })
    }
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 409 })
    }
    return buildErrorResponse(error, "カテゴリの更新に失敗しました")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryId = params?.id
    if (!categoryId) {
      return NextResponse.json({ error: "IDが指定されていません" }, { status: 400 })
    }

    const { error } = await ensureCanManageAnnouncements(request.headers.get("x-employee-id"))
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    await prisma.bulletinCategory.delete({ where: { id: categoryId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 })
    }
    return buildErrorResponse(error, "カテゴリの削除に失敗しました")
  }
}



