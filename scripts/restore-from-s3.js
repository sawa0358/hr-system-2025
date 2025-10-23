/**
 * S3から本番データを復元するスクリプト
 * 
 * 使用方法:
 * 1. 環境変数を設定
 * 2. node scripts/restore-from-s3.js を実行
 * 
 * 環境変数:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET_NAME
 * - DATABASE_URL
 */

const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// 環境変数チェック
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'DATABASE_URL'
];

console.log('🔍 環境変数をチェック中...\n');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n環境変数を設定してから再実行してください。');
  process.exit(1);
}

console.log('✅ 環境変数チェック完了\n');

// S3クライアント初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Prismaクライアント初期化
const prisma = new PrismaClient();

// 統計情報
const stats = {
  totalFiles: 0,
  successCount: 0,
  failureCount: 0,
  errors: []
};

/**
 * S3からファイルをダウンロード
 */
async function downloadFileFromS3(s3Key, localPath) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const fileContent = Buffer.concat(chunks);
    
    // ディレクトリを作成
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // ファイルを保存
    fs.writeFileSync(localPath, fileContent);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * S3のバックアップフォルダからファイル一覧を取得
 */
async function listBackupFiles() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'backups/',
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(obj => obj.Key).filter(key => key.endsWith('.json') || key.endsWith('.sql')) || [];
  } catch (error) {
    console.error('S3ファイル一覧取得エラー:', error);
    return [];
  }
}

/**
 * JSONファイルからデータベースを復元
 */
async function restoreFromJson(jsonFilePath) {
  try {
    console.log(`📄 JSONファイルから復元中: ${jsonFilePath}`);
    
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    
    // 各テーブルのデータを復元
    for (const [tableName, records] of Object.entries(jsonData)) {
      if (!Array.isArray(records) || records.length === 0) {
        console.log(`  ⚠️  ${tableName}: データなし`);
        continue;
      }
      
      console.log(`  📊 ${tableName}: ${records.length}件のレコードを復元中...`);
      
      try {
        // 既存のデータを削除（必要に応じて）
        if (tableName === 'employees') {
          await prisma.employee.deleteMany({});
        } else if (tableName === 'workspaces') {
          await prisma.workspace.deleteMany({});
        } else if (tableName === 'boards') {
          await prisma.board.deleteMany({});
        } else if (tableName === 'boardLists') {
          await prisma.boardList.deleteMany({});
        } else if (tableName === 'familyMembers') {
          await prisma.familyMember.deleteMany({});
        }
        
        // データを挿入
        for (const record of records) {
          try {
            if (tableName === 'employees') {
              await prisma.employee.create({ data: record });
            } else if (tableName === 'workspaces') {
              await prisma.workspace.create({ data: record });
            } else if (tableName === 'boards') {
              await prisma.board.create({ data: record });
            } else if (tableName === 'boardLists') {
              await prisma.boardList.create({ data: record });
            } else if (tableName === 'familyMembers') {
              await prisma.familyMember.create({ data: record });
            }
          } catch (error) {
            console.log(`    ⚠️  レコード挿入エラー: ${error.message}`);
          }
        }
        
        console.log(`  ✅ ${tableName}: 復元完了`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: 復元失敗 - ${error.message}`);
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
  console.log('🚀 S3から本番データの復元を開始します...\n');
  console.log(`📦 S3バケット: ${BUCKET_NAME}`);
  console.log(`🌍 リージョン: ${process.env.AWS_REGION}\n`);

  try {
    // S3からバックアップファイル一覧を取得
    console.log('📋 S3からバックアップファイル一覧を取得中...');
    const backupFiles = await listBackupFiles();
    
    if (backupFiles.length === 0) {
      console.log('ℹ️  復元可能なバックアップファイルが見つかりません');
      return;
    }
    
    console.log(`✅ ${backupFiles.length} 件のバックアップファイルが見つかりました:`);
    backupFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    console.log('');
    
    // 最新のJSONバックアップファイルを選択
    const jsonFiles = backupFiles.filter(file => file.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log('❌ JSON形式のバックアップファイルが見つかりません');
      return;
    }
    
    // 最新のファイルを選択（ファイル名でソート）
    const latestJsonFile = jsonFiles.sort().pop();
    console.log(`📄 最新のバックアップファイルを選択: ${latestJsonFile}\n`);
    
    // 一時ディレクトリを作成
    const tempDir = path.join(__dirname, '..', 'temp-restore');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // S3からファイルをダウンロード
    const localFilePath = path.join(tempDir, path.basename(latestJsonFile));
    console.log(`⬇️  S3からファイルをダウンロード中...`);
    
    const downloadResult = await downloadFileFromS3(latestJsonFile, localFilePath);
    
    if (!downloadResult.success) {
      console.error(`❌ ダウンロード失敗: ${downloadResult.error}`);
      return;
    }
    
    console.log(`✅ ダウンロード完了: ${localFilePath}\n`);
    
    // データベースを復元
    console.log('🔄 データベースを復元中...\n');
    const restoreResult = await restoreFromJson(localFilePath);
    
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
      
    } else {
      console.error(`❌ 復元失敗: ${restoreResult.error}`);
    }
    
    // 一時ファイルを削除
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
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
