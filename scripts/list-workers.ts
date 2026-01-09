import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📋 全ワーカーリストを表示します...\n')

    const workers = await prisma.workClockWorker.findMany({
        select: {
            id: true,
            name: true,
            employeeId: true,
        },
        orderBy: { name: 'asc' }
    })

    console.log(`全ワーカー数: ${workers.length}\n`)

    workers.forEach((worker, index) => {
        console.log(`${index + 1}. ${worker.name} (ID: ${worker.id}, employeeId: ${worker.employeeId})`)
    })
}

main()
    .catch((e) => {
        console.error('❌ エラーが発生しました:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
