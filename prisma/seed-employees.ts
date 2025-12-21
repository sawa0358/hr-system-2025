const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const password = '111'

    // UserRole enum: viewer, general, sub_manager, store_manager, manager, hr, admin
    const employees = [
        { employeeId: 'EMP001', employeeNumber: '001', name: '管理者', email: 'admin@example.com', role: 'admin', employeeType: '正社員', department: '経営', position: '代表', organization: '本社' },
        { employeeId: 'EMP002', employeeNumber: '002', name: '人事担当', email: 'hr@example.com', role: 'hr', employeeType: '正社員', department: '人事部', position: '主任', organization: '本社' },
        { employeeId: 'EMP003', employeeNumber: '003', name: '山田太郎', email: 'yamada@example.com', role: 'manager', employeeType: '正社員', department: '営業部', position: '部長', organization: '本社' },
        { employeeId: 'EMP004', employeeNumber: '004', name: '佐藤花子', email: 'sato@example.com', role: 'general', employeeType: '正社員', department: '営業部', position: '社員', organization: '本社' },
        { employeeId: 'EMP005', employeeNumber: '005', name: '田中一郎', email: 'tanaka@example.com', role: 'general', employeeType: '正社員', department: '開発部', position: '社員', organization: '本社' },
        { employeeId: 'EMP006', employeeNumber: '006', name: '鈴木美咲', email: 'suzuki@example.com', role: 'general', employeeType: 'パート', department: '総務部', position: 'パート', organization: '本社' },
        { employeeId: 'EMP007', employeeNumber: '007', name: '高橋健太', email: 'takahashi@example.com', role: 'general', employeeType: '業務委託', department: '開発部', position: '外部', organization: '本社' },
        { employeeId: 'EMP008', employeeNumber: '008', name: '伊藤さくら', email: 'ito@example.com', role: 'general', employeeType: '業務委託', department: 'デザイン部', position: '外部', organization: '本社' },
        { employeeId: 'EMP009', employeeNumber: '009', name: '渡辺剛', email: 'watanabe@example.com', role: 'general', employeeType: '外注先', department: '開発部', position: '外部', organization: '本社' },
        { employeeId: 'EMP010', employeeNumber: '010', name: '中村由美', email: 'nakamura@example.com', role: 'general', employeeType: '外注先', department: 'マーケティング部', position: '外部', organization: '本社' },
    ]

    console.log('社員データを投入中...')

    for (const emp of employees) {
        const created = await prisma.employee.create({
            data: {
                employeeId: emp.employeeId,
                employeeNumber: emp.employeeNumber,
                name: emp.name,
                email: emp.email,
                password,
                role: emp.role,
                employeeType: emp.employeeType,
                department: emp.department,
                position: emp.position,
                organization: emp.organization,
                status: 'active',
                joinDate: new Date(),
            },
        })
        console.log(`✓ ${emp.name} (${emp.role}) - ID: ${created.id}`)
    }

    console.log('\n全社員のパスワード: 111')
    console.log('admin: admin@example.com')
    console.log('hr: hr@example.com')
    console.log('投入完了！')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
