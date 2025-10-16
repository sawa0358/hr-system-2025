const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSelfReference() {
  try {
    // parentEmployeeIdが自分自身を指している社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        showInOrgChart: true
      }
    })

    console.log('Total employees:', employees.length)

    for (const employee of employees) {
      if (employee.parentEmployeeId === employee.id) {
        console.log(`Fixing self-reference for ${employee.name} (${employee.id})`)
        
        // parentEmployeeIdをnullに設定
        await prisma.employee.update({
          where: { id: employee.id },
          data: { parentEmployeeId: null }
        })
        
        console.log(`Fixed: ${employee.name}`)
      }
    }

    console.log('Self-reference fix completed')
  } catch (error) {
    console.error('Error fixing self-reference:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSelfReference()
