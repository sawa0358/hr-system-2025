const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 シードデータの投入を開始します...')

  // 基本社員データを作成
  const employees = [
    {
      id: 'cmgtfxlyt00008zx7gny1h5hn',
      employeeId: 'EMP-2015-001',
      employeeNumber: 'EMP-2015-001',
      employeeType: 'employee',
      name: 'admin',
      furigana: 'アドミン',
      email: 'admin@company.com',
      phone: '03-1234-5678',
      department: '["執行部"]',
      position: '["代表取締役"]',
      organization: '["本社"]',
      team: '',
      joinDate: new Date('2015-04-01'),
      status: 'active',
      password: 'admin123',
      role: 'admin',
      myNumber: null,
      userId: 'admin',
      url: '',
      address: '東京都渋谷区',
      selfIntroduction: 'システム管理者です',
      phoneInternal: '001',
      phoneMobile: '090-1234-5678',
      birthDate: new Date('1980-01-01'),
      showInOrgChart: true,
      parentEmployeeId: null,
      isInvisibleTop: false,
      isSuspended: false,
      retirementDate: null,
      privacyDisplayName: true,
      privacyOrganization: true,
      privacyDepartment: true,
      privacyPosition: true,
      privacyUrl: true,
      privacyAddress: true,
      privacyBio: true,
      privacyEmail: true,
      privacyWorkPhone: true,
      privacyExtension: true,
      privacyMobilePhone: true,
      privacyBirthDate: false,
      orgChartLabel: 'admin'
    },
    {
      id: 'cmgth6he100028z3i06ps75c7',
      employeeId: 'EMP-2015-002',
      employeeNumber: 'EMP-2015-002',
      employeeType: 'employee',
      name: 'manager',
      furigana: 'マネージャー',
      email: 'manager@company.com',
      phone: '03-1234-5679',
      department: '["広店"]',
      position: '["店長"]',
      organization: '["本社"]',
      team: '',
      joinDate: new Date('2015-04-01'),
      status: 'active',
      password: 'manager123',
      role: 'manager',
      myNumber: null,
      userId: 'manager',
      url: '',
      address: '東京都新宿区',
      selfIntroduction: '店長です',
      phoneInternal: '002',
      phoneMobile: '090-1234-5679',
      birthDate: new Date('1985-05-15'),
      showInOrgChart: true,
      parentEmployeeId: 'cmgtfxlyt00008zx7gny1h5hn',
      isInvisibleTop: false,
      isSuspended: false,
      retirementDate: null,
      privacyDisplayName: true,
      privacyOrganization: true,
      privacyDepartment: true,
      privacyPosition: true,
      privacyUrl: true,
      privacyAddress: true,
      privacyBio: true,
      privacyEmail: true,
      privacyWorkPhone: true,
      privacyExtension: true,
      privacyMobilePhone: true,
      privacyBirthDate: false,
      orgChartLabel: 'manager'
    },
    {
      id: 'cmgtj2n3o00008zcwnsyk1k4n',
      employeeId: 'EMP-2015-003',
      employeeNumber: 'EMP-2015-003',
      employeeType: 'employee',
      name: '大澤仁志',
      furigana: 'オオサワヒトシ',
      email: 'ohsawa@company.com',
      phone: '03-1234-5680',
      department: '["執行部"]',
      position: '["執行役員"]',
      organization: '["本社"]',
      team: '',
      joinDate: new Date('2015-04-01'),
      status: 'active',
      password: 'ohsawa123',
      role: 'hr',
      myNumber: null,
      userId: 'ohsawa',
      url: '',
      address: '東京都港区',
      selfIntroduction: '人事担当です',
      phoneInternal: '003',
      phoneMobile: '090-1234-5680',
      birthDate: new Date('1990-03-20'),
      showInOrgChart: true,
      parentEmployeeId: 'cmgtfxlyt00008zx7gny1h5hn',
      isInvisibleTop: false,
      isSuspended: false,
      retirementDate: null,
      privacyDisplayName: true,
      privacyOrganization: true,
      privacyDepartment: true,
      privacyPosition: true,
      privacyUrl: true,
      privacyAddress: true,
      privacyBio: true,
      privacyEmail: true,
      privacyWorkPhone: true,
      privacyExtension: true,
      privacyMobilePhone: true,
      privacyBirthDate: false,
      orgChartLabel: '大澤仁志'
    }
  ]

  // 社員データを投入
  for (const employee of employees) {
    await prisma.employee.create({
      data: employee
    })
    console.log(`✅ 社員データを作成しました: ${employee.name}`)
  }

  // コピー社員も作成
  const copyEmployees = [
    {
      id: 'cmgtljvhh00008zmi0ey1yp0r',
      employeeId: 'EMP-2015-002-COPY',
      employeeNumber: 'manager-COPY',
      employeeType: 'employee',
      name: 'manager',
      furigana: 'マネージャー',
      email: 'manager-copy@company.com',
      phone: '03-1234-5679',
      department: '["広店"]',
      position: '["店長"]',
      organization: '["本社"]',
      team: '',
      joinDate: new Date('2015-04-01'),
      status: 'copy',
      password: 'manager123',
      role: 'manager',
      myNumber: null,
      userId: 'manager-copy',
      url: '',
      address: '東京都新宿区',
      selfIntroduction: '店長です',
      phoneInternal: '002',
      phoneMobile: '090-1234-5679',
      birthDate: new Date('1985-05-15'),
      showInOrgChart: true,
      parentEmployeeId: 'cmgth6he100028z3i06ps75c7',
      isInvisibleTop: false,
      isSuspended: false,
      retirementDate: null,
      privacyDisplayName: true,
      privacyOrganization: true,
      privacyDepartment: true,
      privacyPosition: true,
      privacyUrl: true,
      privacyAddress: true,
      privacyBio: true,
      privacyEmail: true,
      privacyWorkPhone: true,
      privacyExtension: true,
      privacyMobilePhone: true,
      privacyBirthDate: false,
      orgChartLabel: 'manager'
    },
    {
      id: 'cmgtjqmcu000i8zcwhziu7gr2',
      employeeId: 'EMP-2015-003-COPY',
      employeeNumber: 'ohsawa-COPY',
      employeeType: 'employee',
      name: '大澤仁志',
      furigana: 'オオサワヒトシ',
      email: 'ohsawa-copy@company.com',
      phone: '03-1234-5680',
      department: '["執行部"]',
      position: '["執行役員"]',
      organization: '["本社"]',
      team: '',
      joinDate: new Date('2015-04-01'),
      status: 'copy',
      password: 'ohsawa123',
      role: 'hr',
      myNumber: null,
      userId: 'ohsawa-copy',
      url: '',
      address: '東京都港区',
      selfIntroduction: '人事担当です',
      phoneInternal: '003',
      phoneMobile: '090-1234-5680',
      birthDate: new Date('1990-03-20'),
      showInOrgChart: true,
      parentEmployeeId: 'cmgtj2n3o00008zcwnsyk1k4n',
      isInvisibleTop: false,
      isSuspended: false,
      retirementDate: null,
      privacyDisplayName: true,
      privacyOrganization: true,
      privacyDepartment: true,
      privacyPosition: true,
      privacyUrl: true,
      privacyAddress: true,
      privacyBio: true,
      privacyEmail: true,
      privacyWorkPhone: true,
      privacyExtension: true,
      privacyMobilePhone: true,
      privacyBirthDate: false,
      orgChartLabel: '大澤仁志'
    }
  ]

  // コピー社員データを投入
  for (const employee of copyEmployees) {
    await prisma.employee.create({
      data: employee
    })
    console.log(`✅ コピー社員データを作成しました: ${employee.name}`)
  }

  // ワークスペースを作成
  const workspace = await prisma.workspace.create({
    data: {
      id: 'cmgtfxlz000068zx7tb1e6jqf',
      name: 'メイン ワークスペース',
      description: 'メインのワークスペースです',
      createdBy: 'cmgtfxlyt00008zx7gny1h5hn',
      members: {
        create: [
          {
            employeeId: 'cmgtfxlyt00008zx7gny1h5hn',
            role: 'workspace_admin'
          },
          {
            employeeId: 'cmgth6he100028z3i06ps75c7',
            role: 'workspace_member'
          },
          {
            employeeId: 'cmgtj2n3o00008zcwnsyk1k4n',
            role: 'workspace_member'
          }
        ]
      }
    }
  })
  console.log(`✅ ワークスペースを作成しました: ${workspace.name}`)

  // ボードを作成
  const board = await prisma.board.create({
    data: {
      id: 'cmgtfxlze000d8zx7dmjbntpz',
      name: 'メイン ボード',
      description: 'メインのボードです',
      workspaceId: workspace.id,
      createdBy: 'cmgtfxlyt00008zx7gny1h5hn'
    }
  })
  console.log(`✅ ボードを作成しました: ${board.name}`)

  console.log('🎉 シードデータの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ シードデータの投入中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })