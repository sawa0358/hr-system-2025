// 有給管理データの確認スクリプト
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVacationData() {
  try {
    // 対象社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        name: { in: ['admin', 'sab', 'ippan', 'ippanb', '閲覧者'] }
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        vacationPattern: true,
        weeklyPattern: true,
        employeeType: true,
        configVersion: true,
      }
    })
    
    console.log(`\n=== ${employees.length}名の社員データを確認します ===\n`)
    
    for (const emp of employees) {
      const lots = await prisma.grantLot.findMany({
        where: { employeeId: emp.id },
        orderBy: { grantDate: 'desc' }
      })
      
      console.log(`=== ${emp.name} ===`)
      console.log(`  入社日: ${emp.joinDate}`)
      console.log(`  パターン: ${emp.vacationPattern || '(未設定)'}`)
      console.log(`  週パターン: ${emp.weeklyPattern || '(未設定)'}`)
      console.log(`  設定バージョン: ${emp.configVersion || '(未設定)'}`)
      console.log(`  付与ロット数: ${lots.length}`)
      
      if (lots.length > 0) {
        const today = new Date()
        const activeLots = lots.filter(l => new Date(l.expiryDate) >= today)
        
        console.log(`  有効なロット数: ${activeLots.length}`)
        
        if (activeLots.length > 0) {
          const latestLot = activeLots[0]
          const latestGrantDate = latestLot.grantDate
          
          console.log(`  最新付与日: ${latestGrantDate}`)
          console.log(`  最新ロット: daysGranted=${Number(latestLot.daysGranted)}, daysRemaining=${Number(latestLot.daysRemaining)}`)
          
          // 最新付与日時点で有効だったロットのdaysGrantedの合計
          const totalGranted = activeLots
            .filter(l => new Date(l.grantDate) <= new Date(latestGrantDate))
            .reduce((sum, l) => sum + Number(l.daysGranted), 0)
          
          console.log(`  総付与数（計算値）: ${totalGranted}`)
          
          // ロットの内訳を表示
          console.log(`  ロット内訳:`)
          activeLots
            .filter(l => new Date(l.grantDate) <= new Date(latestGrantDate))
            .forEach(l => {
              console.log(`    - ${l.grantDate.toISOString().slice(0, 10)}: ${Number(l.daysGranted)}日付与 (残り: ${Number(l.daysRemaining)}日)`)
            })
        }
      } else {
        console.log(`  ⚠️ 付与ロットが存在しません`)
      }
      console.log('')
    }
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVacationData()

