const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugVacationStats() {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        name: {
          contains: 'ippan'
        }
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true
      }
    })

    if (!employee) {
      console.log('社員が見つかりません')
      return
    }

    console.log(`\n社員: ${employee.name} (ID: ${employee.id})`)
    console.log(`入社日: ${employee.joinDate.toISOString().slice(0, 10)}`)
    console.log(`設定バージョン: ${employee.configVersion || 'default'}\n`)

    // 現在の付与サイクルの開始日を計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 簡単な実装: 入社日からの経過年数で付与サイクルを計算
    const joinYear = employee.joinDate.getFullYear()
    const joinMonth = employee.joinDate.getMonth()
    const joinDay = employee.joinDate.getDate()
    
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    // 今年の付与基準日を計算（入社日の月日を使用）
    let curStart = new Date(currentYear, joinMonth, joinDay)
    curStart.setHours(0, 0, 0, 0)
    
    // 今年の付与基準日が未来の場合は、去年の付与基準日を使用
    if (curStart > today) {
      curStart = new Date(currentYear - 1, joinMonth, joinDay)
      curStart.setHours(0, 0, 0, 0)
    }
    
    console.log(`現在の日付: ${today.toISOString().slice(0, 10)}`)
    console.log(`現在の付与サイクル開始日: ${curStart.toISOString().slice(0, 10)}\n`)

    // 承認済み消費の合計
    const consumptions = await prisma.consumption.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: curStart,
          lte: today,
        },
      },
    })

    console.log(`付与サイクル内の消費レコード: ${consumptions.length}件`)
    const total = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0)
    console.log(`合計消費日数: ${total}日`)
    
    // 全消費レコードも確認
    const allConsumptions = await prisma.consumption.findMany({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    console.log(`\n全消費レコード: ${allConsumptions.length}件`)
    for (const c of allConsumptions) {
      const dateStr = c.date.toISOString().slice(0, 10)
      const inRange = c.date >= curStart && c.date <= today
      console.log(`  - 日付: ${dateStr}, 使用日数: ${c.daysUsed}日, 範囲内: ${inRange ? '✓' : '✗'}`)
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugVacationStats()

