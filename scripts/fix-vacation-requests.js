const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixVacationRequests() {
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

    // PENDINGでtotalDaysがnullの申請を取得
    const pendingRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'PENDING',
        OR: [
          { totalDays: null },
          { totalDays: 0 }
        ]
      }
    })

    console.log(`日数未計算の承認待ち申請: ${pendingRequests.length}件\n`)

    for (const req of pendingRequests) {
      console.log(`申請ID: ${req.id}`)
      console.log(`  開始日: ${req.startDate.toISOString().slice(0, 10)}`)
      console.log(`  終了日: ${req.endDate.toISOString().slice(0, 10)}`)
      
      // 日数を計算
      const start = new Date(req.startDate)
      const end = new Date(req.endDate)
      const diffMs = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
      const totalDays = Math.round(Math.max(1, diffDays) * 2) / 2 // 0.5日単位で丸める
      
      console.log(`  計算された日数: ${totalDays}日`)

      // 日数を更新
      await prisma.timeOffRequest.update({
        where: { id: req.id },
        data: { totalDays: totalDays }
      })

      console.log(`  ✓ 更新完了\n`)
    }

    // 重複している可能性のあるPENDING申請をチェック
    const allPending = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n承認待ち申請（全${allPending.length}件）:`)
    
    if (allPending.length > 1) {
      // 同じ日付範囲または近い日付範囲の申請をチェック
      const dateGroups = new Map()
      allPending.forEach(req => {
        const key = `${req.startDate.toISOString().slice(0, 10)}_${req.endDate.toISOString().slice(0, 10)}`
        if (!dateGroups.has(key)) {
          dateGroups.set(key, [])
        }
        dateGroups.get(key).push(req)
      })

      console.log('\n重複チェック:')
      dateGroups.forEach((group, key) => {
        if (group.length > 1) {
          console.log(`\n⚠️  重複検出: 同じ日付範囲の申請が${group.length}件`)
          group.forEach(req => {
            console.log(`    - ID: ${req.id}`)
            console.log(`      作成日時: ${req.createdAt.toISOString()}`)
            console.log(`      日数: ${req.totalDays || '未計算'}`)
          })
          console.log(`\n     → 最新の申請以外を削除することを推奨します`)
        }
      })
    }

    console.log('\n✓ 処理完了')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixVacationRequests()

