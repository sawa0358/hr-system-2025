import { PrismaClient } from '@prisma/client'

// 本番環境のDATABASE_URLを使用
const DATABASE_URL = process.env.PRODUCTION_DATABASE_URL
const CONFIRM_DELETE = process.env.CONFIRM_DELETE
const WORKER_ID = process.env.WORKER_ID

if (!DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL環境変数が設定されていません')
    process.exit(1)
}

if (!WORKER_ID) {
    console.error('❌ WORKER_ID環境変数が設定されていません')
    process.exit(1)
}

if (CONFIRM_DELETE !== 'yes') {
    console.error('❌ 削除を実行するには CONFIRM_DELETE=yes を設定してください')
    process.exit(1)
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
})

async function main() {
    console.log('🗑️  本番環境でチェックリストデータを削除します...\n')
    console.log('⚠️  本番環境のデータベースに接続しています\n')
    console.log(`ワーカーID: ${WORKER_ID}\n`)

    // 2026年1月の対象日付
    const targetDates = [6, 7, 9, 13, 15]
    const year = 2026
    const month = 1

    let deletedCount = 0

    for (const day of targetDates) {
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

        const submission = await prisma.workClockChecklistSubmission.findFirst({
            where: {
                workerId: WORKER_ID,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                id: true,
            }
        })

        if (submission) {
            console.log(`🗑️  ${year}年${month}月${day}日のデータを削除中... (ID: ${submission.id})`)

            // カスケード削除により、関連するitemsとphotosも自動削除されます
            await prisma.workClockChecklistSubmission.delete({
                where: { id: submission.id }
            })

            console.log(`✅ 削除完了\n`)
            deletedCount++
        } else {
            console.log(`ℹ️  ${year}年${month}月${day}日: データなし\n`)
        }
    }

    console.log(`\n✨ 削除処理が完了しました`)
    console.log(`削除件数: ${deletedCount}件\n`)
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
