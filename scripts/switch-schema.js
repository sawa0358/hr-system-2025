#!/usr/bin/env node

/**
 * スキーマ切り替えスクリプト
 * 開発・本番環境のスキーマを簡単に切り替えます
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const environment = process.argv[2];

if (!environment || !['dev', 'prod'].includes(environment)) {
  console.error('❌ 使用方法: node scripts/switch-schema.js [dev|prod]');
  console.error('  dev  - 開発環境用スキーマ（SQLite）に切り替え');
  console.error('  prod - 本番環境用スキーマ（PostgreSQL）に切り替え');
  process.exit(1);
}

const baseSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-base.prisma');
const targetSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// ベーススキーマを読み込み
const baseSchema = fs.readFileSync(baseSchemaPath, 'utf8');

let targetSchema;
if (environment === 'dev') {
  // 開発環境用（SQLite）
  targetSchema = baseSchema.replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  console.log('🔄 開発環境用スキーマ（SQLite）に切り替え中...');
} else {
  // 本番環境用（PostgreSQL）
  targetSchema = baseSchema.replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );
  console.log('🔄 本番環境用スキーマ（PostgreSQL）に切り替え中...');
}

// スキーマファイルを更新
fs.writeFileSync(targetSchemaPath, targetSchema);

// Prismaクライアントを再生成
try {
  console.log('🔄 Prismaクライアントを再生成中...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ スキーマ切り替えが完了しました！');
} catch (error) {
  console.error('❌ Prismaクライアントの再生成に失敗しました:', error.message);
  process.exit(1);
}
