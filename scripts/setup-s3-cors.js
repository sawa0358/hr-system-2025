#!/usr/bin/env node

/**
 * S3バケットのCORS設定スクリプト
 * ファイル共有を可能にするためにCORSポリシーを設定します
 */

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// 環境に応じたオリジンを自動設定
const getAllowedOrigins = () => {
  const origins = [
    'https://hr-system-2025-33b161f586cd.herokuapp.com', // 本番環境
    'http://localhost:3000', // ローカル開発環境
    'http://127.0.0.1:3000', // ローカル開発環境（代替）
  ];

  // 環境変数から追加のオリジンを取得
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS;
  if (additionalOrigins) {
    origins.push(...additionalOrigins.split(','));
  }

  return origins;
};

async function setupS3CORS() {
  try {
    console.log('S3バケットのCORS設定を開始します...');
    console.log('バケット名:', BUCKET_NAME);
    console.log('リージョン:', process.env.AWS_REGION || 'ap-northeast-1');

    if (!BUCKET_NAME) {
      console.log('⚠️  AWS_S3_BUCKET_NAME環境変数が設定されていません。CORS設定をスキップします。');
      return; // エラーで終了せず、スキップする
    }

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: getAllowedOrigins(),
          ExposeHeaders: [
            'ETag',
            'x-amz-meta-custom-header'
          ],
          MaxAgeSeconds: 3600
        }
      ]
    };

    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);
    console.log('✅ S3バケットのCORS設定が完了しました！');
    console.log('設定内容:', JSON.stringify(corsConfiguration, null, 2));
    
  } catch (error) {
    console.error('❌ S3バケットのCORS設定に失敗しました:', error);
    console.log('⚠️  CORS設定の失敗は致命的ではありません。手動で設定してください。');
    // デプロイを停止させないため、エラーで終了しない
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  setupS3CORS();
}

module.exports = { setupS3CORS };
