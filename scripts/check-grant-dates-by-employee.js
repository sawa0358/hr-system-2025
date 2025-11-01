const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGrantDatesByEmployee() {
  try {
    console.log('=== 各社員の付与日計算確認 ===\n')

    // アクティブな設定を取得
    const config = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true }
    })

    if (!config) {
      console.log('アクティブな設定が見つかりません')
      return
    }

    const cfg = JSON.parse(config.configJson)
    console.log('設定情報:')
    console.log(`  初回付与: 入社から${cfg.baselineRule.initialGrantAfterMonths}ヶ月後`)
    console.log(`  付与サイクル: ${cfg.grantCycleMonths}ヶ月`)
    console.log(`  有効期限: ${cfg.expiry.kind === 'YEARS' ? cfg.expiry.years + '年' : cfg.expiry.kind}\n`)

    // サンプル社員を取得
    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true
      },
      take: 5
    })

    for (const emp of employees) {
      console.log(`社員: ${emp.name}`)
      console.log(`  入社日: ${emp.joinDate.toISOString().slice(0, 10)}`)

      // 付与日を計算（入社日基準）
      const joinDate = new Date(emp.joinDate)
      const today = new Date()

      // 初回付与日を計算
      const initialGrantMonths = cfg.baselineRule.initialGrantAfterMonths
      const firstGrantDate = new Date(joinDate)
      firstGrantDate.setMonth(firstGrantDate.getMonth() + initialGrantMonths)

      console.log(`  初回付与日: ${firstGrantDate.toISOString().slice(0, 10)} (入社から${initialGrantMonths}ヶ月後)`)

      // 以降の付与日を計算
      const grantDates = []
      let currentGrantDate = new Date(firstGrantDate)

      while (currentGrantDate <= today) {
        // 勤続年数を計算（0.5年単位）
        const yearsSinceJoin = (currentGrantDate - joinDate) / (1000 * 60 * 60 * 24 * 365.25)
        const roundedYears = Math.floor(yearsSinceJoin * 2) / 2 // 0.5年単位で切り捨て

        grantDates.push({
          grantDate: new Date(currentGrantDate),
          yearsSinceJoin: roundedYears
        })

        // 次の付与日（12ヶ月後）
        currentGrantDate = new Date(currentGrantDate)
        currentGrantDate.setMonth(currentGrantDate.getMonth() + cfg.grantCycleMonths)
      }

      console.log(`  付与日履歴:`)
      grantDates.forEach((grant, idx) => {
        console.log(`    ${idx + 1}. ${grant.grantDate.toISOString().slice(0, 10)} (勤続${grant.yearsSinceJoin}年)`)
      })

      // 実際のロットを確認
      const lots = await prisma.grantLot.findMany({
        where: { employeeId: emp.id },
        orderBy: { grantDate: 'asc' }
      })

      console.log(`  実際のロット:`)
      if (lots.length === 0) {
        console.log(`    (ロットが生成されていません)`)
      } else {
        lots.forEach((lot, idx) => {
          const yearsSinceJoin = (lot.grantDate - joinDate) / (1000 * 60 * 60 * 24 * 365.25)
          const roundedYears = Math.floor(yearsSinceJoin * 2) / 2
          console.log(`    ${idx + 1}. ${lot.grantDate.toISOString().slice(0, 10)} (勤続${roundedYears.toFixed(1)}年, 残日数: ${lot.daysRemaining}日)`)
        })
      }

      console.log('')
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGrantDatesByEmployee()

