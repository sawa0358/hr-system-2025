const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupDuplicateRequests() {
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

    // 承認待ち申請を取得（作成日時の降順）
    const pendingRequests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: employee.id,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`承認待ち申請: ${pendingRequests.length}件\n`)

    if (pendingRequests.length > 1) {
      console.log('重複する承認待ち申請を検出しました。\n')
      
      // 同じ日付範囲または近い日付範囲の申請をグループ化
      const dateGroups = new Map()
      pendingRequests.forEach(req => {
        const key = `${req.startDate.toISOString().slice(0, 10)}_${req.endDate.toISOString().slice(0, 10)}`
        if (!dateGroups.has(key)) {
          dateGroups.set(key, [])
        }
        dateGroups.get(key).push(req)
      })

      let deletedCount = 0

      for (const [key, group] of dateGroups.entries()) {
        if (group.length > 1) {
          console.log(`\n同じ日付範囲の申請が${group.length}件:`)
          
          // 最新の申請以外を削除（totalDaysが設定されている方を優先）
          const sortedGroup = group.sort((a, b) => {
            // まずtotalDaysがある方を優先
            if (a.totalDays && !b.totalDays) return -1
            if (!a.totalDays && b.totalDays) return 1
            // 次に作成日時が新しい方を優先
            return new Date(b.createdAt) - new Date(a.createdAt)
          })

          const keepRequest = sortedGroup[0]
          const deleteRequests = sortedGroup.slice(1)

          console.log(`  保持: ID ${keepRequest.id} (作成: ${keepRequest.createdAt.toISOString()}, 日数: ${keepRequest.totalDays || '未計算'})`)
          
          deleteRequests.forEach(req => {
            console.log(`  削除: ID ${req.id} (作成: ${req.createdAt.toISOString()}, 日数: ${req.totalDays || '未計算'})`)
          })

          // 古い申請を削除
          for (const req of deleteRequests) {
            await prisma.timeOffRequest.delete({
              where: { id: req.id }
            })
            deletedCount++
            console.log(`  ✓ 削除完了: ${req.id}`)
          }
        }
      }

      console.log(`\n✓ 合計${deletedCount}件の重複申請を削除しました`)
    } else {
      console.log('重複申請は見つかりませんでした')
    }

    console.log('\n✓ 処理完了')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateRequests()

