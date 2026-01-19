
import { prisma } from './lib/prisma'

async function main() {
    console.log('Deleting all Thank You submission items...')

    // 1. Delete all submission items with title 'ありがとう送信'
    const deleteItems = await prisma.personnelEvaluationSubmissionItem.deleteMany({
        where: {
            title: 'ありがとう送信'
        }
    })
    console.log(`Deleted ${deleteItems.count} items.`)

    console.log('Deleting all Thank You point logs...')

    // 2. Delete all point logs related to thank yous
    const deleteLogs = await prisma.personnelEvaluationPointLog.deleteMany({
        where: {
            type: {
                in: ['thank_you_sent', 'thank_you_received']
            }
        }
    })
    console.log(`Deleted ${deleteLogs.count} point logs.`)

    console.log('Cleanup complete.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
