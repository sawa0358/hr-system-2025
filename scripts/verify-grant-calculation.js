// 総付与数の計算を検証するスクリプト
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyGrantCalculation() {
  try {
    // アクティブな設定を取得
    const config = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true }
    })
    
    if (!config) {
      console.log('アクティブな設定が見つかりません')
      return
    }
    
    const cfg = JSON.parse(config.configJson)
    
    // パターンB-2の設定テーブルを表示
    const partTimeB2 = cfg.partTime.tables.find(t => t.weeklyPattern === 2)
    console.log('=== パターンB-2（週2日勤務）の設定テーブル ===')
    console.log(JSON.stringify(partTimeB2.grants, null, 2))
    
    // パターンAの設定テーブルを表示
    console.log('\n=== パターンA（正社員）の設定テーブル ===')
    console.log(JSON.stringify(cfg.fullTime.table, null, 2))
    
    // 各社員のロットと期待値を確認
    console.log('\n=== 各社員の期待値と実際の値 ===')
    const employees = await prisma.employee.findMany({
      where: {
        name: { in: ['admin', 'sab', 'ippan', 'ippanb', '閲覧者'] }
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        vacationPattern: true,
      }
    })
    
    for (const emp of employees) {
      const today = new Date()
      const lots = await prisma.grantLot.findMany({
        where: {
          employeeId: emp.id,
          expiryDate: { gte: today }
        },
        orderBy: { grantDate: 'desc' }
      })
      
      if (lots.length > 0) {
        const latestGrantDate = lots[0].grantDate
        const yearsSinceJoin = (latestGrantDate.getTime() - emp.joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        
        // 期待される付与日数を計算
        // diffInYearsHalfStepと同じロジックを使用
        const months = (latestGrantDate.getFullYear() - emp.joinDate.getFullYear()) * 12 + 
                       (latestGrantDate.getMonth() - emp.joinDate.getMonth())
        const yearsHalfStep = Math.floor(months / 6) / 2
        
        let expectedDays = 0
        if (emp.vacationPattern === 'A') {
          const table = cfg.fullTime.table
          const eligible = table
            .filter(r => r.years <= yearsHalfStep)
            .sort((a, b) => b.years - a.years)[0]
          expectedDays = eligible?.days ?? 0
        } else if (emp.vacationPattern?.startsWith('B-')) {
          const weeklyPattern = parseInt(emp.vacationPattern.split('-')[1])
          const table = cfg.partTime.tables.find(t => t.weeklyPattern === weeklyPattern)
          if (table) {
            const eligible = table.grants
              .filter(r => r.years <= yearsHalfStep)
              .sort((a, b) => b.years - a.years)[0]
            expectedDays = eligible?.days ?? 0
          }
        }
        
        const actualDays = Number(lots[0].daysGranted)
        const match = Math.abs(expectedDays - actualDays) < 0.1
        
        console.log(`\n${emp.name} (パターン${emp.vacationPattern}):`)
        console.log(`  勤続年数: ${yearsSinceJoin.toFixed(1)}年`)
        console.log(`  最新付与日: ${latestGrantDate.toISOString().slice(0, 10)}`)
        console.log(`  期待される付与日数: ${expectedDays}日`)
        console.log(`  実際の付与日数: ${actualDays}日`)
        console.log(`  ${match ? '✅ 一致' : '❌ 不一致'}`)
      }
    }
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyGrantCalculation()

