const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportDatabase() {
  console.log('現在のDBの内容をエクスポートしています...')
  
  try {
    // 全テーブルのデータを取得
    const data = {
      employees: await prisma.employee.findMany(),
      workspaces: await prisma.workspace.findMany(),
      boards: await prisma.board.findMany(),
      boardLists: await prisma.boardList.findMany(),
      cards: await prisma.card.findMany(),
      cardMembers: await prisma.cardMember.findMany(),
      tasks: await prisma.task.findMany(),
      evaluations: await prisma.evaluation.findMany(),
      attendances: await prisma.attendance.findMany(),
      payrolls: await prisma.payroll.findMany(),
      files: await prisma.file.findMany(),
      folders: await prisma.folder.findMany(),
      familyMembers: await prisma.familyMember.findMany(),
      activityLogs: await prisma.activityLog.findMany(),
    }

    // エクスポートファイル名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `current-db-backup-${timestamp}.json`
    const filepath = path.join(__dirname, '..', filename)

    // JSONファイルとして保存
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
    
    console.log(`✅ DBのエクスポートが完了しました: ${filename}`)
    console.log(`📊 エクスポートされたデータ:`)
    Object.entries(data).forEach(([table, records]) => {
      console.log(`  - ${table}: ${records.length}件`)
    })

  } catch (error) {
    console.error('❌ DBエクスポート中にエラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportDatabase()
