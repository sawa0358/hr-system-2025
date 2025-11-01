// 有給管理のテストデータをリセットするAPIエンドポイント
// 過去の有給申請・消費・付与ロットを削除して、初期状態に戻す

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // 外部キー制約の順序で削除
    console.log('1. 消費データ（Consumption）を削除中...')
    const consumptionCount = await prisma.consumption.deleteMany({})
    console.log(`   ${consumptionCount.count}件の消費データを削除しました`)
    
    console.log('2. 有給申請データ（TimeOffRequest）を削除中...')
    const requestCount = await prisma.timeOffRequest.deleteMany({})
    console.log(`   ${requestCount.count}件の申請データを削除しました`)
    
    console.log('3. 付与ロットデータ（GrantLot）を削除中...')
    const lotCount = await prisma.grantLot.deleteMany({})
    console.log(`   ${lotCount.count}件の付与ロットデータを削除しました`)
    
    // 旧システムのデータも削除（互換性のため）
    let oldRequestCount = 0
    let oldBalanceCount = 0
    let oldUsageCount = 0
    
    try {
      console.log('4. 旧システムの有給申請データ（VacationRequest）を削除中...')
      oldRequestCount = (await prisma.vacationRequest.deleteMany({})).count
      console.log(`   ${oldRequestCount}件の旧申請データを削除しました`)
    } catch (error: any) {
      console.log('   旧システムのテーブルが存在しないためスキップしました')
    }
    
    try {
      console.log('5. 旧システムの有給残高データ（VacationBalance）を削除中...')
      oldBalanceCount = (await prisma.vacationBalance.deleteMany({})).count
      console.log(`   ${oldBalanceCount}件の旧残高データを削除しました`)
    } catch (error: any) {
      console.log('   旧システムのテーブルが存在しないためスキップしました')
    }
    
    try {
      console.log('6. 旧システムの有給使用データ（VacationUsage）を削除中...')
      oldUsageCount = (await prisma.vacationUsage.deleteMany({})).count
      console.log(`   ${oldUsageCount}件の旧使用データを削除しました`)
    } catch (error: any) {
      console.log('   旧システムのテーブルが存在しないためスキップしました')
    }
    
    return NextResponse.json({
      success: true,
      message: '有給管理データのリセットが完了しました',
      deleted: {
        consumptions: consumptionCount.count,
        timeOffRequests: requestCount.count,
        grantLots: lotCount.count,
        oldRequests: oldRequestCount,
        oldBalances: oldBalanceCount,
        oldUsages: oldUsageCount,
      }
    })
  } catch (error: any) {
    console.error('エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'データのリセットに失敗しました'
    }, { status: 500 })
  }
}

