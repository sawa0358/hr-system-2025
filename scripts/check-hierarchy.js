const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHierarchy() {
  try {
    console.log('=== 社員の階層関係を確認 ===')
    
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        employeeNumber: true,
        department: true,
        position: true,
        parentEmployeeId: true,
        showInOrgChart: true
      },
      orderBy: {
        employeeNumber: 'asc'
      }
    })
    
    console.log(`総社員数: ${employees.length}`)
    console.log('\n=== 社員一覧 ===')
    
    employees.forEach(emp => {
      const parent = employees.find(p => p.id === emp.parentEmployeeId)
      const parentName = parent ? parent.name : 'なし'
      
      console.log(`${emp.employeeNumber}: ${emp.name} (${emp.department}) - 上長: ${parentName}`)
    })
    
    console.log('\n=== 階層関係の問題 ===')
    
    // 循環参照チェック
    const circularRefs = []
    employees.forEach(emp => {
      if (emp.parentEmployeeId) {
        let current = emp
        const visited = new Set()
        
        while (current.parentEmployeeId && !visited.has(current.id)) {
          visited.add(current.id)
          current = employees.find(e => e.id === current.parentEmployeeId)
          if (!current) break
          
          if (visited.has(current.id)) {
            circularRefs.push(`${emp.name} -> ${current.name}`)
            break
          }
        }
      }
    })
    
    if (circularRefs.length > 0) {
      console.log('循環参照が発見されました:', circularRefs)
    } else {
      console.log('循環参照はありません')
    }
    
    // 孤立したノードチェック
    const roots = employees.filter(emp => !emp.parentEmployeeId && emp.showInOrgChart)
    console.log(`\nルート社員 (上長なし): ${roots.map(r => r.name).join(', ')}`)
    
    // 組織図に表示されていない社員
    const notInOrgChart = employees.filter(emp => !emp.showInOrgChart)
    console.log(`組織図に表示されていない社員: ${notInOrgChart.map(e => e.name).join(', ')}`)
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHierarchy()
