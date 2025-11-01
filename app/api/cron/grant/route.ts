import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateGrantLotsForEmployee } from "@/lib/vacation-lot-generator"
import { loadAppConfig } from "@/lib/vacation-config"
import { getNextGrantDate } from "@/lib/vacation-grant-lot"

/**
 * Cronエンドポイント: 自動付与処理
 * 毎日実行して翌日が付与日の社員に対してロットを自動生成
 * 
 * 実行タイミング: 毎日23:59（UTC）推奨（付与日の前日に実行）
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
    today.setHours(0, 0, 0, 0)
    
    // 翌日を計算
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // アクティブな社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true,
        vacationPattern: true,
        employeeType: true,
        weeklyPattern: true,
      },
    })

    const results = []
    let generatedCount = 0
    let updatedCount = 0

    for (const emp of employees) {
      try {
        const cfg = await loadAppConfig(emp.configVersion || undefined)
        const nextGrant = getNextGrantDate(emp.joinDate, cfg, today)
        
        // 翌日が付与日の場合
        if (nextGrant) {
          const nextGrantDate = new Date(nextGrant)
          nextGrantDate.setHours(0, 0, 0, 0)
          
          if (nextGrantDate.getTime() === tomorrow.getTime()) {
            // ロットを生成（明日まで）
            const { generated, updated } = await generateGrantLotsForEmployee(emp.id, tomorrow)
            generatedCount += generated
            updatedCount += updated
            
            results.push({
              employeeId: emp.id,
              employeeName: emp.name,
              grantDate: nextGrant.toISOString().slice(0, 10),
              generated,
              updated,
            })
          }
        }
      } catch (error: any) {
        console.error(`Failed to process employee ${emp.id}:`, error)
        results.push({
          employeeId: emp.id,
          employeeName: emp.name,
          error: error?.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      date: today.toISOString().slice(0, 10),
      tomorrow: tomorrow.toISOString().slice(0, 10),
      totalGenerated: generatedCount,
      totalUpdated: updatedCount,
      results,
      message: `${results.length}件の社員に対してロットを生成しました`,
    })
  } catch (error: any) {
    console.error("Cron /api/cron/grant error", error)
    return NextResponse.json(
      { error: "自動付与処理に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

// POSTでも対応（cronサービスによってはPOSTを要求する場合がある）
export async function POST(request: NextRequest) {
  return GET(request)
}

