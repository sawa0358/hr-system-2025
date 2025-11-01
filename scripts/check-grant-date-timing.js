const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGrantDateTiming() {
  try {
    // 有給付与が行われた最新のロットを確認
    const latestLot = await prisma.grantLot.findFirst({
      orderBy: [
        { grantDate: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            joinDate: true
          }
        }
      }
    })

    if (!latestLot) {
      console.log('付与ロットが見つかりません')
      return
    }

    console.log(`\n最新の付与ロット:`)
    console.log(`  社員: ${latestLot.employee.name}`)
    console.log(`  付与日: ${latestLot.grantDate.toISOString()}`)
    console.log(`  作成日時: ${latestLot.createdAt.toISOString()}`)
    
    // 付与日の0:00と作成日時を比較
    const grantDateAtMidnight = new Date(latestLot.grantDate)
    grantDateAtMidnight.setHours(0, 0, 0, 0)
    
    const grantDatePreviousDay2359 = new Date(latestLot.grantDate)
    grantDatePreviousDay2359.setDate(grantDatePreviousDay2359.getDate() - 1)
    grantDatePreviousDay2359.setHours(23, 59, 59, 999)
    
    console.log(`\n付与日のタイミング分析:`)
    console.log(`  付与日 0:00: ${grantDateAtMidnight.toISOString()}`)
    console.log(`  付与前日 23:59: ${grantDatePreviousDay2359.toISOString()}`)
    console.log(`  実際の作成日時: ${latestLot.createdAt.toISOString()}`)
    
    // 付与日が0:00に行われているか確認
    const createdAtAtGrantDate = new Date(latestLot.createdAt)
    createdAtAtGrantDate.setHours(0, 0, 0, 0)
    
    const isGrantedAtMidnight = createdAtAtGrantDate.getTime() === grantDateAtMidnight.getTime()
    
    console.log(`\n付与タイミング:`)
    console.log(`  ${isGrantedAtMidnight ? '✓' : '✗'} 付与日0:00に付与されている: ${isGrantedAtMidnight}`)
    console.log(`  推奨: 前日23:59時点の状態をログとして保存する`)
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGrantDateTiming()

