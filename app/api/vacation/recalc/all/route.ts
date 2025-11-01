import { NextRequest, NextResponse } from "next/server"
import { generateGrantLotsForAllEmployees } from "@/lib/vacation-lot-generator"

/**
 * 全社員の付与ロットを一括生成するAPI
 * POST /api/vacation/recalc/all
 */
export async function POST(request: NextRequest) {
  try {
    console.log("全社員の付与ロット生成を開始...")
    // オプション: until（この日付までの付与ロットを生成）
    let until: Date | undefined
    try {
      const body = await request.json().catch(() => ({} as any))
      if (body?.until) {
        const d = new Date(body.until)
        if (!isNaN(d.getTime())) until = d
      }
    } catch {}

    const results = await generateGrantLotsForAllEmployees(until)
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.generated > 0 || r.updated > 0).length,
      totalGenerated: results.reduce((sum, r) => sum + r.generated, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.updated, 0),
    }
    
    console.log("全社員の付与ロット生成完了:", summary)
    
    return NextResponse.json({
      success: true,
      summary,
      results,
    })
  } catch (error: any) {
    console.error("全社員の付与ロット生成エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "付与ロットの生成に失敗しました",
      },
      { status: 500 }
    )
  }
}

