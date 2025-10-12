/**
 * S3接続テストスクリプト
 * 使用方法: node test-s3-connection.js
 */

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// 環境変数チェック
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME'
];

console.log('🔍 S3接続テストを開始します...\n');

// 環境変数チェック
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n.env.local ファイルを確認してください。');
  process.exit(1);
}

console.log('✅ 環境変数チェック完了');
console.log(`📦 バケット名: ${process.env.AWS_S3_BUCKET_NAME}`);
console.log(`🌍 リージョン: ${process.env.AWS_REGION}\n`);

// S3クライアント初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3Connection() {
  try {
    console.log('🚀 S3に接続中...');
    
    // バケット一覧を取得してテスト
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('✅ S3接続成功！');
    console.log(`📊 アクセス可能なバケット数: ${response.Buckets.length}`);
    
    // 指定されたバケットが存在するかチェック
    const targetBucket = response.Buckets.find(bucket => 
      bucket.Name === process.env.AWS_S3_BUCKET_NAME
    );
    
    if (targetBucket) {
      console.log(`✅ ターゲットバケット "${process.env.AWS_S3_BUCKET_NAME}" が見つかりました！`);
      console.log(`📅 作成日: ${targetBucket.CreationDate}`);
    } else {
      console.log(`⚠️  ターゲットバケット "${process.env.AWS_S3_BUCKET_NAME}" が見つかりません。`);
      console.log('📋 利用可能なバケット:');
      response.Buckets.forEach(bucket => {
        console.log(`  - ${bucket.Name}`);
      });
    }
    
    console.log('\n🎉 S3接続テスト完了！');
    
  } catch (error) {
    console.error('\n❌ S3接続エラー:');
    console.error(`エラー: ${error.message}`);
    
    if (error.name === 'CredentialsProviderError') {
      console.error('\n💡 解決方法:');
      console.error('1. AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を確認');
      console.error('2. アクセスキーが有効か確認');
      console.error('3. IAMユーザーにS3アクセス権限があるか確認');
    } else if (error.name === 'NoSuchBucket') {
      console.error('\n💡 解決方法:');
      console.error('1. AWS S3コンソールでバケットが存在するか確認');
      console.error('2. バケット名が正しいか確認');
      console.error('3. 正しいリージョンを指定しているか確認');
    }
    
    process.exit(1);
  }
}

// テスト実行
testS3Connection();
