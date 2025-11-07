import { NextRequest, NextResponse } from "next/server"
import { generateGrantLotsForAllEmployees } from "@/lib/vacation-lot-generator"

/**
 * 日次スケジューラ用API（毎日実行）
 * その日までに到来した付与基準日のロットを生成/更新する
 * 新付与日の前日23:59にスナップショットを自動保存
 * POST /api/vacation/schedule/daily
 */
export async function POST(_request: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // ロット生成処理
    const results = await generateGrantLotsForAllEmployees(today)
    const summary = {
      total: results.length,
      success: results.filter(r => r.generated > 0 || r.updated > 0).length,
      totalGenerated: results.reduce((sum, r) => sum + r.generated, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.updated, 0),
    }

    // 新付与日の前日23:59にスナップショットを自動保存
    // 前日の23:59時点のデータを保存するため、今日が新付与日の場合に前日のデータを保存
    let snapshotResult = null
    try {
      // 内部API呼び出しのため、直接関数を呼び出す
      const { POST: saveSnapshot } = await import("@/app/api/vacation/history/auto-save/route")
      const snapshotRequest = new NextRequest(
        new URL("http://localhost/api/vacation/history/auto-save"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      snapshotResult = await saveSnapshot(snapshotRequest)
    } catch (snapshotError: any) {
      console.error("スナップショット自動保存エラー:", snapshotError)
      // スナップショット保存に失敗してもロット生成は続行（既存機能への影響を最小化）
    }

    return NextResponse.json({
      success: true,
      summary,
      snapshot: snapshotResult ? await snapshotResult.json() : null,
    })
  } catch (error: any) {
    console.error("日次スケジューラ実行エラー:", error)
    return NextResponse.json({ success: false, error: error?.message || '日次スケジューラの実行に失敗しました' }, { status: 500 })
  }
}


