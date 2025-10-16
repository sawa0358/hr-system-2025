#!/usr/bin/env node

/**
 * スキーマ自動生成スクリプト
 * ベーススキーマから環境別のスキーマを自動生成します
 */

const fs = require('fs');
const path = require('path');

const baseSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-base.prisma');
const devSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const prodSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-postgres.prisma');

// ベーススキーマを読み込み
const baseSchema = fs.readFileSync(baseSchemaPath, 'utf8');

// 開発環境用スキーマ（SQLite）
const devSchema = baseSchema.replace(
  'generator client {\n  provider = "prisma-client-js"\n}',
  `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
);

// 本番環境用スキーマ（PostgreSQL）
const prodSchema = baseSchema.replace(
  'generator client {\n  provider = "prisma-client-js"\n}',
  `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

// スキーマファイルを生成
fs.writeFileSync(devSchemaPath, devSchema);
fs.writeFileSync(prodSchemaPath, prodSchema);

console.log('✅ スキーマファイルを生成しました:');
console.log('  - 開発環境: prisma/schema.prisma (SQLite)');
console.log('  - 本番環境: prisma/schema-postgres.prisma (PostgreSQL)');
console.log('');
console.log('📝 使用方法:');
console.log('  npm run schema:dev    - 開発環境用スキーマに切り替え');
console.log('  npm run schema:prod   - 本番環境用スキーマに切り替え');
console.log('  npm run schema:sync   - ベーススキーマから全環境を同期');
