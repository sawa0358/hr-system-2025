const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 環境変数を読み込み
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

async function uploadMasterData() {
  try {
    console.log('マスターデータのS3アップロードを開始します...');
    
    // マスターデータファイルを読み込み
    const masterDataPath = path.join(__dirname, '../lib/master-data.json');
    const masterData = fs.readFileSync(masterDataPath, 'utf8');
    
    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'master-data/company-master-data.json',
      Body: masterData,
      ContentType: 'application/json',
      ACL: 'private',
      Metadata: {
        'upload-date': new Date().toISOString(),
        'version': '1.0.0'
      }
    });

    await s3Client.send(command);
    
    console.log('✅ マスターデータのS3アップロードが完了しました！');
    console.log(`📁 保存先: s3://${BUCKET_NAME}/master-data/company-master-data.json`);
    
  } catch (error) {
    console.error('❌ マスターデータのアップロードに失敗しました:', error);
    process.exit(1);
  }
}

// 実行
uploadMasterData();
