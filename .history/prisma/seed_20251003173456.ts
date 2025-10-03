import { PrismaClient } from '@prisma/client'

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
      employeeType: "employee" as const,
      name: "admin",
      email: "admin@company.com",
      phone: "090-0000-0000",
      department: "総務・管理者",
      position: "システム管理者",
      organization: "株式会社テックイノベーション",
      team: "システム管理",
      joinDate: new Date("2015-01-01"),
      status: "active" as const,
      password: "admin",
      role: "admin" as const,
    },
    {
      employeeId: "EMP-2015-002",
      employeeNumber: "EMP-2015-002",
      employeeType: "employee" as const,
      name: "manager",
      email: "manager@company.com",
      phone: "090-0000-0001",
      department: "総務・管理者",
      position: "管理者",
      organization: "株式会社テックイノベーション",
      team: "管理",
      joinDate: new Date("2015-01-01"),
      status: "active" as const,
      password: "manager",
      role: "manager" as const,
    },
    {
      employeeId: "EMP-2016-001",
      employeeNumber: "EMP-2016-001",
      employeeType: "employee" as const,
      name: "sub",
      email: "sub@company.com",
      phone: "090-0000-0002",
      department: "総務・管理者",
      position: "サブ管理者",
      organization: "株式会社テックイノベーション",
      team: "サブ管理",
      joinDate: new Date("2016-01-01"),
      status: "active" as const,
      password: "sub",
      role: "sub_manager" as const,
    },
    {
      employeeId: "EMP-2017-001",
      employeeNumber: "EMP-2017-001",
      employeeType: "employee" as const,
      name: "ippan",
      email: "ippan@company.com",
      phone: "090-0000-0003",
      department: "営業",
      position: "一般社員",
      organization: "株式会社テックイノベーション",
      team: "営業",
      joinDate: new Date("2017-01-01"),
      status: "active" as const,
      password: "ippan",
      role: "general" as const,
    },
    {
      employeeId: "EMP-2018-001",
      employeeNumber: "EMP-2018-001",
      employeeType: "employee" as const,
      name: "etsuran",
      email: "etsuran@company.com",
      phone: "090-0000-0004",
      department: "営業",
      position: "閲覧のみ",
      organization: "株式会社テックイノベーション",
      team: "営業",
      joinDate: new Date("2018-01-01"),
      status: "active" as const,
      password: "etsuran",
      role: "viewer" as const,
    },
    {
      employeeId: "EMP-2021-001",
      employeeNumber: "EMP-2021-001",
      employeeType: "employee" as const,
      name: "田中 太郎",
      email: "tanaka@company.com",
      phone: "090-1234-5678",
      department: "エンジニアリング",
      position: "シニアエンジニア",
      organization: "株式会社テックイノベーション",
      team: "バックエンドチーム",
      joinDate: new Date("2021-04-01"),
      status: "active" as const,
      password: "pass1234",
      role: "general" as const,
    },
    {
      employeeId: "EMP-2020-015",
      employeeNumber: "EMP-2020-015",
      employeeType: "employee" as const,
      name: "佐藤 花子",
      email: "sato@company.com",
      phone: "090-2345-6789",
      department: "営業",
      position: "営業マネージャー",
      organization: "株式会社テックイノベーション",
      team: "エンタープライズ営業",
      joinDate: new Date("2020-07-15"),
      status: "active" as const,
      password: "pass1234",
      role: "manager" as const,
    },
    {
      employeeId: "EMP-2022-032",
      employeeNumber: "EMP-2022-032",
      employeeType: "contractor" as const,
      name: "鈴木 一郎",
      email: "suzuki@company.com",
      phone: "090-3456-7890",
      department: "マーケティング",
      position: "マーケティングスペシャリスト",
      organization: "株式会社テックイノベーション",
      team: "デジタルマーケティング",
      joinDate: new Date("2022-01-10"),
      status: "active" as const,
      password: "pass1234",
      role: "general" as const,
    },
    {
      employeeId: "EMP-2019-008",
      employeeNumber: "EMP-2019-008",
      employeeType: "employee" as const,
      name: "高橋 美咲",
      email: "takahashi@company.com",
      phone: "090-4567-8901",
      department: "人事",
      position: "人事部長",
      organization: "株式会社テックイノベーション",
      team: "人事企画",
      joinDate: new Date("2019-03-20"),
      status: "active" as const,
      password: "pass1234",
      role: "hr" as const,
    },
    {
      employeeId: "EMP-2023-045",
      employeeNumber: "EMP-2023-045",
      employeeType: "employee" as const,
      name: "伊藤 健太",
      email: "ito@company.com",
      phone: "090-5678-9012",
      department: "エンジニアリング",
      position: "ジュニアエンジニア",
      organization: "株式会社テックイノベーション",
      team: "フロントエンドチーム",
      joinDate: new Date("2023-04-01"),
      status: "active" as const,
      password: "pass1234",
      role: "general" as const,
    }
  ]

  for (const employeeData of employees) {
    await prisma.employee.create({
      data: employeeData
    })
  }

  console.log('シードデータの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
