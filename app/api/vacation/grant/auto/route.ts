import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateGrantLotsForEmployee } from "@/lib/vacation-lot-generator"
import { loadAppConfig } from "@/lib/vacation-config"
import { getNextGrantDate } from "@/lib/vacation-grant-lot"

/**
 * 自動付与処理API
 * POST /api/vacation/grant/auto
 * 翌日が付与日の社員に対してロットを自動生成
 */
export async function POST(request: NextRequest) {
  try {
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
      date: today.toISOString().slice(0, 10),
      tomorrow: tomorrow.toISOString().slice(0, 10),
      totalGenerated: generatedCount,
      totalUpdated: updatedCount,
      results,
      message: `${results.length}件の社員に対してロットを生成しました`,
    })
  } catch (error: any) {
    console.error("POST /api/vacation/grant/auto error", error)
    return NextResponse.json(
      { error: "自動付与処理に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * 自動付与処理の状態確認
 * GET /api/vacation/grant/auto
 */
export async function GET(request: NextRequest) {
  try {
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
      },
      take: 10,
    })

    const upcomingGrants = []

    for (const emp of employees) {
      try {
        const { loadAppConfig } = await import("@/lib/vacation-config")
        const { getNextGrantDate } = await import("@/lib/vacation-grant-lot")
        
        const cfg = await loadAppConfig(emp.configVersion || undefined)
        const nextGrant = getNextGrantDate(emp.joinDate, cfg, today)
        
        if (nextGrant) {
          const nextGrantDate = new Date(nextGrant)
          nextGrantDate.setHours(0, 0, 0, 0)
          
          if (nextGrantDate.getTime() === tomorrow.getTime()) {
            upcomingGrants.push({
              employeeId: emp.id,
              employeeName: emp.name,
              grantDate: nextGrant.toISOString().slice(0, 10),
            })
          }
        }
      } catch (error: any) {
        console.error(`Failed to check employee ${emp.id}:`, error)
      }
    }

    return NextResponse.json({
      today: today.toISOString().slice(0, 10),
      tomorrow: tomorrow.toISOString().slice(0, 10),
      upcomingGrantsCount: upcomingGrants.length,
      upcomingGrants,
    })
  } catch (error: any) {
    console.error("GET /api/vacation/grant/auto error", error)
    return NextResponse.json(
      { error: "自動付与状態の取得に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

