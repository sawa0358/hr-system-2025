// 有給管理設定（AppConfig）のAPI
import { NextRequest, NextResponse } from "next/server"
import { saveAppConfig, loadAppConfig, DEFAULT_APP_CONFIG, type AppConfig } from "@/lib/vacation-config"
import { prisma } from "@/lib/prisma"

// GET: 設定を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const version = searchParams.get("version")

    const config = await loadAppConfig(version || undefined)
    return NextResponse.json(config)
  } catch (error) {
    console.error("GET /api/vacation/config error", error)
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 })
  }
}

// POST: 新しい設定を保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AppConfig

    // バリデーション
    if (!body.version || !body.baselineRule || !body.fullTime || !body.partTime) {
      return NextResponse.json({ error: "必須フィールドが不足しています" }, { status: 400 })
    }

    await saveAppConfig(body)
    return NextResponse.json({ success: true, version: body.version })
  } catch (error) {
    console.error("POST /api/vacation/config error", error)
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 })
  }
}

// PUT: 設定を有効化
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { version } = body

    if (!version) {
      return NextResponse.json({ error: "version が必要です" }, { status: 400 })
    }

    // 既存のアクティブ設定を無効化
    await prisma.vacationAppConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // 指定バージョンを有効化
    await prisma.vacationAppConfig.update({
      where: { version },
      data: { isActive: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /api/vacation/config error", error)
    return NextResponse.json({ error: "設定の有効化に失敗しました" }, { status: 500 })
  }
}

