import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 堀之内健二さんのチェックリスト提出データを確認します...\n')

    // 堀之内健二さんのワーカー情報を取得
    const worker = await prisma.workClockWorker.findFirst({
        where: { name: '堀之内健二' }
    })

    if (!worker) {
        console.error('❌ 堀之内健二さんのワーカー情報が見つかりません')
        return
    }

    console.log(`✅ ワーカーID: ${worker.id}`)
    console.log(`✅ 名前: ${worker.name}\n`)

    // 2026年1月の対象日付
    const targetDates = [6, 7, 9, 13, 15]
    const year = 2026
    const month = 1

    // バックアップディレクトリ作成
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const backupFile = path.join(backupDir, `checklist-backup-${timestamp}.json`)

    // 対象データを取得してバックアップ
    const submissions = []

    for (const day of targetDates) {
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

        const submission = await prisma.workClockChecklistSubmission.findFirst({
            where: {
                workerId: worker.id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                items: true,
                photos: true,
            },
        })

        if (submission) {
            submissions.push({
                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                submission,
            })

            // 内容確認
            const hasChecked = submission.items.some(item => item.isChecked)
            const hasFreeText = submission.items.some(item => item.isFreeText && item.freeTextValue?.trim())

            console.log(`📅 ${year}年${month}月${day}日:`)
            console.log(`   - 提出ID: ${submission.id}`)
            console.log(`   - 項目数: ${submission.items.length}`)
            console.log(`   - チェック済み項目: ${hasChecked ? 'あり' : 'なし'}`)
            console.log(`   - フリーテキスト入力: ${hasFreeText ? 'あり' : 'なし'}`)
            console.log(`   - 写真: ${submission.photos.length}枚`)
            console.log()
        } else {
            console.log(`📅 ${year}年${month}月${day}日: データなし`)
        }
    }

    if (submissions.length === 0) {
        console.log('ℹ️  削除対象のデータが見つかりませんでした')
        return
    }

    // バックアップを保存
    fs.writeFileSync(backupFile, JSON.stringify(submissions, null, 2))
    console.log(`\n💾 バックアップを保存しました: ${backupFile}`)
    console.log(`\n⚠️  削除対象: ${submissions.length}件\n`)

    // 削除確認（スクリプト実行時に環境変数で制御）
    if (process.env.CONFIRM_DELETE === 'yes') {
        console.log('🗑️  削除を実行します...\n')

        for (const { date, submission } of submissions) {
            await prisma.workClockChecklistSubmission.delete({
                where: { id: submission.id }
            })
            console.log(`✅ ${date} のデータを削除しました (ID: ${submission.id})`)
        }

        console.log('\n✨ 削除が完了しました')
    } else {
        console.log('ℹ️  削除を実行するには、以下のコマンドを実行してください:')
        console.log(`   CONFIRM_DELETE=yes npx tsx scripts/delete-empty-checklist.ts`)
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
