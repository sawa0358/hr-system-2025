const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkApprovedRequests() {
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
        employeeId: true
      }
    })

    if (!employee) {
      console.log('社員が見つかりません')
      return
    }

    console.log(`\n社員: ${employee.name} (ID: ${employee.id})\n`)

    // TimeOffRequestテーブルから承認済み申請を取得
    const approvedRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'APPROVED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`承認済み申請 (TimeOffRequest): ${approvedRequests.length}件`)
    for (const req of approvedRequests) {
      console.log(`  - ID: ${req.id}`)
      console.log(`    期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
      console.log(`    日数: ${req.totalDays || req.days || 'N/A'}`)
      console.log(`    承認日: ${req.approvedAt ? req.approvedAt.toISOString().slice(0, 10) : 'N/A'}`)
    }

    // Consumptionレコードを取得
    const consumptions = await prisma.consumption.findMany({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log(`\n消費レコード (Consumption): ${consumptions.length}件`)
    const totalConsumed = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0)
    console.log(`  合計消費日数: ${totalConsumed}日`)
    for (const c of consumptions) {
      console.log(`  - 日付: ${c.date.toISOString().slice(0, 10)}, 使用日数: ${c.daysUsed}日, ロットID: ${c.lotId}`)
    }

    // 古いvacationRequestテーブルも確認（存在する場合）
    try {
      const oldApprovedRequests = await prisma.vacationRequest.findMany({
        where: {
          employeeId: employee.id,
          status: 'APPROVED'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (oldApprovedRequests.length > 0) {
        console.log(`\n承認済み申請 (古いvacationRequest): ${oldApprovedRequests.length}件`)
        for (const req of oldApprovedRequests) {
          console.log(`  - ID: ${req.id}`)
          console.log(`    期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
          console.log(`    日数: ${req.usedDays || 'N/A'}`)
          console.log(`    承認日: ${req.approvedAt ? req.approvedAt.toISOString().slice(0, 10) : 'N/A'}`)
        }
      }
    } catch (error) {
      // テーブルが存在しない場合は無視
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkApprovedRequests()

