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

const mapBulletin = (bulletin: {
  id: string
  title: string
  content: string
  pinned: boolean
  publishedAt: Date
  categoryId: string | null
  category: { id: string; name: string; color: string } | null
}) => ({
  id: bulletin.id,
  title: bulletin.title,
  content: bulletin.content,
  pinned: bulletin.pinned,
  publishedAt: bulletin.publishedAt.toISOString(),
  categoryId: bulletin.categoryId,
  categoryName: bulletin.category?.name ?? null,
  categoryColor: normalizeColor(bulletin.category?.color),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const data: Prisma.BulletinUpdateInput = {}

  if ("title" in body) {
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) {
      return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 })
    }
    data.title = title
  }

  if ("content" in body) {
    const content = typeof body.content === "string" ? body.content.trim() : ""
    if (!content) {
      return NextResponse.json({ error: "内容は必須です" }, { status: 400 })
    }
    data.content = content
  }

  if ("pinned" in body) {
    data.pinned = Boolean(body.pinned)
  }

  if ("categoryId" in body) {
    if (typeof body.categoryId === "string" && body.categoryId.length > 0) {
      const exists = await prisma.bulletinCategory.findUnique({ where: { id: body.categoryId } })
      if (!exists) {
        return NextResponse.json({ error: "指定されたカテゴリが存在しません" }, { status: 400 })
      }
      data.category = { connect: { id: body.categoryId } }
    } else {
      data.category = { disconnect: true }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新対象のフィールドがありません" }, { status: 400 })
  }

  try {
    const bulletin = await prisma.bulletin.update({
      where: { id: params.id },
      data,
      include: { category: true },
    })

    return NextResponse.json({ bulletin: mapBulletin(bulletin) })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "対象のお知らせが見つかりません" }, { status: 404 })
    }
    throw error
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.bulletin.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "対象のお知らせが見つかりません" }, { status: 404 })
    }
    throw error
  }
}
