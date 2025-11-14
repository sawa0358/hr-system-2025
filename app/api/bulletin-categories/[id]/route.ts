import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

const CATEGORY_COLORS = ["default", "destructive", "secondary", "outline"] as const

type CategoryColor = typeof CATEGORY_COLORS[number]

const normalizeColor = (color?: string | null): CategoryColor => {
  if (color && CATEGORY_COLORS.includes(color as CategoryColor)) {
    return color as CategoryColor
  }
  return "secondary"
}

const mapCategory = (category: { id: string; name: string; color: string }) => ({
  id: category.id,
  name: category.name,
  color: normalizeColor(category.color),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const data: Prisma.BulletinCategoryUpdateInput = {}

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 })
    }
    data.name = name
  }

  if ("color" in body) {
    data.color = normalizeColor(body.color)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新対象のフィールドがありません" }, { status: 400 })
  }

  try {
    const category = await prisma.bulletinCategory.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({ category: mapCategory(category) })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象のカテゴリが見つかりません" }, { status: 404 })
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 409 })
      }
    }
    throw error
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.bulletinCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "対象のカテゴリが見つかりません" }, { status: 404 })
    }
    throw error
  }
}



