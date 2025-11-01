const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listAllRequests() {
  try {
    // 全申請を取得
    const allRequests = await prisma.timeOffRequest.findMany({
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n全申請: ${allRequests.length}件\n`)

    // 社員ごとにグループ化
    const requestsByEmployee = new Map()
    for (const req of allRequests) {
      const empName = req.employee.name
      if (!requestsByEmployee.has(empName)) {
        requestsByEmployee.set(empName, [])
      }
      requestsByEmployee.get(empName).push(req)
    }

    for (const [empName, requests] of requestsByEmployee.entries()) {
      console.log(`社員: ${empName} (${requests.length}件)`)
      for (const req of requests) {
        console.log(`  - ID: ${req.id}`)
        console.log(`    期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
        console.log(`    状態: ${req.status}`)
        console.log(`    日数: ${req.totalDays || req.days || 'N/A'}`)
        console.log(`    作成日: ${req.createdAt.toISOString().slice(0, 10)}`)
      }
      console.log('')
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllRequests()

