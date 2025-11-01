// 全社員の付与ロットを再生成するスクリプト
// 設定画面の「パート・アルバイト用付与日数表」に基づいて正しい総付与数を計算

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateAllGrantLots() {
  console.log('=== 全社員の付与ロット生成開始 ===')
  
  try {
    // TypeScriptモジュールを動的にインポート
    // 注意: Node.jsでTypeScriptを直接実行する場合は、ts-nodeやtsxが必要です
    // または、ビルド済みのJavaScriptファイルを参照してください
    const path = require('path')
    const { generateGrantLotsForEmployee } = require(path.resolve(__dirname, '../lib/vacation-lot-generator.js'))
    
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
    
    let successCount = 0
    let errorCount = 0
    const errors = []
    
    for (const employee of employees) {
      try {
        if (!employee.joinDate) {
          console.log(`⚠️  ${employee.name} (${employee.id}): 入社日が設定されていません`)
          errorCount++
          continue
        }
        
        const result = await generateGrantLotsForEmployee(employee.id)
        console.log(`✅ ${employee.name}: ${result.generated}件生成, ${result.updated}件更新`)
        successCount++
      } catch (error) {
        console.error(`❌ ${employee.name}: エラー - ${error.message}`)
        errors.push({ employee: employee.name, error: error.message })
        errorCount++
      }
    }
    
    console.log(`\n=== 生成結果 ===`)
    console.log(`✅ 成功: ${successCount}名`)
    console.log(`❌ 失敗: ${errorCount}名`)
    
    if (errors.length > 0) {
      console.log(`\nエラー詳細:`)
      errors.forEach(({ employee, error }) => {
        console.log(`  - ${employee}: ${error}`)
      })
    }
    
    console.log('\n✅ 全社員の付与ロット生成が完了しました')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行
if (require.main === module) {
  generateAllGrantLots()
    .then(() => {
      console.log('\n完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('エラー:', error)
      process.exit(1)
    })
}

module.exports = { generateAllGrantLots }

