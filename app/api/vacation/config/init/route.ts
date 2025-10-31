import { NextRequest, NextResponse } from "next/server"
import { saveAppConfig, DEFAULT_APP_CONFIG } from "@/lib/vacation-config"
import { prisma } from "@/lib/prisma"

/**
 * デフォルト設定を投入・有効化するAPI
 * POST /api/vacation/config/init
 * 
 * 初回セットアップ時に実行する想定
 */
export async function POST(_request: NextRequest) {
  try {
    // 既にアクティブな設定があるか確認
    const existingActive = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true },
    })

    if (existingActive) {
      return NextResponse.json({
        success: false,
        message: "既にアクティブな設定が存在します",
        activeVersion: existingActive.version,
      })
    }

    // デフォルト設定を保存
    await saveAppConfig(DEFAULT_APP_CONFIG)

    // デフォルト設定を有効化
    await prisma.vacationAppConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    await prisma.vacationAppConfig.update({
      where: { version: DEFAULT_APP_CONFIG.version },
      data: { isActive: true },
    })

    return NextResponse.json({
      success: true,
      message: "デフォルト設定を投入し、有効化しました",
      version: DEFAULT_APP_CONFIG.version,
    })
  } catch (error: any) {
    console.error("初期設定投入エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "初期設定の投入に失敗しました",
      },
      { status: 500 }
    )
  }
}

