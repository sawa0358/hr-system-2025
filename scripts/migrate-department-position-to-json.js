const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('データ移行を開始します...');
    
    // 既存の社員データを取得
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        department: true,
        position: true,
        organization: true
      }
    });

    console.log(`取得した社員数: ${employees.length}`);

    for (const employee of employees) {
      // 文字列データをJSON配列に変換
      const departmentData = typeof employee.department === 'string' 
        ? [employee.department] 
        : employee.department;
      
      const positionData = typeof employee.position === 'string' 
        ? [employee.position] 
        : employee.position;
      
      const organizationData = typeof employee.organization === 'string' 
        ? [employee.organization] 
        : employee.organization;

      // データベースを更新
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          department: departmentData,
          position: positionData,
          organization: organizationData
        }
      });

      console.log(`社員 ${employee.id} のデータを更新しました`);
    }

    console.log('データ移行が完了しました！');
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
