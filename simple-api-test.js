// 簡単なAPIテストスクリプト
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('=== データベース接続テスト ===');
  
  try {
    // 社員データの取得テスト
    const employees = await prisma.employee.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    
    console.log('社員データ:', employees);
    
    if (employees.length > 0) {
      const employeeId = employees[0].id;
      console.log('テスト用社員ID:', employeeId);
      
      // カスタムフォルダのテスト
      console.log('\n=== カスタムフォルダテスト ===');
      
      // カスタムフォルダの作成
      const customFolder = await prisma.customFolder.create({
        data: {
          employeeId: employeeId,
          category: 'employee',
          name: 'テストフォルダ',
          order: 0
        }
      });
      console.log('カスタムフォルダ作成:', customFolder);
      
      // カスタムフォルダの取得
      const folders = await prisma.customFolder.findMany({
        where: {
          employeeId: employeeId,
          category: 'employee'
        }
      });
      console.log('カスタムフォルダ取得:', folders);
      
      // ユーザー設定のテスト
      console.log('\n=== ユーザー設定テスト ===');
      
      // ユーザー設定の作成
      const userSetting = await prisma.userSettings.create({
        data: {
          employeeId: employeeId,
          key: 'test-setting',
          value: 'test-value'
        }
      });
      console.log('ユーザー設定作成:', userSetting);
      
      // ユーザー設定の取得
      const settings = await prisma.userSettings.findMany({
        where: {
          employeeId: employeeId
        }
      });
      console.log('ユーザー設定取得:', settings);
      
      // マスターデータのテスト
      console.log('\n=== マスターデータテスト ===');
      
      // マスターデータの作成
      const masterData = await prisma.masterData.create({
        data: {
          type: 'test-type',
          value: 'test-value',
          label: 'テストラベル',
          order: 0
        }
      });
      console.log('マスターデータ作成:', masterData);
      
      // マスターデータの取得
      const masterDataList = await prisma.masterData.findMany({
        where: {
          type: 'test-type'
        }
      });
      console.log('マスターデータ取得:', masterDataList);
      
      // クリーンアップ
      console.log('\n=== クリーンアップ ===');
      await prisma.customFolder.deleteMany({
        where: { employeeId: employeeId }
      });
      await prisma.userSettings.deleteMany({
        where: { employeeId: employeeId }
      });
      await prisma.masterData.deleteMany({
        where: { type: 'test-type' }
      });
      console.log('テストデータをクリーンアップしました');
      
    } else {
      console.log('社員データが見つかりません');
    }
    
  } catch (error) {
    console.error('データベーステストエラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// テスト実行
testDatabaseConnection().catch(console.error);
