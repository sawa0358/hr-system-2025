import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 「堀之内健二」さんを検索します...\n')

    // Employeeテーブルから検索
    const employee = await prisma.employee.findFirst({
        where: {
            OR: [
                { name: { contains: '堀之内' } },
                { name: { contains: 'ほりのうち' } },
                { name: { contains: 'Horinouchi' } },
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
        }
    })

    if (!employee) {
        console.log('❌ Employeeテーブルに該当する社員が見つかりません')
        console.log('\n📋 全社員リスト（名前のみ）:')
        const allEmployees = await prisma.employee.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
            take: 20
        })
        allEmployees.forEach((emp, i) => {
            console.log(`${i + 1}. ${emp.name} (ID: ${emp.id})`)
        })
        return
    }

    console.log(`✅ 社員情報:`)
    console.log(`   名前: ${employee.name}`)
    console.log(`   ID: ${employee.id}`)
    console.log(`   メール: ${employee.email}\n`)

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
