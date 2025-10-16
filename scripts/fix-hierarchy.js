const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixHierarchy() {
  try {
    console.log('=== 階層関係を修正 ===')
    
    // 社員を取得
    const employees = await prisma.employee.findMany()
    
    // 正しい階層関係を設定
    const hierarchyUpdates = [
      // 大澤 仁志を最上位に設定（上長なし）
      { name: '大澤 仁志', parentId: null },
      
      // somuを大澤の下に
      { name: 'somu', parentId: '大澤 仁志' },
      
      // maneを大澤の下に
      { name: 'mane', parentId: '大澤 仁志' },
      
      // 渡辺直樹をsomuの下に
      { name: '渡辺直樹', parentId: 'somu' },
      
      // 佐藤花子を渡辺直樹の下に
      { name: '佐藤花子', parentId: '渡辺直樹' },
      
      // 小林智也を渡辺直樹の下に
      { name: '小林智也', parentId: '渡辺直樹' },
      
      // 田中太郎をmaneの下に
      { name: '田中太郎', parentId: 'mane' },
      
      // 森田大輔を田中太郎の下に
      { name: '森田大輔', parentId: '田中太郎' },
      
      // 他の社員は組織図に表示しない（showInOrgChart: false）
      { name: '鈴木健太', parentId: null, showInOrgChart: false },
      { name: '高橋美咲', parentId: null, showInOrgChart: false },
      { name: '山田次郎', parentId: null, showInOrgChart: false },
      { name: '伊藤麻衣', parentId: null, showInOrgChart: false },
      { name: '加藤由美', parentId: null, showInOrgChart: false },
    ]
    
    for (const update of hierarchyUpdates) {
      const employee = employees.find(emp => emp.name === update.name)
      if (!employee) {
        console.log(`社員が見つかりません: ${update.name}`)
        continue
      }
      
      let parentEmployeeId = null
      if (update.parentId) {
        const parentEmployee = employees.find(emp => emp.name === update.parentId)
        if (parentEmployee) {
          parentEmployeeId = parentEmployee.id
        } else {
          console.log(`親社員が見つかりません: ${update.parentId}`)
        }
      }
      
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          parentEmployeeId: parentEmployeeId,
          showInOrgChart: update.showInOrgChart !== undefined ? update.showInOrgChart : true
        }
      })
      
      console.log(`更新: ${update.name} -> 上長: ${update.parentId || 'なし'}, 組織図表示: ${update.showInOrgChart !== undefined ? update.showInOrgChart : true}`)
    }
    
    console.log('\n=== 修正後の階層関係 ===')
    
    const updatedEmployees = await prisma.employee.findMany({
      where: { showInOrgChart: true },
      select: {
        name: true,
        employeeNumber: true,
        department: true,
        parentEmployeeId: true
      },
      orderBy: {
        employeeNumber: 'asc'
      }
    })
    
    updatedEmployees.forEach(emp => {
      const parent = employees.find(p => p.id === emp.parentEmployeeId)
      const parentName = parent ? parent.name : 'なし'
      console.log(`${emp.employeeNumber}: ${emp.name} (${emp.department}) - 上長: ${parentName}`)
    })
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixHierarchy()
