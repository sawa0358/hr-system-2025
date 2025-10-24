#!/usr/bin/env node

/**
 * HR System v1.9.3 データベース復元スクリプト
 * 
 * 使用方法:
 * node scripts/restore-db-v1.9.3.js [バックアップファイル名]
 * 
 * 例:
 * node scripts/restore-db-v1.9.3.js current-db-backup-2025-10-24T15-43-08.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// コマンドライン引数を取得
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ バックアップファイル名を指定してください');
  console.log('使用方法: node scripts/restore-db-v1.9.3.js [バックアップファイル名]');
  console.log('例: node scripts/restore-db-v1.9.3.js current-db-backup-2025-10-24T15-43-08.json');
  process.exit(1);
}

// バックアップファイルの存在確認
if (!fs.existsSync(backupFile)) {
  console.error(`❌ バックアップファイルが見つかりません: ${backupFile}`);
  process.exit(1);
}

console.log('🔄 HR System v1.9.3 データベース復元を開始します...');
console.log(`📁 バックアップファイル: ${backupFile}`);

try {
  // 現在のDBをバックアップ
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const currentBackup = `prisma/dev.db.backup-${timestamp}`;
  
  if (fs.existsSync('prisma/dev.db')) {
    console.log('💾 現在のDBをバックアップ中...');
    fs.copyFileSync('prisma/dev.db', currentBackup);
    console.log(`✅ 現在のDBをバックアップしました: ${currentBackup}`);
  }

  // バックアップファイルを読み込み
  console.log('📖 バックアップファイルを読み込み中...');
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  
  // テーブル一覧を表示
  const tables = Object.keys(backupData);
  console.log(`📊 復元対象テーブル: ${tables.join(', ')}`);
  
  // データ件数を表示
  tables.forEach(table => {
    const count = Array.isArray(backupData[table]) ? backupData[table].length : 0;
    console.log(`  - ${table}: ${count}件`);
  });

  // 既存のDBを削除
  if (fs.existsSync('prisma/dev.db')) {
    console.log('🗑️  既存のDBを削除中...');
    fs.unlinkSync('prisma/dev.db');
  }

  // PrismaでDBを再作成
  console.log('🔨 データベースを再作成中...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // データを復元
  console.log('📥 データを復元中...');
  
  // Prismaクライアントを使用してデータを復元
  const restoreScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    const backupData = JSON.parse(fs.readFileSync('${backupFile}', 'utf8'));
    
    // テーブルの順序を考慮して復元
    const restoreOrder = [
      'employees',
      'workspaces', 
      'boards',
      'boardLists',
      'cards',
      'cardMembers',
      'tasks',
      'evaluations',
      'attendances',
      'payrolls',
      'files',
      'folders',
      'familyMembers',
      'activityLogs'
    ];
    
    for (const tableName of restoreOrder) {
      if (backupData[tableName] && Array.isArray(backupData[tableName])) {
        console.log(\`復元中: \${tableName} (\${backupData[tableName].length}件)\`);
        
        for (const record of backupData[tableName]) {
          try {
            // 日付フィールドを適切に処理
            const processedRecord = { ...record };
            
            // 日付フィールドをDateオブジェクトに変換
            const dateFields = ['createdAt', 'updatedAt', 'joinDate', 'birthDate', 'retirementDate'];
            dateFields.forEach(field => {
              if (processedRecord[field] && typeof processedRecord[field] === 'string') {
                processedRecord[field] = new Date(processedRecord[field]);
              }
            });
            
            // JSONフィールドを適切に処理
            const jsonFields = ['organizations', 'departments', 'positions', 'settings'];
            jsonFields.forEach(field => {
              if (processedRecord[field] && typeof processedRecord[field] === 'string') {
                try {
                  processedRecord[field] = JSON.parse(processedRecord[field]);
                } catch (e) {
                  // JSONでない場合はそのまま
                }
              }
            });
            
            await prisma[tableName].create({
              data: processedRecord
            });
          } catch (error) {
            console.error(\`\${tableName}のレコード復元エラー:\`, error.message);
            // 個別のレコードエラーは続行
          }
        }
      }
    }
    
    console.log('✅ データ復元が完了しました');
  } catch (error) {
    console.error('❌ データ復元エラー:', error);
    throw error;
  } finally {
    await prisma.\$disconnect();
  }
}

restoreData();
`;

  // 一時ファイルにスクリプトを書き込み
  const tempScript = `temp-restore-${timestamp}.js`;
  fs.writeFileSync(tempScript, restoreScript);
  
  // 復元スクリプトを実行
  execSync(`node ${tempScript}`, { stdio: 'inherit' });
  
  // 一時ファイルを削除
  fs.unlinkSync(tempScript);
  
  console.log('🎉 データベース復元が完了しました！');
  console.log('📋 復元されたデータ:');
  
  // 復元結果を確認
  const verifyScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRestore() {
  try {
    const tables = ['employees', 'workspaces', 'boards', 'boardLists', 'cards', 'tasks', 'evaluations', 'attendances', 'payrolls', 'files', 'folders', 'familyMembers', 'activityLogs'];
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(\`  - \${table}: \${count}件\`);
      } catch (error) {
        console.log(\`  - \${table}: テーブルなし\`);
      }
    }
  } finally {
    await prisma.\$disconnect();
  }
}

verifyRestore();
`;

  const tempVerify = `temp-verify-${timestamp}.js`;
  fs.writeFileSync(tempVerify, verifyScript);
  execSync(`node ${tempVerify}`, { stdio: 'inherit' });
  fs.unlinkSync(tempVerify);
  
} catch (error) {
  console.error('❌ 復元エラー:', error);
  process.exit(1);
}
