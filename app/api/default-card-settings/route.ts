import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkPermission } from "@/lib/permissions"

// GET /api/default-card-settings - デフォルトカード設定を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-employee-id")

    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 権限チェック（管理者・総務のみ取得可能）
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any
    if (userRole !== 'admin' && userRole !== 'hr') {
      // 管理者・総務以外も取得可能にする（全ユーザーが参照できる）
      // return NextResponse.json({ error: "権限がありません" }, { status: 403 })
    }

    // 最新の設定を取得（IDでソートして最初の1件を取得、または最新のupdatedAtを取得）
    const settings = await prisma.defaultCardSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (!settings) {
      // デフォルト値を返す
      return NextResponse.json({
        labels: [],
        priorities: [],
        statuses: [],
        defaultCardColor: "#ffffff",
        defaultListColor: "#f1f5f9",
      })
    }

    return NextResponse.json({
      labels: settings.labels,
      priorities: settings.priorities,
      statuses: settings.statuses,
      defaultCardColor: settings.defaultCardColor || "#ffffff",
      defaultListColor: settings.defaultListColor || "#f1f5f9",
    })
  } catch (error) {
    console.error("Error fetching default card settings:", error)
    return NextResponse.json(
      { error: "デフォルトカード設定の取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST /api/default-card-settings - デフォルトカード設定を保存
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-employee-id")

    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 権限チェック（管理者・総務のみ保存可能）
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const userRole = user.role as any
    if (userRole !== 'admin' && userRole !== 'hr') {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 })
    }

    const body = await request.json()
    const { labels, priorities, statuses, defaultCardColor, defaultListColor } = body

    // 既存の設定があるか確認
    const existing = await prisma.defaultCardSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (existing) {
      // 既存の設定を更新
      const updated = await prisma.defaultCardSettings.update({
        where: { id: existing.id },
        data: {
          labels,
          priorities,
          statuses,
          defaultCardColor,
          defaultListColor,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, settings: updated })
    } else {
      // 新規作成
      const created = await prisma.defaultCardSettings.create({
        data: {
          labels,
          priorities,
          statuses,
          defaultCardColor,
          defaultListColor,
        },
      })

      return NextResponse.json({ success: true, settings: created }, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving default card settings:", error)
    return NextResponse.json(
      { error: "デフォルトカード設定の保存に失敗しました" },
      { status: 500 }
    )
  }
}

