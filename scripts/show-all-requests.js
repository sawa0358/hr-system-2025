const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showAllRequests() {
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

    // 全申請を取得
    const allRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`全申請: ${allRequests.length}件\n`)
    console.log('='.repeat(80))

    allRequests.forEach((req, index) => {
      console.log(`\n申請 ${index + 1}:`)
      console.log(`  ID: ${req.id}`)
      console.log(`  開始日: ${req.startDate.toISOString().slice(0, 10)}`)
      console.log(`  終了日: ${req.endDate.toISOString().slice(0, 10)}`)
      console.log(`  日数: ${req.totalDays || '未計算'}`)
      console.log(`  単位: ${req.unit}`)
      console.log(`  ステータス: ${req.status}`)
      console.log(`  理由: ${req.reason || 'なし'}`)
      console.log(`  作成日時: ${req.createdAt.toISOString()}`)
      console.log(`  更新日時: ${req.updatedAt.toISOString()}`)
      if (req.status === 'APPROVED' && req.approvedAt) {
        console.log(`  承認日時: ${req.approvedAt.toISOString()}`)
      }
    })

    // 統計情報
    const pendingCount = allRequests.filter(r => r.status === 'PENDING').length
    const approvedCount = allRequests.filter(r => r.status === 'APPROVED').length
    const rejectedCount = allRequests.filter(r => r.status === 'REJECTED').length

    console.log('\n' + '='.repeat(80))
    console.log('\n統計:')
    console.log(`  承認待ち: ${pendingCount}件`)
    console.log(`  承認済み: ${approvedCount}件`)
    console.log(`  却下済み: ${rejectedCount}件`)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showAllRequests()

