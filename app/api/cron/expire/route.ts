import { NextRequest, NextResponse } from "next/server"
import { expireGrantLots } from "@/lib/vacation-lot-generator"

/**
 * Cronエンドポイント: 失効処理
 * 毎日実行して期限切れのロットの残日数を0にする
 * 
 * 実行タイミング: 毎日0:00（UTC）
 * 保護: Authorization ヘッダーまたは query parameter でトークン確認
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（簡易版: 環境変数でトークンを設定）
    const authHeader = request.headers.get("authorization")
    const authToken = request.nextUrl.searchParams.get("token")
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}` && authToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const expiredCount = await expireGrantLots(today)

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      expiredCount,
      message: `${expiredCount}件のロットを失効処理しました`,
    })
  } catch (error: any) {
    console.error("Cron /api/cron/expire error", error)
    return NextResponse.json(
      { error: "失効処理に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

// POSTでも対応（cronサービスによってはPOSTを要求する場合がある）
export async function POST(request: NextRequest) {
  return GET(request)
}

