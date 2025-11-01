import { NextRequest, NextResponse } from "next/server"
import { saveAppConfig, DEFAULT_APP_CONFIG } from "@/lib/vacation-config"
import { prisma } from "@/lib/prisma"

/**
 * デフォルト設定を投入・有効化するAPI
 * POST /api/vacation/config/init
 * 
 * 初回セットアップ時に実行する想定
 */
export async function POST(request: NextRequest) {
  try {
    // シンプルな管理者パスワード認証（環境変数 ADMIN_PASSWORD が設定されている場合のみ有効）
    const requiredPassword = process.env.ADMIN_PASSWORD
    if (requiredPassword && requiredPassword.length > 0) {
      const provided = request.headers.get('x-admin-password') || ''
      if (provided !== requiredPassword) {
        return NextResponse.json(
          { success: false, error: '認証に失敗しました（管理者パスワードが不正）' },
          { status: 401 }
        )
      }
    }
    // 既にアクティブな設定があるか確認
    let existingActive = null
    try {
      existingActive = await prisma.vacationAppConfig.findFirst({
        where: { isActive: true },
      })
    } catch (tableError: any) {
      // テーブルが存在しない場合は新規作成として扱う
      if (tableError?.code === 'P2021' || tableError?.message?.includes('does not exist')) {
        console.warn('vacationAppConfigテーブルが存在しません。マイグレーションが必要です。')
        return NextResponse.json(
          { success: false, error: 'データベーステーブルが存在しません。マイグレーションを実行してください。' },
          { status: 500 }
        )
      }
      throw tableError
    }

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

