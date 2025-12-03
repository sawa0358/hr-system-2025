import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CATEGORY_COLORS = ["default", "destructive", "secondary", "outline"] as const

type CategoryColor = typeof CATEGORY_COLORS[number]

const DEFAULT_CATEGORIES: { name: string; color: CategoryColor }[] = [
  { name: "一般", color: "secondary" },
  { name: "重要", color: "destructive" },
  { name: "人事", color: "default" },
  { name: "システム", color: "outline" },
  { name: "評価", color: "secondary" },
]

const DEFAULT_BULLETINS = [
  {
    title: "年末年始休暇のお知らせ",
    content: "12月29日から1月3日まで年末年始休暇となります。緊急連絡先は別途メールにてご案内いたします。",
    categoryName: "重要",
    pinned: true,
    publishedAt: new Date("2025-01-08"),
  },
  {
    title: "新人研修プログラムの開始について",
    content: "1月15日より新入社員向けの研修プログラムを開始します。各部署の担当者は準備をお願いします。",
    categoryName: "人事",
    pinned: false,
    publishedAt: new Date("2025-01-05"),
  },
  {
    title: "システムメンテナンスのお知らせ",
    content: "1月12日(日) 2:00-6:00の間、システムメンテナンスを実施します。この間、一部機能がご利用いただけません。",
    categoryName: "システム",
    pinned: false,
    publishedAt: new Date("2025-01-03"),
  },
  {
    title: "第4四半期の目標設定について",
    content: "各部署の目標設定を1月20日までに提出してください。評価面談は2月上旬を予定しています。",
    categoryName: "評価",
    pinned: false,
    publishedAt: new Date("2025-01-02"),
  },
]

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

async function ensureSeedData() {
  const categoryCount = await prisma.bulletinCategory.count()

  if (categoryCount === 0) {
    await prisma.$transaction(
      DEFAULT_CATEGORIES.map((category) =>
        prisma.bulletinCategory.create({
          data: {
            name: category.name,
            color: category.color,
          },
        }),
      ),
    )
  }

  const bulletinCount = await prisma.bulletin.count()
  if (bulletinCount === 0) {
    const categories = await prisma.bulletinCategory.findMany()
    const categoryByName = new Map(categories.map((category) => [category.name, category.id]))

    await prisma.$transaction(
      DEFAULT_BULLETINS.map((bulletin) =>
        prisma.bulletin.create({
          data: {
            title: bulletin.title,
            content: bulletin.content,
            pinned: bulletin.pinned,
            publishedAt: bulletin.publishedAt,
            categoryId: categoryByName.get(bulletin.categoryName) ?? null,
          },
        }),
      ),
    )
  }
}

export async function GET() {
  await ensureSeedData()

  const [categories, bulletins] = await Promise.all([
    prisma.bulletinCategory.findMany({
      orderBy: { createdAt: "asc" },
    }),
    prisma.bulletin.findMany({
      include: { category: true },
      orderBy: [
        { pinned: "desc" },
        { publishedAt: "desc" },
      ],
    }),
  ])

  return NextResponse.json({
    categories: categories.map(mapCategory),
    bulletins: bulletins.map(mapBulletin),
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content.trim() : ""
  const pinned = Boolean(body.pinned)
  const categoryId = typeof body.categoryId === "string" && body.categoryId.length > 0 ? body.categoryId : null

  if (!title || !content) {
    return NextResponse.json({ error: "タイトルと内容は必須です" }, { status: 400 })
  }

  if (categoryId) {
    const exists = await prisma.bulletinCategory.findUnique({ where: { id: categoryId } })
    if (!exists) {
      return NextResponse.json({ error: "指定されたカテゴリが存在しません" }, { status: 400 })
    }
  }

  const bulletin = await prisma.bulletin.create({
    data: {
      title,
      content,
      pinned,
      categoryId,
    },
    include: { category: true },
  })

  return NextResponse.json({ bulletin: mapBulletin(bulletin) }, { status: 201 })
}








