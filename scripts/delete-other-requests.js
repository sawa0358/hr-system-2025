const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteOtherRequests() {
  try {
    // ippan社員を検索
    const ippanEmployee = await prisma.employee.findFirst({
      where: {
        name: {
          contains: 'ippan'
        }
      },
      select: {
        id: true,
        name: true,
        employeeId: true
      }
    })

    if (!ippanEmployee) {
      console.log('ippan社員が見つかりません')
      return
    }

    console.log(`\nippan社員: ${ippanEmployee.name} (ID: ${ippanEmployee.id})\n`)

    // ippan以外の全申請を取得
    const otherRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: {
          not: ippanEmployee.id
        }
      },
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true
          }
        }
      }
    })

    console.log(`ippan以外の申請: ${otherRequests.length}件`)

    if (otherRequests.length === 0) {
      console.log('削除する申請がありません')
      return
    }

    // 削除前の確認
    console.log('\n削除対象の申請:')
    for (const req of otherRequests) {
      console.log(`  - ID: ${req.id}`)
      console.log(`    社員: ${req.employee.name} (${req.employee.employeeId})`)
      console.log(`    期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
      console.log(`    状態: ${req.status}`)
      console.log(`    日数: ${req.totalDays || req.days || 'N/A'}`)
      console.log('')
    }

    // 削除実行
    const deleteResult = await prisma.timeOffRequest.deleteMany({
      where: {
        employeeId: {
          not: ippanEmployee.id
        }
      }
    })

    console.log(`\n✓ ${deleteResult.count}件の申請を削除しました`)

    // 残りの申請を確認
    const remainingRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: ippanEmployee.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n残りの申請 (ippan): ${remainingRequests.length}件`)
    for (const req of remainingRequests) {
      console.log(`  - ID: ${req.id}`)
      console.log(`    期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
      console.log(`    状態: ${req.status}`)
      console.log(`    日数: ${req.totalDays || req.days || 'N/A'}`)
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteOtherRequests()

