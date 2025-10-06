const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function autoCreateInvisibleTop() {
  try {
    console.log('「見えないTOP」社員の自動作成・管理を開始します...');
    
    // 既存の「見えないTOP」社員を検索
    let invisibleTopEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { name: "見えないTOP" },
          { employeeNumber: "000" },
          { isInvisibleTop: true }
        ]
      }
    });
    
    if (invisibleTopEmployee) {
      // 既存の社員を更新
      await prisma.employee.update({
        where: { id: invisibleTopEmployee.id },
        data: {
          name: "見えないTOP",
          employeeNumber: "000",
          employeeId: "EMP-TOP-000",
          department: "経営",
          position: "未設定",
          organization: "株式会社テックイノベーション",
          email: "invisible-top@company.com",
          phone: "",
          joinDate: new Date("2020-01-01"),
          status: "active",
          role: "admin",
          employeeType: "employee",
          showInOrgChart: true,
          parentEmployeeId: null,
          isInvisibleTop: true,
          password: "invisible-top-secure-password-2024"
        }
      });
      console.log('✅ 既存の「見えないTOP」社員を更新しました');
    } else {
      // 新規作成
      invisibleTopEmployee = await prisma.employee.create({
        data: {
          name: "見えないTOP",
          employeeNumber: "000",
          employeeId: "EMP-TOP-000",
          department: "経営",
          position: "未設定",
          organization: "株式会社テックイノベーション",
          email: "invisible-top@company.com",
          phone: "",
          joinDate: new Date("2020-01-01"),
          status: "active",
          role: "admin",
          employeeType: "employee",
          showInOrgChart: true,
          parentEmployeeId: null,
          isInvisibleTop: true,
          password: "invisible-top-secure-password-2024"
        }
      });
      console.log('✅ 新しい「見えないTOP」社員を作成しました');
    }
    
    // 他の社員のparentEmployeeIdを「見えないTOP」に設定（必要に応じて）
    const employeesWithoutParent = await prisma.employee.findMany({
      where: {
        AND: [
          { id: { not: invisibleTopEmployee.id } },
          { parentEmployeeId: null },
          { showInOrgChart: true }
        ]
      }
    });
    
    if (employeesWithoutParent.length > 0) {
      // 最初の数名を「見えないTOP」の配下に設定
      const employeesToUpdate = employeesWithoutParent.slice(0, 2); // 最大2名
      
      for (const emp of employeesToUpdate) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { parentEmployeeId: invisibleTopEmployee.id }
        });
      }
      
      console.log(`✅ ${employeesToUpdate.length}名の社員を「見えないTOP」の配下に設定しました`);
    }
    
    console.log('🎉 「見えないTOP」社員の自動管理が完了しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
autoCreateInvisibleTop();
