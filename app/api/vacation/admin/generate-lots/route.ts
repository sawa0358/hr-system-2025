// 全社員の付与ロットを再生成するAPIエンドポイント
// 設定画面の「パート・アルバイト用付与日数表」に基づいて正しい総付与数を計算

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateGrantLotsForEmployee } from "@/lib/vacation-lot-generator"

export async function POST(request: NextRequest) {
  try {
    // 全社員を取得（アクティブな社員のみ）
    const employees = await prisma.employee.findMany({
      where: {
        status: 'active',
        isInvisibleTop: false,
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        vacationPattern: true,
        weeklyPattern: true,
        employeeType: true,
        configVersion: true,
      },
      orderBy: {
        joinDate: 'asc',
      },
    })
    
    console.log(`\n${employees.length}名の社員の付与ロットを生成します...\n`)
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const employee of employees) {
      try {
        if (!employee.joinDate) {
          console.log(`⚠️  ${employee.name} (${employee.id}): 入社日が設定されていません`)
          results.push({
            employeeId: employee.id,
            employeeName: employee.name,
            success: false,
            error: '入社日が設定されていません',
            generated: 0,
            updated: 0,
          })
          errorCount++
          continue
        }
        
        const result = await generateGrantLotsForEmployee(employee.id)
        console.log(`✅ ${employee.name}: ${result.generated}件生成, ${result.updated}件更新`)
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          success: true,
          generated: result.generated,
          updated: result.updated,
        })
        successCount++
      } catch (error: any) {
        console.error(`❌ ${employee.name}: エラー - ${error.message}`)
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          success: false,
          error: error.message || '不明なエラー',
          generated: 0,
          updated: 0,
        })
        errorCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `全社員の付与ロット生成が完了しました（成功: ${successCount}名, 失敗: ${errorCount}名）`,
      summary: {
        total: employees.length,
        success: successCount,
        error: errorCount,
      },
      results,
    })
  } catch (error: any) {
    console.error('エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error.message || '付与ロットの生成に失敗しました'
    }, { status: 500 })
  }
}

