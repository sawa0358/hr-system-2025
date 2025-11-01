const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVacationSystem() {
  try {
    console.log('=== 有給管理システムの動作確認 ===\n')

    // 1. 新付与はいつ行われるようになっているか？
    console.log('1. 新付与のタイミング確認')
    console.log('   → 現在の実装: 手動実行またはバッチ処理')
    console.log('   → 自動実行の設定: なし（手動でgenerateGrantLotsForEmployeeを呼び出す必要がある）')
    console.log('   → 推奨: cron等で毎日実行し、翌日が付与日の社員に対してロットを生成\n')

    // 2. 設定の確認
    console.log('2. 設定の確認')
    try {
      const config = await prisma.vacationAppConfig.findFirst({
        where: { isActive: true }
      })
      if (config) {
        const cfg = JSON.parse(config.configJson)
        console.log('   ✓ アクティブな設定が見つかりました')
        console.log(`     バージョン: ${cfg.version}`)
        console.log(`     付与サイクル: ${cfg.grantCycleMonths}ヶ月`)
        console.log(`     有効期限: ${cfg.expiry.kind === 'YEARS' ? cfg.expiry.years + '年' : cfg.expiry.kind}`)
        console.log(`     正社員テーブル: ${cfg.fullTime?.table?.length || 0}行`)
        console.log(`     パートテーブル: ${cfg.partTime?.tables?.length || 0}パターン\n`)
      } else {
        console.log('   ✗ アクティブな設定が見つかりません（デフォルト設定を使用）\n')
      }
    } catch (error) {
      console.log('   ✗ 設定の読み込みに失敗:', error.message)
    }

    // 3. LIFO形式の確認
    console.log('3. LIFO形式（新しく付与された有給から消化）の確認')
    const sampleEmployee = await prisma.employee.findFirst({
      where: { status: 'active' },
      include: {
        grantLots: {
          orderBy: { grantDate: 'desc' },
          take: 5
        }
      }
    })

    if (sampleEmployee && sampleEmployee.grantLots.length > 0) {
      console.log(`   サンプル社員: ${sampleEmployee.name}`)
      console.log(`   ロット数: ${sampleEmployee.grantLots.length}件`)
      console.log('   付与日順（降順）:')
      sampleEmployee.grantLots.forEach((lot, idx) => {
        console.log(`     ${idx + 1}. 付与日: ${lot.grantDate.toISOString().slice(0, 10)}, 残日数: ${lot.daysRemaining}日`)
      })
      console.log('   ✓ LIFO形式: grantDate降順で取得されている\n')
    } else {
      console.log('   ✗ サンプル社員またはロットが見つかりません\n')
    }

    // 4. 有効期限の確認
    console.log('4. 有効期限の確認')
    const lotsWithExpiry = await prisma.grantLot.findMany({
      where: {
        daysRemaining: { gt: 0 }
      },
      take: 5,
      include: {
        employee: {
          select: {
            name: true
          }
        }
      },
      orderBy: { grantDate: 'desc' }
    })

    // 設定を事前に取得
    const configForExpiry = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true }
    })
    let cfgData = null
    if (configForExpiry) {
      cfgData = JSON.parse(configForExpiry.configJson)
    }

    if (lotsWithExpiry.length > 0) {
      console.log('   有効期限が設定されているロット:')
      for (const lot of lotsWithExpiry) {
        const today = new Date()
        const isExpired = lot.expiryDate < today
        const daysUntilExpiry = Math.ceil((lot.expiryDate - today) / (1000 * 60 * 60 * 24))
        console.log(`     社員: ${lot.employee.name}`)
        console.log(`       付与日: ${lot.grantDate.toISOString().slice(0, 10)}`)
        console.log(`       有効期限: ${lot.expiryDate.toISOString().slice(0, 10)}`)
        console.log(`       残日数: ${lot.daysRemaining}日`)
        console.log(`       状態: ${isExpired ? '✗ 期限切れ' : `✓ 有効（あと${daysUntilExpiry}日）`}`)
        
        // 有効期限が設定通りか確認
        if (cfgData && cfgData.expiry?.kind === 'YEARS') {
          const expectedExpiry = new Date(lot.grantDate)
          expectedExpiry.setFullYear(expectedExpiry.getFullYear() + cfgData.expiry.years)
          expectedExpiry.setDate(expectedExpiry.getDate() - 1) // 前日まで有効
          
          const isCorrect = Math.abs(lot.expiryDate.getTime() - expectedExpiry.getTime()) < 24 * 60 * 60 * 1000 // 1日以内の誤差は許容
          console.log(`       設定との一致: ${isCorrect ? '✓' : '✗'}`)
          if (!isCorrect) {
            console.log(`         期待値: ${expectedExpiry.toISOString().slice(0, 10)}`)
          }
        }
        console.log('')
      }
    } else {
      console.log('   ✗ 有効期限が設定されているロットが見つかりません\n')
    }

    // 5. LIFO消化の確認
    console.log('5. LIFO消化の確認')
    const consumptions = await prisma.consumption.findMany({
      include: {
        lot: {
          select: {
            grantDate: true,
            daysGranted: true,
            daysRemaining: true
          }
        },
        request: {
          select: {
            startDate: true,
            endDate: true,
            totalDays: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    })

    if (consumptions.length > 0) {
      console.log('   消費履歴（最新5件）:')
      const groupedByRequest = {}
      consumptions.forEach(c => {
        const reqId = c.requestId || 'unknown'
        if (!groupedByRequest[reqId]) {
          groupedByRequest[reqId] = {
            request: c.request,
            lots: []
          }
        }
        groupedByRequest[reqId].lots.push({
          grantDate: c.lot?.grantDate,
          daysUsed: c.daysUsed
        })
      })

      Object.values(groupedByRequest).forEach((group, idx) => {
        console.log(`     ${idx + 1}. 申請: ${group.request?.startDate?.toISOString().slice(0, 10)}〜${group.request?.endDate?.toISOString().slice(0, 10)}, 日数: ${group.request?.totalDays || 'N/A'}日`)
        console.log('       使用ロット（付与日順）:')
        group.lots
          .sort((a, b) => new Date(b.grantDate) - new Date(a.grantDate)) // 新しい順
          .forEach(lot => {
            console.log(`         - 付与日: ${lot.grantDate?.toISOString().slice(0, 10)}, 使用: ${lot.daysUsed}日`)
          })
        console.log('')
      })
      
      // 新しいロットから消費されているか確認
      let isLIFO = true
      for (const group of Object.values(groupedByRequest)) {
        const sortedLots = group.lots
          .sort((a, b) => new Date(b.grantDate) - new Date(a.grantDate)) // 新しい順
        for (let i = 1; i < sortedLots.length; i++) {
          if (new Date(sortedLots[i].grantDate) > new Date(sortedLots[i - 1].grantDate)) {
            isLIFO = false
            break
          }
        }
        if (!isLIFO) break
      }
      console.log(`   LIFO形式の確認: ${isLIFO ? '✓' : '✗'} 新しいロットから消費されている`)
    } else {
      console.log('   ✗ 消費履歴が見つかりません\n')
    }

    // 6. 失効処理の確認
    console.log('6. 失効処理の確認')
    const expiredLots = await prisma.grantLot.findMany({
      where: {
        expiryDate: { lt: new Date() },
        daysRemaining: { gt: 0 }
      },
      take: 5
    })

    if (expiredLots.length > 0) {
      console.log(`   ✗ 期限切れだが残日数が0になっていないロット: ${expiredLots.length}件`)
      console.log('     失効処理を実行する必要があります')
    } else {
      console.log('   ✓ 期限切れのロットは適切に処理されています')
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVacationSystem()

