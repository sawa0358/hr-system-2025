const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listAllEmployeesRequests() {
  try {
    // 全社員を取得
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        employeeId: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`\n全社員数: ${employees.length}人\n`)

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

    console.log(`全申請数: ${allRequests.length}件\n`)

    // 社員ごとに集計
    for (const employee of employees) {
      const employeeRequests = allRequests.filter(req => req.employeeId === employee.id)
      
      if (employeeRequests.length > 0) {
        console.log(`社員: ${employee.name} (ID: ${employee.employeeId})`)
        console.log(`  申請数: ${employeeRequests.length}件`)
        
        // 状態別に集計
        const byStatus = {
          PENDING: [],
          APPROVED: [],
          REJECTED: []
        }
        
        for (const req of employeeRequests) {
          const status = req.status?.toUpperCase() || 'PENDING'
          if (byStatus[status]) {
            byStatus[status].push(req)
          }
        }
        
        if (byStatus.PENDING.length > 0) {
          const totalPending = byStatus.PENDING.reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)
          console.log(`  申請中: ${byStatus.PENDING.length}件 (合計 ${totalPending}日)`)
        }
        
        if (byStatus.APPROVED.length > 0) {
          const totalApproved = byStatus.APPROVED.reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)
          console.log(`  承認済み: ${byStatus.APPROVED.length}件 (合計 ${totalApproved}日)`)
        }
        
        if (byStatus.REJECTED.length > 0) {
          const totalRejected = byStatus.REJECTED.reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)
          console.log(`  却下: ${byStatus.REJECTED.length}件 (合計 ${totalRejected}日)`)
        }
        
        console.log('')
        
        // 詳細
        for (const req of employeeRequests) {
          console.log(`    - ID: ${req.id}`)
          console.log(`      期間: ${req.startDate.toISOString().slice(0, 10)}〜${req.endDate.toISOString().slice(0, 10)}`)
          console.log(`      状態: ${req.status}`)
          console.log(`      日数: ${req.totalDays || req.days || 'N/A'}`)
          console.log(`      理由: ${req.reason || 'N/A'}`)
          console.log(`      作成日: ${req.createdAt.toISOString().slice(0, 10)}`)
        }
        console.log('')
      }
    }

    // 全体集計
    const totalPending = allRequests
      .filter(r => r.status?.toUpperCase() === 'PENDING')
      .reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)
    const totalApproved = allRequests
      .filter(r => r.status?.toUpperCase() === 'APPROVED')
      .reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)
    const totalRejected = allRequests
      .filter(r => r.status?.toUpperCase() === 'REJECTED')
      .reduce((sum, r) => sum + Number(r.totalDays || r.days || 0), 0)

    console.log('\n=== 全体集計 ===')
    console.log(`申請中: ${totalPending}日`)
    console.log(`承認済み: ${totalApproved}日`)
    console.log(`却下: ${totalRejected}日`)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllEmployeesRequests()

