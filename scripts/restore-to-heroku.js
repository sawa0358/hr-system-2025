/**
 * ローカルのJSONバックアップからHeroku本番環境にデータを復元するスクリプト
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// 環境変数チェック
const requiredEnvVars = ['DATABASE_URL'];

console.log('🔍 環境変数をチェック中...\n');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

// Prismaクライアント初期化
const prisma = new PrismaClient();

// 統計情報
const stats = {
  totalEmployees: 0,
  successCount: 0,
  failureCount: 0,
  errors: []
};

/**
 * JSONファイルからデータベースを復元
 */
async function restoreFromJson(jsonFilePath) {
  try {
    console.log(`📄 JSONファイルから復元中: ${jsonFilePath}`);
    
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // 社員データの復元
    if (jsonData.employees && Array.isArray(jsonData.employees)) {
      const employees = jsonData.employees;
      stats.totalEmployees = employees.length;
      
      console.log(`👥 社員データ: ${employees.length}名を復元中...`);
      
      // 既存のデータを削除（外部キー制約の順序で削除）
      console.log('🗑️  既存のデータを削除中...');
      
      // 関連テーブルを先に削除
      await prisma.familyMember.deleteMany({});
      await prisma.cardMember.deleteMany({});
      await prisma.card.deleteMany({});
      await prisma.boardList.deleteMany({});
      await prisma.board.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.evaluation.deleteMany({});
      await prisma.attendance.deleteMany({});
      await prisma.payroll.deleteMany({});
      await prisma.file.deleteMany({});
      await prisma.folder.deleteMany({});
      await prisma.activityLog.deleteMany({});
      
      // 最後に社員データを削除
      await prisma.employee.deleteMany({});
      
      // 社員データを挿入
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const progress = `[${i + 1}/${employees.length}]`;
        
        try {
          // 日付フィールドを適切に処理
          const employeeData = {
            ...employee,
            joinDate: employee.joinDate ? new Date(employee.joinDate) : new Date(),
            birthDate: employee.birthDate ? new Date(employee.birthDate) : null,
            retirementDate: employee.retirementDate ? new Date(employee.retirementDate) : null,
            createdAt: employee.createdAt ? new Date(employee.createdAt) : new Date(),
            updatedAt: employee.updatedAt ? new Date(employee.updatedAt) : new Date(),
          };
          
          await prisma.employee.create({ data: employeeData });
          stats.successCount++;
          
          if ((i + 1) % 10 === 0) {
            console.log(`  ${progress} ${employee.name} (${employee.employeeId}) - 復元完了`);
          }
        } catch (error) {
          console.log(`  ❌ ${progress} ${employee.name} - エラー: ${error.message}`);
          stats.failureCount++;
          stats.errors.push({
            employee: employee.name,
            employeeId: employee.employeeId,
            error: error.message
          });
        }
      }
    }
    
    // ワークスペースデータの復元
    if (jsonData.workspaces && Array.isArray(jsonData.workspaces)) {
      const workspaces = jsonData.workspaces;
      console.log(`🏢 ワークスペースデータ: ${workspaces.length}個を復元中...`);
      
      for (const workspace of workspaces) {
        try {
          const workspaceData = {
            ...workspace,
            createdAt: workspace.createdAt ? new Date(workspace.createdAt) : new Date(),
            updatedAt: workspace.updatedAt ? new Date(workspace.updatedAt) : new Date(),
          };
          
          await prisma.workspace.create({ data: workspaceData });
        } catch (error) {
          console.log(`  ❌ ワークスペース復元エラー: ${error.message}`);
        }
      }
    }
    
    // ボードデータの復元
    if (jsonData.boards && Array.isArray(jsonData.boards)) {
      const boards = jsonData.boards;
      console.log(`📋 ボードデータ: ${boards.length}個を復元中...`);
      
      for (const board of boards) {
        try {
          const boardData = {
            ...board,
            createdAt: board.createdAt ? new Date(board.createdAt) : new Date(),
            updatedAt: board.updatedAt ? new Date(board.updatedAt) : new Date(),
          };
          
          await prisma.board.create({ data: boardData });
        } catch (error) {
          console.log(`  ❌ ボード復元エラー: ${error.message}`);
        }
      }
    }
    
    // ボードリストデータの復元
    if (jsonData.boardLists && Array.isArray(jsonData.boardLists)) {
      const boardLists = jsonData.boardLists;
      console.log(`📝 ボードリストデータ: ${boardLists.length}個を復元中...`);
      
      for (const boardList of boardLists) {
        try {
          const boardListData = {
            ...boardList,
            createdAt: boardList.createdAt ? new Date(boardList.createdAt) : new Date(),
            updatedAt: boardList.updatedAt ? new Date(boardList.updatedAt) : new Date(),
          };
          
          await prisma.boardList.create({ data: boardListData });
        } catch (error) {
          console.log(`  ❌ ボードリスト復元エラー: ${error.message}`);
        }
      }
    }
    
    // 家族情報の復元
    if (jsonData.familyMembers && Array.isArray(jsonData.familyMembers)) {
      const familyMembers = jsonData.familyMembers;
      console.log(`👨‍👩‍👧‍👦 家族情報: ${familyMembers.length}件を復元中...`);
      
      for (const familyMember of familyMembers) {
        try {
          const familyMemberData = {
            ...familyMember,
            birthDate: familyMember.birthDate ? new Date(familyMember.birthDate) : null,
            createdAt: familyMember.createdAt ? new Date(familyMember.createdAt) : new Date(),
            updatedAt: familyMember.updatedAt ? new Date(familyMember.updatedAt) : new Date(),
          };
          
          await prisma.familyMember.create({ data: familyMemberData });
        } catch (error) {
          console.log(`  ❌ 家族情報復元エラー: ${error.message}`);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * メイン処理
 */
async function main() {
  const jsonFilePath = process.argv[2];
  
  if (!jsonFilePath) {
    console.error('❌ JSONファイルのパスを指定してください');
    console.error('使用方法: node scripts/restore-to-heroku.js <json-file-path>');
    process.exit(1);
  }
  
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ ファイルが見つかりません: ${jsonFilePath}`);
    process.exit(1);
  }
  
  console.log('🚀 Heroku本番環境へのデータ復元を開始します...\n');
  console.log(`📄 復元ファイル: ${jsonFilePath}`);
  console.log(`🌐 データベース: ${process.env.DATABASE_URL ? 'Heroku本番環境' : 'ローカル'}\n`);

  try {
    // データベースを復元
    console.log('🔄 データベースを復元中...\n');
    const restoreResult = await restoreFromJson(jsonFilePath);
    
    if (restoreResult.success) {
      console.log('\n✅ データベースの復元が完了しました！');
      
      // 復元結果を確認
      console.log('\n📊 復元結果確認:');
      const employeeCount = await prisma.employee.count();
      const workspaceCount = await prisma.workspace.count();
      const boardCount = await prisma.board.count();
      const familyMemberCount = await prisma.familyMember.count();
      
      console.log(`  👥 社員数: ${employeeCount}名`);
      console.log(`  🏢 ワークスペース数: ${workspaceCount}個`);
      console.log(`  📋 ボード数: ${boardCount}個`);
      console.log(`  👨‍👩‍👧‍👦 家族情報数: ${familyMemberCount}件`);
      
      // 統計情報を表示
      console.log('\n📈 復元統計:');
      console.log(`  合計社員数: ${stats.totalEmployees}`);
      console.log(`  ✅ 成功: ${stats.successCount}`);
      console.log(`  ❌ 失敗: ${stats.failureCount}`);
      
      if (stats.errors.length > 0) {
        console.log('\n❌ エラー詳細:');
        stats.errors.slice(0, 10).forEach((err, index) => {
          console.log(`  ${index + 1}. ${err.employee} (${err.employeeId})`);
          console.log(`     ${err.error}`);
        });
        if (stats.errors.length > 10) {
          console.log(`  ... 他 ${stats.errors.length - 10} 件のエラー`);
        }
      }
      
    } else {
      console.error(`❌ 復元失敗: ${restoreResult.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
main()
  .catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
