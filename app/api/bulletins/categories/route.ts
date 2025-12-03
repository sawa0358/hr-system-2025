import { NextRequest, NextResponse } from "next/server"

import {
  ensureCanManageAnnouncements,
  ensureDefaultBulletinCategories,
  normalizeCategoryColor,
} from "@/lib/bulletin-service"
import { prisma } from "@/lib/prisma"

const CATEGORY_ORDER = [{ createdAt: "asc" } as const, { name: "asc" } as const]

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

export async function GET() {
  try {
    await ensureDefaultBulletinCategories()
    const categories = await prisma.bulletinCategory.findMany({
      orderBy: CATEGORY_ORDER,
    })

    return NextResponse.json({
      categories: categories.map(serializeCategory),
    })
  } catch (error) {
    return buildErrorResponse(error, "カテゴリの取得に失敗しました")
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await ensureCanManageAnnouncements(request.headers.get("x-employee-id"))
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const body = await request.json()
    const name: string | undefined = body?.name?.trim()
    const color = normalizeCategoryColor(body?.color)

    if (!name) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 })
    }

    const category = await prisma.bulletinCategory.create({
      data: {
        name,
        color,
      },
    })

    return NextResponse.json({ category: serializeCategory(category) }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 409 })
    }
    return buildErrorResponse(error, "カテゴリの作成に失敗しました")
  }
}









