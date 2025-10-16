const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('既存社員のマイワークスペース作成を開始します...')

  try {
    // 全社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        isSuspended: false, // 停止中でない社員のみ
      },
    })

    console.log(`対象社員数: ${employees.length}名`)

    for (const employee of employees) {
      console.log(`\n処理中: ${employee.name} (${employee.id})`)

      // 既にマイワークスペースが存在するかチェック
      const existingWorkspace = await prisma.workspace.findFirst({
        where: {
          name: {
            contains: 'マイワークスペース',
          },
          createdBy: employee.id,
        },
      })

      if (existingWorkspace) {
        console.log(`  ✓ マイワークスペースは既に存在します: ${existingWorkspace.name}`)
        continue
      }

      // マイワークスペースを作成
      const myWorkspace = await prisma.workspace.create({
        data: {
          name: `${employee.name}のマイワークスペース`,
          description: '個人用のワークスペースです',
          createdBy: employee.id,
        },
      })

      console.log(`  ✓ マイワークスペース作成: ${myWorkspace.name}`)

      // ワークスペースメンバーに自分を追加
      await prisma.workspaceMember.create({
        data: {
          workspaceId: myWorkspace.id,
          employeeId: employee.id,
          role: 'workspace_admin',
        },
      })

      console.log(`  ✓ ワークスペースメンバー追加完了`)

      // デフォルトボード「マイボード」を作成
      const myBoard = await prisma.board.create({
        data: {
          name: 'マイボード',
          description: '個人用のボードです',
          workspaceId: myWorkspace.id,
          createdBy: employee.id,
        },
      })

      console.log(`  ✓ マイボード作成: ${myBoard.name}`)

      // デフォルトリストを作成
      const defaultLists = [
        { title: '常時運用タスク', position: 0 },
        { title: '予定リスト', position: 1 },
        { title: '進行中', position: 2 },
        { title: '完了', position: 3 },
      ]

      for (const list of defaultLists) {
        await prisma.boardList.create({
          data: {
            title: list.title,
            position: list.position,
            boardId: myBoard.id,
          },
        })
      }

      console.log(`  ✓ デフォルトリスト作成完了`)
    }

    console.log('\n✅ 全社員のマイワークスペース作成が完了しました！')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
