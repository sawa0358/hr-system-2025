import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 雇用形態「業務委託」から堀之内健二さんを検索します...\n')

    // 雇用形態が「業務委託」の社員を検索
    const employee = await prisma.employee.findFirst({
        where: {
            name: '堀之内健二',
            employeeType: { contains: '業務委託' }
        },
        select: {
            id: true,
            name: true,
            email: true,
            employeeType: true,
        }
    })

    if (!employee) {
        console.log('❌ 堀之内健二さん（業務委託）が見つかりません')
        console.log('\n📋 業務委託の社員リスト:')
        const contractors = await prisma.employee.findMany({
            where: { employeeType: { contains: '業務委託' } },
            select: { id: true, name: true, employeeType: true },
            orderBy: { name: 'asc' }
        })
        contractors.forEach((emp, i) => {
            console.log(`${i + 1}. ${emp.name} (${emp.employeeType})`)
        })
        return
    }

    console.log(`✅ 社員情報:`)
    console.log(`   名前: ${employee.name}`)
    console.log(`   雇用形態: ${employee.employeeType}`)
    console.log(`   ID: ${employee.id}\n`)

    // WorkClockWorkerを検索
    const worker = await prisma.workClockWorker.findUnique({
        where: { employeeId: employee.id }
    })

    if (!worker) {
        console.log('❌ WorkClockWorkerとして登録されていません')
        return
    }

    console.log(`✅ ワーカー情報:`)
    console.log(`   ワーカー名: ${worker.name}`)
    console.log(`   ワーカーID: ${worker.id}\n`)

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

    console.log('📅 対象日付のデータを確認します:\n')

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
        console.log('\nℹ️  削除対象のデータが見つかりませんでした')
        return
    }

    // バックアップを保存
    fs.writeFileSync(backupFile, JSON.stringify(submissions, null, 2))
    console.log(`\n💾 バックアップを保存しました: ${backupFile}`)
    console.log(`\n⚠️  削除対象: ${submissions.length}件`)
    console.log(`\n削除を実行するには、以下のコマンドを実行してください:`)
    console.log(`CONFIRM_DELETE=yes WORKER_ID=${worker.id} npx tsx scripts/delete-checklist-data.ts\n`)
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
