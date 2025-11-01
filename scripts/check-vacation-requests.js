const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVacationRequests() {
  try {
    // ippan社員を検索
    const employee = await prisma.employee.findFirst({
      where: {
        name: {
          contains: 'ippan'
        }
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
      }
    })

    if (!employee) {
      console.log('ippan社員が見つかりません')
      return
    }

    console.log(`\n社員情報:`)
    console.log(`  ID: ${employee.id}`)
    console.log(`  名前: ${employee.name}`)
    console.log(`  社員ID: ${employee.employeeId}`)

    // 該当社員の申請を取得
    const requests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n申請一覧（全${requests.length}件）:`)
    console.log('─'.repeat(80))

    requests.forEach((req, index) => {
      console.log(`\n申請 ${index + 1}:`)
      console.log(`  ID: ${req.id}`)
      console.log(`  開始日: ${req.startDate.toISOString().slice(0, 10)}`)
      console.log(`  終了日: ${req.endDate.toISOString().slice(0, 10)}`)
      console.log(`  日数: ${req.totalDays || '未計算'}`)
      console.log(`  ステータス: ${req.status}`)
      console.log(`  理由: ${req.reason || 'なし'}`)
      console.log(`  作成日時: ${req.createdAt.toISOString()}`)
      console.log(`  更新日時: ${req.updatedAt.toISOString()}`)
    })

    // 重複している可能性のある申請を検出
    const pendingRequests = requests.filter(r => r.status === 'PENDING')
    console.log(`\n承認待ち申請: ${pendingRequests.length}件`)
    
    if (pendingRequests.length > 1) {
      console.log('\n⚠️  警告: 承認待ち申請が複数件存在します。重複の可能性があります。')
      
      // 同じ日付範囲の申請をチェック
      const dateGroups = new Map()
      pendingRequests.forEach(req => {
        const key = `${req.startDate.toISOString().slice(0, 10)}_${req.endDate.toISOString().slice(0, 10)}`
        if (!dateGroups.has(key)) {
          dateGroups.set(key, [])
        }
        dateGroups.get(key).push(req)
      })

      dateGroups.forEach((group, key) => {
        if (group.length > 1) {
          console.log(`\n⚠️  重複検出: 同じ日付範囲の申請が${group.length}件`)
          group.forEach(req => {
            console.log(`    - ID: ${req.id}, 作成日時: ${req.createdAt.toISOString()}`)
          })
        }
      })
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVacationRequests()

