// マスターデータAPIテスト
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMasterDataAPI() {
  console.log('=== マスターデータAPIテスト ===');
  
  try {
    // テスト用のマスターデータを作成
    console.log('1. テスト用マスターデータを作成');
    const testData = await prisma.masterData.create({
      data: {
        type: 'department',
        value: '総務部',
        label: '総務部',
        order: 0,
        isActive: true
      }
    });
    console.log('作成されたマスターデータ:', testData);
    
    // マスターデータの取得テスト
    console.log('2. マスターデータの取得テスト');
    const masterData = await prisma.masterData.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    console.log('取得されたマスターデータ:', masterData);
    
    // タイプ別にグループ化
    console.log('3. タイプ別にグループ化');
    const groupedData = {};
    masterData.forEach(item => {
      if (!groupedData[item.type]) {
        groupedData[item.type] = [];
      }
      groupedData[item.type].push({
        value: item.value,
        label: item.label || item.value
      });
    });
    console.log('グループ化されたデータ:', groupedData);
    
    // クリーンアップ
    console.log('4. クリーンアップ');
    await prisma.masterData.deleteMany({
      where: { type: 'department' }
    });
    console.log('テストデータをクリーンアップしました');
    
  } catch (error) {
    console.error('マスターデータAPIテストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// テスト実行
testMasterDataAPI().catch(console.error);
