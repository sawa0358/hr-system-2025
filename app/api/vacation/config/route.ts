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
      return NextResponse.json({ 
        error: "必須フィールドが不足しています",
        details: {
          hasVersion: !!body.version,
          hasBaselineRule: !!body.baselineRule,
          hasFullTime: !!body.fullTime,
          hasPartTime: !!body.partTime,
        }
      }, { status: 400 })
    }

    // 設定のJSONシリアライズテスト
    let configJson: string
    try {
      configJson = JSON.stringify(body)
      // JSONサイズチェック（過大なデータを防ぐ）
      if (configJson.length > 100000) {
        return NextResponse.json({ error: "設定データが大きすぎます" }, { status: 400 })
      }
    } catch (jsonError) {
      console.error("JSON serialization error:", jsonError)
      return NextResponse.json({ error: "設定データの変換に失敗しました" }, { status: 400 })
    }

    await saveAppConfig(body)
    return NextResponse.json({ success: true, version: body.version })
  } catch (error: any) {
    console.error("POST /api/vacation/config error", error)
    
    // Prismaエラーの詳細を取得
    let errorMessage = "設定の保存に失敗しました"
    let errorDetails: any = {}

    if (error?.code) {
      // Prismaエラーコード
      errorDetails.prismaCode = error.code
      switch (error.code) {
        case 'P2002':
          errorMessage = "同じバージョンの設定が既に存在します"
          break
        case 'P2025':
          errorMessage = "設定が見つかりません"
          break
        default:
          errorMessage = `データベースエラー: ${error.code}`
      }
    }

    if (error?.message) {
      errorDetails.message = error.message
      // テーブルが存在しない場合のエラー
      if (error.message.includes('does not exist') || error.message.includes('Unknown table')) {
        errorMessage = "データベーステーブルが存在しません。マイグレーションを実行してください。"
      }
    }

    if (error?.meta) {
      errorDetails.meta = error.meta
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
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

    // 指定バージョンの存在確認
    const targetConfig = await prisma.vacationAppConfig.findUnique({
      where: { version },
    })

    if (!targetConfig) {
      return NextResponse.json({ 
        error: `バージョン ${version} の設定が見つかりません`,
        details: { version }
      }, { status: 404 })
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

    return NextResponse.json({ success: true, version })
  } catch (error: any) {
    console.error("PUT /api/vacation/config error", error)
    
    // Prismaエラーの詳細を取得
    let errorMessage = "設定の有効化に失敗しました"
    let errorDetails: any = {}

    if (error?.code) {
      errorDetails.prismaCode = error.code
      switch (error.code) {
        case 'P2025':
          errorMessage = "設定が見つかりません"
          break
        default:
          errorMessage = `データベースエラー: ${error.code}`
      }
    }

    if (error?.message) {
      errorDetails.message = error.message
      if (error.message.includes('does not exist') || error.message.includes('Unknown table')) {
        errorMessage = "データベーステーブルが存在しません。マイグレーションを実行してください。"
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}

