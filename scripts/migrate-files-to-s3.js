/**
 * 既存のローカルファイルをAWS S3に移行するスクリプト
 * 
 * 使用方法:
 * 1. 環境変数を設定
 * 2. node scripts/migrate-files-to-s3.js を実行
 * 
 * 環境変数:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * - AWS_S3_BUCKET_NAME
 * - DATABASE_URL
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
  skippedCount: 0,
  errors: []
};

/**
 * ファイルをS3にアップロード
 */
async function uploadFileToS3(filePath, s3Key) {
  try {
    // ファイルを読み込み
    const fileContent = fs.readFileSync(filePath);
    
    // MIMEタイプを推測
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'private',
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * ディレクトリを再帰的に走査してファイルを取得
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 ファイル移行を開始します...\n');
  console.log(`📦 S3バケット: ${BUCKET_NAME}`);
  console.log(`🌍 リージョン: ${process.env.AWS_REGION}\n`);

  try {
    // データベースからすべてのファイル情報を取得
    console.log('📊 データベースからファイル情報を取得中...');
    const files = await prisma.file.findMany();
    stats.totalFiles = files.length;
    console.log(`✅ ${stats.totalFiles} 件のファイルが見つかりました\n`);

    if (stats.totalFiles === 0) {
      console.log('ℹ️  移行するファイルがありません');
      return;
    }

    // 各ファイルを処理
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${stats.totalFiles}]`;
      
      console.log(`${progress} 処理中: ${file.originalName}`);
      
      // ローカルファイルパスからS3キーを生成
      // 例: uploads/employeeId/category/filename → employeeId/category/filename
      const localPath = file.filePath;
      
      // ファイルが存在しない場合はスキップ
      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  スキップ: ファイルが見つかりません`);
        stats.skippedCount++;
        continue;
      }

      // S3キーを生成
      // ローカルパスから uploads/ 部分を削除
      let s3Key = localPath.replace(/^uploads[\/\\]/, '');
      // Windowsのパス区切りをスラッシュに変換
      s3Key = s3Key.replace(/\\/g, '/');
      
      // S3にアップロード
      const result = await uploadFileToS3(localPath, s3Key);
      
      if (result.success) {
        console.log(`  ✅ S3にアップロード完了: ${s3Key}`);
        
        // データベースのfilePathを更新
        await prisma.file.update({
          where: { id: file.id },
          data: { filePath: s3Key }
        });
        
        stats.successCount++;
      } else {
        console.log(`  ❌ アップロード失敗: ${result.error}`);
        stats.failureCount++;
        stats.errors.push({
          file: file.originalName,
          error: result.error
        });
      }
    }

    // 統計情報を表示
    console.log('\n' + '='.repeat(60));
    console.log('📈 移行結果サマリー');
    console.log('='.repeat(60));
    console.log(`合計ファイル数: ${stats.totalFiles}`);
    console.log(`✅ 成功: ${stats.successCount}`);
    console.log(`⚠️  スキップ: ${stats.skippedCount}`);
    console.log(`❌ 失敗: ${stats.failureCount}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ エラー詳細:');
      stats.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.file}`);
        console.log(`     ${err.error}`);
      });
    }
    
    console.log('\n✨ 移行が完了しました！');
    
    // 注意事項を表示
    if (stats.successCount > 0) {
      console.log('\n⚠️  注意事項:');
      console.log('1. S3バケットのファイルを確認してください');
      console.log('2. アプリケーションが正常に動作することを確認してください');
      console.log('3. 確認後、ローカルの uploads/ フォルダは削除できます');
      console.log('   （バックアップを取ることを推奨します）');
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
  .catch((error) => {
    console.error('致命的なエラー:', error);
    process.exit(1);
  });

