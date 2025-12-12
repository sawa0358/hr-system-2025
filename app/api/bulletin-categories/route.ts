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

export async function GET() {
  const categories = await prisma.bulletinCategory.findMany({
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ categories: categories.map(mapCategory) })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const color = typeof body.color === "string" ? normalizeColor(body.color) : "secondary"

  if (!name) {
    return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 })
  }

  try {
    const category = await prisma.bulletinCategory.create({
      data: { name, color },
    })
    return NextResponse.json({ category: mapCategory(category) }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "同じ名前のカテゴリが既に存在します" }, { status: 409 })
    }
    throw error
  }
}














