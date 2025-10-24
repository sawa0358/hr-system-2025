#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Prismaクライアント自動再生成スクリプト');

// Prismaスキーマファイルのパス
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// スキーマファイルの最終更新時刻を記録するファイル
const timestampPath = path.join(__dirname, '..', '.prisma-timestamp');

function getSchemaTimestamp() {
  try {
    const stats = fs.statSync(schemaPath);
    return stats.mtime.getTime();
  } catch (error) {
    return 0;
  }
}

function getLastTimestamp() {
  try {
    const timestamp = fs.readFileSync(timestampPath, 'utf8');
    return parseInt(timestamp, 10);
  } catch (error) {
    return 0;
  }
}

function saveTimestamp(timestamp) {
  try {
    fs.writeFileSync(timestampPath, timestamp.toString());
  } catch (error) {
    console.error('❌ タイムスタンプ保存エラー:', error);
  }
}

function generatePrismaClient() {
  try {
    console.log('🔄 Prismaクライアントを再生成中...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prismaクライアントの再生成が完了しました');
    return true;
  } catch (error) {
    console.error('❌ Prismaクライアントの再生成に失敗しました:', error.message);
    return false;
  }
}

function checkAndGenerate() {
  const currentTimestamp = getSchemaTimestamp();
  const lastTimestamp = getLastTimestamp();

  if (currentTimestamp > lastTimestamp) {
    console.log('📝 Prismaスキーマファイルが変更されました');
    if (generatePrismaClient()) {
      saveTimestamp(currentTimestamp);
    }
  } else {
    console.log('✅ Prismaスキーマファイルに変更はありません');
  }
}

// メイン処理
if (require.main === module) {
  checkAndGenerate();
}

module.exports = { checkAndGenerate, generatePrismaClient };
