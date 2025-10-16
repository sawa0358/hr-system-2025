const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  // 本番環境のDATABASE_URLを使用
  // DATABASE_URL は環境変数から自動取得される
});

async function setInvisibleTopProduction() {
  try {
    console.log('本番環境：「見えないTOP」社員にフラグを設定します...');
    
    // 本番環境での実行確認
    console.log('⚠️  本番環境での実行です。続行しますか？');
    
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
    
    // 社員番号000の社員も確認・設定
    const emp000 = await prisma.employee.findFirst({
      where: {
        employeeNumber: '000'
      }
    });
    
    if (emp000 && !emp000.isInvisibleTop) {
      await prisma.employee.update({
        where: { id: emp000.id },
        data: { isInvisibleTop: true }
      });
      console.log(`✅ 社員番号000の社員にもフラグを設定しました: ${emp000.name}`);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 本番環境での実行確認
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log('🚨 本番環境での実行が検出されました');
  setInvisibleTopProduction();
} else {
  console.log('開発環境です。本番環境で実行してください。');
}
