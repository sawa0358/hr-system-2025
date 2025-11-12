import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPermissions, type Permission, type UserRole } from "@/lib/permissions"

export type ConvenienceUrlInput = {
  id?: string
  url: string
  description?: string | null
  position?: number
  _delete?: boolean
}

type ConvenienceCategoryWithRelations = Prisma.ConvenienceCategoryGetPayload<{
  include: {
    entries: {
      include: {
        urls: true
      }
      orderBy: {
        position: "asc"
      }
    }
  }
}>

type ConvenienceEntryWithUrls = Prisma.ConvenienceEntryGetPayload<{
  include: {
    urls: true
  }
}>

type ConvenienceUrl = Prisma.ConvenienceEntryUrlGetPayload<{
}>

export type ConvenienceTreeResponse = {
  categories: Array<{
    id: string
    tenantId: string | null
    name: string
    position: number
    isArchived: boolean
    isAdminOnly: boolean
    deletedAt: string | null
    createdAt: string
    updatedAt: string
    createdBy: string | null
    updatedBy: string | null
    entries: Array<{
      id: string
      categoryId: string
      title: string
      note: string | null
      position: number
      isArchived: boolean
      isAdminOnly: boolean
      deletedAt: string | null
      createdAt: string
      updatedAt: string
      createdBy: string | null
      updatedBy: string | null
      urls: Array<{
        id: string
        entryId: string
        url: string
        description: string | null
        position: number
        createdAt: string
        updatedAt: string
      }>
    }>
  }>
}

export async function resolveConvenienceUser(
  userId: string | null,
): Promise<
  | { error: { status: number; message: string } }
  | { user: { id: string; role: UserRole | null }; permissions: Permission }
> {
  if (!userId) {
    return { error: { status: 401, message: "認証が必要です" } }
  }

  const user = await prisma.employee.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: { status: 404, message: "ユーザーが見つかりません" } }
  }

  const permissions = getPermissions(user.role as UserRole)
  return { user: { id: user.id, role: user.role as UserRole | null }, permissions }
}

export function ensureViewPermission(result: Awaited<ReturnType<typeof resolveConvenienceUser>>) {
  if ("error" in result) {
    return result
  }
  if (!result.permissions.viewConvenience) {
    return { error: { status: 403, message: "便利機能の閲覧権限がありません" } }
  }
  return result
}

export function ensureManagePermission(result: Awaited<ReturnType<typeof resolveConvenienceUser>>) {
  if ("error" in result) {
    return result
  }
  if (!result.permissions.manageConvenience) {
    return { error: { status: 403, message: "便利機能の管理権限がありません" } }
  }
  return result
}

export async function fetchConvenienceTree(options: {
  tenantId?: string | null
  includeArchived?: boolean
} = {}): Promise<ConvenienceTreeResponse> {
  const { tenantId, includeArchived = false } = options

  const tenantFilter =
    tenantId === undefined
      ? undefined
      : tenantId ?? null

  const categories = await prisma.convenienceCategory.findMany({
    where: {
      ...(tenantFilter === undefined ? {} : { tenantId: tenantFilter }),
      ...(includeArchived
        ? {}
        : {
            isArchived: false,
            deletedAt: null,
          }),
    },
    orderBy: { position: "asc" },
    include: {
      entries: {
        where: includeArchived
          ? {}
          : {
              isArchived: false,
              deletedAt: null,
            },
        orderBy: { position: "asc" },
        include: {
          urls: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  })

  return {
    categories: categories.map(serializeConvenienceCategory),
  }
}

export async function createConvenienceCategory(input: {
  name: string
  tenantId?: string | null
  position?: number
  isArchived?: boolean
  isAdminOnly?: boolean
  createdBy?: string | null
}): Promise<ConvenienceCategoryWithRelations> {
  const tenantFilter =
    input.tenantId === undefined ? undefined : input.tenantId ?? null
  const currentMax = await prisma.convenienceCategory.aggregate({
    where: tenantFilter === undefined ? {} : { tenantId: tenantFilter },
    _max: { position: true },
  })

  const position =
    typeof input.position === "number" && Number.isFinite(input.position)
      ? Math.max(0, Math.floor(input.position))
      : (currentMax._max.position ?? -1) + 1

  return prisma.convenienceCategory.create({
    data: {
      name: input.name.trim(),
      tenantId: tenantFilter ?? null,
      position,
      isArchived: Boolean(input.isArchived),
      isAdminOnly: Boolean(input.isAdminOnly),
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
    },
    include: {
      entries: {
        orderBy: { position: "asc" },
        include: { urls: { orderBy: { position: "asc" } } },
      },
    },
  })
}

export async function updateConvenienceCategory(
  id: string,
  updates: {
    name?: string
    position?: number
    isArchived?: boolean
    isAdminOnly?: boolean
    tenantId?: string | null
  },
  userId: string | null,
): Promise<ConvenienceCategoryWithRelations> {
  const data: Prisma.ConvenienceCategoryUpdateInput = {}

  if (typeof updates.name === "string") {
    const trimmed = updates.name.trim()
    if (!trimmed) {
      throw new Error("名称は必須です")
    }
    data.name = trimmed
  }

  if (typeof updates.position === "number" && Number.isFinite(updates.position)) {
    data.position = Math.max(0, Math.floor(updates.position))
  }

  if (typeof updates.isArchived === "boolean") {
    data.isArchived = updates.isArchived
  }

  if (typeof updates.isAdminOnly === "boolean") {
    data.isAdminOnly = updates.isAdminOnly
  }

  if ("tenantId" in updates) {
    data.tenantId = updates.tenantId ?? null
  }

  data.updatedBy = userId

  if (Object.keys(data).length === 1 && "updatedBy" in data) {
    throw new Error("更新対象のフィールドがありません")
  }

  return prisma.convenienceCategory.update({
    where: { id },
    data,
    include: {
      entries: {
        orderBy: { position: "asc" },
        include: { urls: { orderBy: { position: "asc" } } },
      },
    },
  })
}

export async function softDeleteConvenienceCategory(id: string, userId: string | null) {
  const now = new Date()

  await prisma.$transaction([
    prisma.convenienceEntry.updateMany({
      where: { categoryId: id },
      data: {
        isArchived: true,
        deletedAt: now,
        updatedBy: userId,
      },
    }),
    prisma.convenienceCategory.update({
      where: { id },
      data: {
        isArchived: true,
        deletedAt: now,
        updatedBy: userId,
      },
    }),
  ])
}

export async function createConvenienceEntry(
  input: {
    categoryId: string
    title: string
    note?: string | null
    position?: number
    isArchived?: boolean
    isAdminOnly?: boolean
    urls?: ConvenienceUrlInput[]
  },
  userId: string | null,
) {
  const category = await prisma.convenienceCategory.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  })

  if (!category) {
    throw new Error("指定されたカテゴリが存在しません")
  }

  const currentMax = await prisma.convenienceEntry.aggregate({
    where: { categoryId: input.categoryId },
    _max: { position: true },
  })

  const position =
    typeof input.position === "number" && Number.isFinite(input.position)
      ? Math.max(0, Math.floor(input.position))
      : (currentMax._max.position ?? -1) + 1

  const entry = await prisma.convenienceEntry.create({
    data: {
      categoryId: input.categoryId,
      title: input.title.trim(),
      note: input.note?.trim() ?? null,
      position,
      isArchived: Boolean(input.isArchived),
      isAdminOnly: Boolean(input.isAdminOnly),
      createdBy: userId,
      updatedBy: userId,
      urls: input.urls
        ? {
            create: input.urls
              .filter((url) => !url._delete)
              .map((url, index) => ({
                url: url.url.trim(),
                description: url.description?.trim() ?? null,
                position:
                  typeof url.position === "number" && Number.isFinite(url.position)
                    ? Math.max(0, Math.floor(url.position))
                    : index,
              })),
          }
        : undefined,
    },
    include: {
      urls: { orderBy: { position: "asc" } },
      category: {
        include: {
          entries: {
            orderBy: { position: "asc" },
            include: { urls: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  })

  return entry
}

export async function updateConvenienceEntry(
  id: string,
  updates: {
    title?: string
    note?: string | null
    position?: number
    isArchived?: boolean
    isAdminOnly?: boolean
    categoryId?: string
    urls?: ConvenienceUrlInput[]
  },
  userId: string | null,
) {
  const data: Prisma.ConvenienceEntryUpdateInput = {}

  if (typeof updates.title === "string") {
    const trimmed = updates.title.trim()
    if (!trimmed) {
      throw new Error("タイトルは必須です")
    }
    data.title = trimmed
  }

  if ("note" in updates) {
    data.note = updates.note ? updates.note.trim() : null
  }

  if (typeof updates.position === "number" && Number.isFinite(updates.position)) {
    data.position = Math.max(0, Math.floor(updates.position))
  }

  if (typeof updates.isArchived === "boolean") {
    data.isArchived = updates.isArchived
  }

  if (typeof updates.isAdminOnly === "boolean") {
    data.isAdminOnly = updates.isAdminOnly
  }

  if (typeof updates.categoryId === "string") {
    data.category = { connect: { id: updates.categoryId } }
  }

  const urlsOperations: Prisma.ConvenienceEntryUrlUpdateManyWithoutEntryNestedInput = {}
  if (Array.isArray(updates.urls)) {
    const createList: Prisma.ConvenienceEntryUrlCreateWithoutEntryInput[] = []
    const updateList: Prisma.ConvenienceEntryUrlUpdateWithWhereUniqueWithoutEntryInput[] = []
    const deleteList: Prisma.ConvenienceEntryUrlWhereUniqueInput[] = []

    updates.urls.forEach((item, index) => {
      if (item._delete && item.id) {
        deleteList.push({ id: item.id })
        return
      }

      if (item.id) {
        updateList.push({
          where: { id: item.id },
          data: {
            url: item.url.trim(),
            description: item.description?.trim() ?? null,
            position:
              typeof item.position === "number" && Number.isFinite(item.position)
                ? Math.max(0, Math.floor(item.position))
                : index,
          },
        })
      } else if (!item._delete) {
        createList.push({
          url: item.url.trim(),
          description: item.description?.trim() ?? null,
          position:
            typeof item.position === "number" && Number.isFinite(item.position)
              ? Math.max(0, Math.floor(item.position))
              : index,
        })
      }
    })

    if (createList.length > 0) {
      urlsOperations.create = createList
    }
    if (updateList.length > 0) {
      urlsOperations.update = updateList
    }
    if (deleteList.length > 0) {
      urlsOperations.delete = deleteList
    }
  }

  data.urls = Object.keys(urlsOperations).length > 0 ? urlsOperations : undefined
  data.updatedBy = userId

  if (Object.keys(data).length === 1 && "updatedBy" in data) {
    throw new Error("更新対象のフィールドがありません")
  }

  return prisma.convenienceEntry.update({
    where: { id },
    data,
    include: {
      urls: { orderBy: { position: "asc" } },
      category: {
        include: {
          entries: {
            orderBy: { position: "asc" },
            include: { urls: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  })
}

export async function softDeleteConvenienceEntry(id: string, userId: string | null) {
  const now = new Date()
  await prisma.convenienceEntry.update({
    where: { id },
    data: {
      isArchived: true,
      deletedAt: now,
      updatedBy: userId,
    },
  })
}

export async function reorderConvenienceItems(input: {
  categories?: Array<{ id: string; position: number }>
  entries?: Array<{ id: string; position: number }>
  urls?: Array<{ id: string; position: number }>
}) {
  const operations: Prisma.PrismaPromise<any>[] = []

  if (Array.isArray(input.categories)) {
    input.categories.forEach((item) => {
      operations.push(
        prisma.convenienceCategory.update({
          where: { id: item.id },
          data: { position: Math.max(0, Math.floor(item.position)) },
        }),
      )
    })
  }

  if (Array.isArray(input.entries)) {
    input.entries.forEach((item) => {
      operations.push(
        prisma.convenienceEntry.update({
          where: { id: item.id },
          data: { position: Math.max(0, Math.floor(item.position)) },
        }),
      )
    })
  }

  if (Array.isArray(input.urls)) {
    input.urls.forEach((item) => {
      operations.push(
        prisma.convenienceEntryUrl.update({
          where: { id: item.id },
          data: { position: Math.max(0, Math.floor(item.position)) },
        }),
      )
    })
  }

  if (operations.length === 0) {
    throw new Error("更新対象がありません")
  }

  await prisma.$transaction(operations)
}

export function serializeConvenienceCategory(category: ConvenienceCategoryWithRelations) {
  return {
    id: category.id,
    tenantId: category.tenantId,
    name: category.name,
    position: category.position,
    isArchived: category.isArchived,
    isAdminOnly: category.isAdminOnly,
    deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    createdBy: category.createdBy,
    updatedBy: category.updatedBy,
    entries: category.entries.map(serializeConvenienceEntry),
  }
}

export function serializeConvenienceEntry(entry: ConvenienceEntryWithUrls) {
  return {
    id: entry.id,
    categoryId: entry.categoryId,
    title: entry.title,
    note: entry.note,
    position: entry.position,
    isArchived: entry.isArchived,
    isAdminOnly: entry.isAdminOnly,
    deletedAt: entry.deletedAt ? entry.deletedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    createdBy: entry.createdBy,
    updatedBy: entry.updatedBy,
    urls: entry.urls.map(serializeConvenienceUrl),
  }
}

export function serializeConvenienceUrl(url: ConvenienceUrl) {
  return {
    id: url.id,
    entryId: url.entryId,
    url: url.url,
    description: url.description,
    position: url.position,
    createdAt: url.createdAt.toISOString(),
    updatedAt: url.updatedAt.toISOString(),
  }
}

