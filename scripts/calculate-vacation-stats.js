const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function calculateStats() {
  try {
    // ippan社員を検索
    const employee = await prisma.employee.findFirst({
      where: {
        name: {
          contains: 'ippan'
        }
      }
    })

    if (!employee) {
      console.log('ippan社員が見つかりません')
      return
    }

    console.log(`\n社員: ${employee.name} (ID: ${employee.id})\n`)

    // 残り有給日数を計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lots = await prisma.grantLot.findMany({
      where: {
        employeeId: employee.id,
        expiryDate: { gte: today },
        daysRemaining: { gt: 0 },
      },
    })

    const remainingDays = lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0)
    const roundedRemaining = Math.round(remainingDays * 2) / 2

    console.log(`残り有給日数: ${roundedRemaining}日`)
    console.log(`  ロット数: ${lots.length}`)
    lots.forEach(lot => {
      console.log(`    - 付与日: ${lot.grantDate.toISOString().slice(0, 10)}, 残日数: ${lot.daysRemaining}日`)
    })

    // 申請中の日数を計算
    const pendingRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'PENDING',
      },
    })

    let pendingDays = 0
    pendingRequests.forEach(req => {
      if (req.totalDays) {
        pendingDays += Number(req.totalDays)
      } else {
        const diffMs = req.endDate.getTime() - req.startDate.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        const rounded = Math.round(Math.max(1, diffDays) * 2) / 2
        pendingDays += rounded
      }
    })

    const roundedPending = Math.round(pendingDays * 2) / 2

    console.log(`\n申請中の日数: ${roundedPending}日`)
    console.log(`  申請数: ${pendingRequests.length}`)
    pendingRequests.forEach(req => {
      console.log(`    - ID: ${req.id}, 日数: ${req.totalDays || '未計算'}, 期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
    })

    // 取得済み日数を計算
    const consumptions = await prisma.consumption.findMany({
      where: {
        employeeId: employee.id,
      },
    })

    const usedDays = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0)
    const roundedUsed = Math.round(usedDays * 2) / 2

    console.log(`\n取得済み日数: ${roundedUsed}日`)
    console.log(`  消費レコード数: ${consumptions.length}`)

    // 総付与数を計算
    const allLots = await prisma.grantLot.findMany({
      where: {
        employeeId: employee.id,
        expiryDate: { gte: today },
      },
      orderBy: { grantDate: 'desc' },
    })

    if (allLots.length > 0) {
      const latestGrantDate = allLots[0].grantDate
      const totalGranted = allLots
        .filter(lot => lot.grantDate <= latestGrantDate)
        .reduce((sum, lot) => sum + Number(lot.daysGranted), 0)
      const roundedGranted = Math.round(totalGranted * 2) / 2

      console.log(`\n総付与数: ${roundedGranted}日`)
      console.log(`  最新付与日: ${latestGrantDate.toISOString().slice(0, 10)}`)
    }

    // 残り有給日数の計算（総付与数 - 申請中）
    const totalGranted = allLots.length > 0 
      ? Math.round(allLots.filter(lot => lot.grantDate <= allLots[0].grantDate)
          .reduce((sum, lot) => sum + Number(lot.daysGranted), 0) * 2) / 2
      : 0

    const calculatedRemaining = Math.max(0, totalGranted - roundedPending)
    
    console.log(`\n計算結果:`)
    console.log(`  総付与数: ${totalGranted}日`)
    console.log(`  申請中: ${roundedPending}日`)
    console.log(`  残り有給日数（総付与数 - 申請中）: ${calculatedRemaining}日`)
    console.log(`  残り有給日数（ロット残日数合計）: ${roundedRemaining}日`)

    console.log(`\n✓ 処理完了`)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

calculateStats()

