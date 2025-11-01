import { NextRequest, NextResponse } from "next/server"
import { generateGrantLotsForAllEmployees } from "@/lib/vacation-lot-generator"

/**
 * 日次スケジューラ用API（毎日実行）
 * その日までに到来した付与基準日のロットを生成/更新する
 * POST /api/vacation/schedule/daily
 */
export async function POST(_request: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const results = await generateGrantLotsForAllEmployees(today)
    const summary = {
      total: results.length,
      success: results.filter(r => r.generated > 0 || r.updated > 0).length,
      totalGenerated: results.reduce((sum, r) => sum + r.generated, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.updated, 0),
    }
    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error("日次スケジューラ実行エラー:", error)
    return NextResponse.json({ success: false, error: error?.message || '日次スケジューラの実行に失敗しました' }, { status: 500 })
  }
}


