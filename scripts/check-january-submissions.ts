import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 大澤仁志さんのワーカー情報を確認します...\n')

    // 大澤さんのEmployee情報を取得
    const employee = await prisma.employee.findFirst({
        where: { name: { contains: '大澤' } }
    })

    if (!employee) {
        console.log('❌ 大澤さんが見つかりません')
        return
    }

    console.log(`✅ 社員情報: ${employee.name} (ID: ${employee.id})\n`)

    // WorkClockWorkerを検索
    const worker = await prisma.workClockWorker.findUnique({
        where: { employeeId: employee.id },
        include: {
            checklistSubmissions: {
                where: {
                    date: {
                        gte: new Date(2026, 0, 1),
                        lte: new Date(2026, 0, 31),
                    }
                },
                include: {
                    items: true,
                    photos: true,
                },
                orderBy: { date: 'asc' }
            }
        }
    })

    if (!worker) {
        console.log('❌ WorkClockWorkerとして登録されていません')

        // 全ワーカーの2026年1月のチェックリストを確認
        console.log('\n📋 全ワーカーの2026年1月チェックリスト提出状況:\n')

        const allWorkers = await prisma.workClockWorker.findMany({
            include: {
                checklistSubmissions: {
                    where: {
                        date: {
                            gte: new Date(2026, 0, 1),
                            lte: new Date(2026, 0, 31),
                        }
                    },
                    orderBy: { date: 'asc' }
                }
            }
        })

        allWorkers.forEach(w => {
            if (w.checklistSubmissions.length > 0) {
                console.log(`${w.name}:`)
                const days = w.checklistSubmissions.map(s => new Date(s.date).getDate())
                console.log(`  提出日: ${days.join(', ')}日`)
                console.log(`  ワーカーID: ${w.id}\n`)
            }
        })

        return
    }

    console.log(`✅ ワーカー情報:`)
    console.log(`   ワーカー名: ${worker.name}`)
    console.log(`   ワーカーID: ${worker.id}`)
    console.log(`   2026年1月のチェックリスト提出: ${worker.checklistSubmissions.length}件\n`)

    if (worker.checklistSubmissions.length > 0) {
        console.log('📅 2026年1月の提出データ:')
        worker.checklistSubmissions.forEach(sub => {
            const date = new Date(sub.date)
            const day = date.getDate()
            const hasChecked = sub.items.some(item => item.isChecked)
            const hasFreeText = sub.items.some(item => item.isFreeText && item.freeTextValue?.trim())

            console.log(`   ${day}日: ID=${sub.id}, 項目=${sub.items.length}, チェック=${hasChecked ? 'あり' : 'なし'}, テキスト=${hasFreeText ? 'あり' : 'なし'}`)
        })
    }
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
