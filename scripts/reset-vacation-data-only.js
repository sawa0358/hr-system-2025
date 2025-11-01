// 有給管理データのみをリセットするスクリプト（社員情報は保持）
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetVacationDataOnly() {
  console.log('=== 有給管理データのみをリセット開始 ===')
  console.log('（社員情報は保持します）\n')
  
  try {
    // 外部キー制約の順序で削除
    console.log('1. 消費データ（Consumption）を削除中...')
    try {
      const consumptionCount = await prisma.consumption.deleteMany({})
      console.log(`   ✅ ${consumptionCount.count}件の消費データを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  Consumptionテーブルが存在しないためスキップしました`)
    }
    
    console.log('2. 有給申請データ（TimeOffRequest）を削除中...')
    try {
      const requestCount = await prisma.timeOffRequest.deleteMany({})
      console.log(`   ✅ ${requestCount.count}件の申請データを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  TimeOffRequestテーブルが存在しないためスキップしました`)
    }
    
    console.log('3. 付与ロットデータ（GrantLot）を削除中...')
    try {
      const lotCount = await prisma.grantLot.deleteMany({})
      console.log(`   ✅ ${lotCount.count}件の付与ロットデータを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  GrantLotテーブルが存在しないためスキップしました`)
    }
    
    // 旧システムのデータも削除（互換性のため）
    console.log('4. 旧システムの有給申請データ（VacationRequest）を削除中...')
    try {
      const oldRequestCount = await prisma.vacationRequest.deleteMany({})
      console.log(`   ✅ ${oldRequestCount.count}件の旧申請データを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  旧システムのテーブルが存在しないためスキップしました`)
    }
    
    console.log('5. 旧システムの有給残高データ（VacationBalance）を削除中...')
    try {
      const oldBalanceCount = await prisma.vacationBalance.deleteMany({})
      console.log(`   ✅ ${oldBalanceCount.count}件の旧残高データを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  旧システムのテーブルが存在しないためスキップしました`)
    }
    
    console.log('6. 旧システムの有給使用データ（VacationUsage）を削除中...')
    try {
      const oldUsageCount = await prisma.vacationUsage.deleteMany({})
      console.log(`   ✅ ${oldUsageCount.count}件の旧使用データを削除しました`)
    } catch (error) {
      console.log(`   ⚠️  旧システムのテーブルが存在しないためスキップしました`)
    }
    
    console.log('\n✅ 有給管理データのリセットが完了しました')
    console.log('   （社員情報は保持されています）')
    console.log('\n次のステップ:')
    console.log('   全社員の付与ロットを再生成してください:')
    console.log('   curl -X POST http://localhost:3000/api/vacation/admin/generate-lots')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行
if (require.main === module) {
  resetVacationDataOnly()
    .then(() => {
      console.log('\n完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('エラー:', error)
      process.exit(1)
    })
}

module.exports = { resetVacationDataOnly }

