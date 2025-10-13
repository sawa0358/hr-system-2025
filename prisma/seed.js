const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('シードデータの投入を開始します...')

  // 既存のデータをクリア
  await prisma.activityLog.deleteMany()
  await prisma.file.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.payroll.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.task.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.employee.deleteMany()

  // 社員データの作成
  const employees = [
    {
      employeeId: "EMP-2015-001",
      employeeNumber: "EMP-2015-001",
      employeeType: "employee",
      name: "admin",
      email: "admin@company.com",
      phone: "090-0000-0000",
      department: "総務・管理者",
      position: "システム管理者",
      organization: "株式会社テックイノベーション",
      team: "システム管理",
      joinDate: new Date("2015-01-01"),
      status: "active",
      password: "admin",
      role: "admin",
    },
    {
      employeeId: "EMP-2015-002",
      employeeNumber: "EMP-2015-002",
      employeeType: "employee",
      name: "manager",
      email: "manager@company.com",
      phone: "090-0000-0001",
      department: "総務・管理者",
      position: "管理者",
      organization: "株式会社テックイノベーション",
      team: "管理",
      joinDate: new Date("2015-01-01"),
      status: "active",
      password: "manager",
      role: "manager",
    },
    {
      employeeId: "EMP-2016-001",
      employeeNumber: "EMP-2016-001",
      employeeType: "employee",
      name: "sub",
      email: "sub@company.com",
      phone: "090-0000-0002",
      department: "営業部",
      position: "サブマネージャー",
      organization: "株式会社テックイノベーション",
      team: "営業",
      joinDate: new Date("2016-01-01"),
      status: "active",
      password: "sub",
      role: "sub_manager",
    },
    {
      employeeId: "EMP-2017-001",
      employeeNumber: "EMP-2017-001",
      employeeType: "employee",
      name: "ippan",
      email: "ippan@company.com",
      phone: "090-0000-0003",
      department: "営業部",
      position: "一般社員",
      organization: "株式会社テックイノベーション",
      team: "営業",
      joinDate: new Date("2017-01-01"),
      status: "active",
      password: "ippan",
      role: "general",
    },
    {
      employeeId: "EMP-2018-001",
      employeeNumber: "EMP-2018-001",
      employeeType: "employee",
      name: "etsuran",
      email: "etsuran@company.com",
      phone: "090-0000-0004",
      department: "総務部",
      position: "閲覧者",
      organization: "株式会社テックイノベーション",
      team: "総務",
      joinDate: new Date("2018-01-01"),
      status: "active",
      password: "etsuran",
      role: "viewer",
    }
  ]

  // 社員データをデータベースに挿入
  for (const employeeData of employees) {
    const employee = await prisma.employee.create({
      data: employeeData
    })
    console.log(`社員を作成しました: ${employee.name} (${employee.role})`)
  }

  // ワークスペースの作成
  const adminEmployee = await prisma.employee.findFirst({
    where: { role: 'admin' }
  })

  if (adminEmployee) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "デフォルトワークスペース",
        description: "初期のワークスペース",
        createdBy: adminEmployee.id,
      },
    })

    // ワークスペースメンバーの追加
    const allEmployees = await prisma.employee.findMany()
    await prisma.workspaceMember.createMany({
      data: allEmployees.map(emp => ({
        workspaceId: workspace.id,
        employeeId: emp.id,
        role: emp.role === 'admin' ? 'workspace_admin' : 'workspace_member',
      })),
    })
    console.log('ワークスペースを作成しました:', workspace.name)

    // デフォルトボードを作成
    const board = await prisma.board.create({
      data: {
        name: "メインボード",
        description: "デフォルトのボードです",
        workspaceId: workspace.id,
        createdBy: adminEmployee.id,
      },
    })

    // デフォルトリストを作成
    const defaultLists = [
      { title: "常時運用タスク", position: 0 },
      { title: "予定リスト", position: 1 },
      { title: "進行中", position: 2 },
      { title: "完了", position: 3 },
    ]

    for (const list of defaultLists) {
      await prisma.boardList.create({
        data: {
          title: list.title,
          position: list.position,
          boardId: board.id,
        },
      })
    }
    console.log('デフォルトボードとリストを作成しました')
  }

  console.log('シードデータの投入が完了しました')
}

main()
  .catch((e) => {
    console.error('シードデータの投入でエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
