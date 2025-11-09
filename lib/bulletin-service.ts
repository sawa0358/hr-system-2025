import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPermissions, type UserRole } from "@/lib/permissions"

export type BulletinCategoryColor = "default" | "destructive" | "secondary" | "outline"

const DEFAULT_CATEGORIES: { name: string; color: BulletinCategoryColor }[] = [
  { name: "一般", color: "secondary" },
  { name: "重要", color: "destructive" },
  { name: "人事", color: "default" },
  { name: "システム", color: "outline" },
  { name: "評価", color: "secondary" },
]

const DEFAULT_BULLETINS: Array<{
  title: string
  content: string
  date: string
  categoryName?: string
  pinned?: boolean
}> = [
  {
    title: "年末年始休暇のお知らせ",
    content: "12月29日から1月3日まで年末年始休暇となります。緊急連絡先は別途メールにてご案内いたします。",
    date: "2025-01-08",
    categoryName: "重要",
    pinned: true,
  },
  {
    title: "新人研修プログラムの開始について",
    content: "1月15日より新入社員向けの研修プログラムを開始します。各部署の担当者は準備をお願いします。",
    date: "2025-01-05",
    categoryName: "人事",
  },
  {
    title: "システムメンテナンスのお知らせ",
    content: "1月12日(日) 2:00-6:00の間、システムメンテナンスを実施します。この間、一部機能がご利用いただけません。",
    date: "2025-01-03",
    categoryName: "システム",
  },
  {
    title: "第4四半期の目標設定について",
    content: "各部署の目標設定を1月20日までに提出してください。評価面談は2月上旬を予定しています。",
    date: "2025-01-02",
    categoryName: "評価",
  },
]

export async function ensureDefaultBulletinCategories() {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      prisma.bulletinCategory.upsert({
        where: { name: category.name },
        create: category,
        update: { color: category.color },
      }),
    ),
  )

  return prisma.bulletinCategory.findMany({
    orderBy: [{ createdAt: "asc" }],
  })
}

export async function seedDefaultBulletinsIfEmpty() {
  const bulletinCount = await prisma.bulletin.count()
  if (bulletinCount > 0) {
    return
  }

  const categories = await ensureDefaultBulletinCategories()
  const categoryMap = new Map(categories.map((category) => [category.name, category.id]))

  await prisma.$transaction(
    DEFAULT_BULLETINS.map((bulletin) =>
      prisma.bulletin.create({
        data: {
          title: bulletin.title,
          content: bulletin.content,
          date: new Date(bulletin.date),
          pinned: bulletin.pinned ?? false,
          categoryId: bulletin.categoryName ? categoryMap.get(bulletin.categoryName) ?? null : null,
        },
      }),
    ),
  )
}

type BulletinWithCategory = Prisma.BulletinGetPayload<{ include: { category: true } }>

export function serializeBulletin(bulletin: BulletinWithCategory) {
  return {
    id: bulletin.id,
    title: bulletin.title,
    content: bulletin.content,
    date: bulletin.date.toISOString().split("T")[0],
    pinned: bulletin.pinned,
    categoryId: bulletin.categoryId,
    category: bulletin.category
      ? {
          id: bulletin.category.id,
          name: bulletin.category.name,
          color: (bulletin.category.color as BulletinCategoryColor) ?? "secondary",
        }
      : null,
    createdAt: bulletin.createdAt.toISOString(),
    updatedAt: bulletin.updatedAt.toISOString(),
  }
}

export function validateCategoryColor(color: string): color is BulletinCategoryColor {
  return ["default", "destructive", "secondary", "outline"].includes(color)
}

export function normalizeCategoryColor(color?: string | null): BulletinCategoryColor {
  if (color && validateCategoryColor(color)) {
    return color
  }
  return "secondary"
}

export async function ensureCanManageAnnouncements(userId: string | null) {
  if (!userId) {
    return {
      error: {
        status: 401,
        message: "認証が必要です",
      },
    }
  }

  const user = await prisma.employee.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user) {
    return {
      error: {
        status: 404,
        message: "ユーザーが見つかりません",
      },
    }
  }

  const permissions = getPermissions(user.role as UserRole)

  if (!permissions.manageAnnouncements) {
    return {
      error: {
        status: 403,
        message: "お知らせの管理権限がありません",
      },
    }
  }

  return { user, permissions }
}

