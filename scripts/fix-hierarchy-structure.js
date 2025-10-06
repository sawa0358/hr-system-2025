const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixHierarchyStructure() {
  try {
    console.log('=== 階層構造の修正を開始 ===')
    
    // 全社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        showInOrgChart: true
      }
    })
    
    console.log(`対象社員数: ${employees.length}`)
    
    // 自己参照を修正
    for (const emp of employees) {
      if (emp.parentEmployeeId === emp.id) {
        console.log(`自己参照を修正: ${emp.name} (${emp.id})`)
        await prisma.employee.update({
          where: { id: emp.id },
          data: { parentEmployeeId: null }
        })
      }
    }
    
    // 適切な階層構造を作成
    // 大澤仁志を最上位に設定
    const osawa = employees.find(emp => emp.name === '大澤 仁志')
    if (osawa) {
      await prisma.employee.update({
        where: { id: osawa.id },
        data: { parentEmployeeId: null }
      })
      console.log(`${osawa.name} を最上位に設定`)
    }
    
    // 各部長を大澤の下に配置
    const managers = employees.filter(emp => 
      emp.position.includes('部長') && emp.name !== '大澤 仁志'
    )
    
    for (const manager of managers) {
      if (osawa) {
        await prisma.employee.update({
          where: { id: manager.id },
          data: { parentEmployeeId: osawa.id }
        })
        console.log(`${manager.name} を ${osawa.name} の下に配置`)
      }
    }
    
    // 一般社員を適切な部長の下に配置
    const generalEmployees = employees.filter(emp => 
      !emp.position.includes('部長') && 
      emp.name !== '大澤 仁志' &&
      emp.position !== '株式会社オオサワ創研'
    )
    
    for (const emp of generalEmployees) {
      // 同じ部署の部長を探す
      const departmentManager = managers.find(manager => 
        manager.department === emp.department
      )
      
      if (departmentManager) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { parentEmployeeId: departmentManager.id }
        })
        console.log(`${emp.name} を ${departmentManager.name} の下に配置`)
      } else {
        // 部長がいない場合は大澤の下に直接配置
        if (osawa) {
          await prisma.employee.update({
            where: { id: emp.id },
            data: { parentEmployeeId: osawa.id }
          })
          console.log(`${emp.name} を ${osawa.name} の下に直接配置`)
        }
      }
    }
    
    console.log('=== 階層構造の修正が完了しました ===')
    
    // 結果を確認
    const updatedEmployees = await prisma.employee.findMany({
      where: { showInOrgChart: true }
    })
    
    const roots = updatedEmployees.filter(emp => !emp.parentEmployeeId)
    console.log(`修正後のルート社員数: ${roots.length}`)
    roots.forEach(emp => console.log(`- ${emp.name}`))
    
  } catch (error) {
    console.error('階層構造の修正でエラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixHierarchyStructure()
