const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setInvisibleTop() {
  try {
    console.log('「見えないTOP」社員にフラグを設定します...');
    
    // 「見えないTOP」という名前の社員を検索して更新
    const result = await prisma.employee.updateMany({
      where: {
        name: "見えないTOP"
      },
      data: {
        isInvisibleTop: true
      }
    });
    
    console.log(`✅ ${result.count} 名の「見えないTOP」社員にフラグを設定しました`);
    
    // 確認のため、更新された社員情報を表示
    const invisibleTopEmployees = await prisma.employee.findMany({
      where: {
        isInvisibleTop: true
      },
      select: {
        id: true,
        name: true,
        employeeNumber: true,
        department: true,
        position: true,
        isInvisibleTop: true
      }
    });
    
    console.log('\n📋 設定された「見えないTOP」社員:');
    invisibleTopEmployees.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.employeeNumber}) - ${emp.department}/${emp.position}`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setInvisibleTop();
