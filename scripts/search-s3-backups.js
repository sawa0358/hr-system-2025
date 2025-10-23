/**
 * S3のバックアップファイルを詳細に検索するスクリプト
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

// 環境変数チェック
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME'
];

console.log('🔍 環境変数をチェック中...\n');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

// S3クライアント初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * S3の全ファイルを再帰的に検索
 */
async function searchAllS3Files() {
  try {
    console.log('🔍 S3の全ファイルを検索中...\n');
    
    let continuationToken = undefined;
    let allFiles = [];
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        allFiles = allFiles.concat(response.Contents);
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`✅ 合計 ${allFiles.length} 件のファイルが見つかりました\n`);
    
    // バックアップ関連のファイルをフィルタリング
    const backupFiles = allFiles.filter(file => {
      const key = file.Key.toLowerCase();
      return key.includes('backup') || 
             key.includes('export') || 
             key.includes('dump') ||
             key.endsWith('.json') ||
             key.endsWith('.sql') ||
             key.includes('employee') ||
             key.includes('production');
    });
    
    console.log(`📋 バックアップ関連ファイル: ${backupFiles.length} 件\n`);
    
    if (backupFiles.length === 0) {
      console.log('❌ バックアップ関連のファイルが見つかりません');
      return;
    }
    
    // ファイル一覧を表示
    console.log('📁 見つかったバックアップファイル:');
    backupFiles.forEach((file, index) => {
      const sizeKB = Math.round(file.Size / 1024);
      const lastModified = file.LastModified.toLocaleString('ja-JP');
      console.log(`  ${index + 1}. ${file.Key}`);
      console.log(`     サイズ: ${sizeKB}KB, 更新日時: ${lastModified}`);
    });
    
    // JSONファイルを詳しく調べる
    const jsonFiles = backupFiles.filter(file => file.Key.endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      console.log('\n🔍 JSONファイルの内容を確認中...\n');
      
      for (const file of jsonFiles) {
        console.log(`📄 ファイル: ${file.Key}`);
        
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: file.Key,
          });

          const response = await s3Client.send(command);
          const chunks = [];
          
          for await (const chunk of response.Body) {
            chunks.push(chunk);
          }
          
          const content = Buffer.concat(chunks).toString('utf8');
          const data = JSON.parse(content);
          
          // 各テーブルのレコード数を表示
          for (const [tableName, records] of Object.entries(data)) {
            if (Array.isArray(records)) {
              console.log(`  📊 ${tableName}: ${records.length}件`);
              
              // 社員情報の詳細を表示
              if (tableName === 'employees' && records.length > 0) {
                console.log(`    👥 社員数: ${records.length}名`);
                if (records.length >= 40) {
                  console.log(`    ✅ 40名以上の社員データが含まれています！`);
                }
              }
            }
          }
          
        } catch (error) {
          console.log(`  ❌ ファイル読み込みエラー: ${error.message}`);
        }
        
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ S3検索エラー:', error);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 S3バックアップファイル検索を開始します...\n');
  console.log(`📦 S3バケット: ${BUCKET_NAME}`);
  console.log(`🌍 リージョン: ${process.env.AWS_REGION}\n`);

  await searchAllS3Files();
  
  console.log('✨ 検索が完了しました！');
}

// スクリプト実行
main()
  .catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
