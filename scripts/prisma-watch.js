#!/usr/bin/env node

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

console.log('🔍 Prismaスキーマ監視を開始します...');

// Prismaスキーマファイルのパス
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// ファイル監視の設定
const watcher = chokidar.watch(schemaPath, {
  ignored: /(^|[\/\\])\../, // ドットファイルを無視
  persistent: true,
  ignoreInitial: true
});

let isGenerating = false;

// Prismaクライアント生成関数
function generatePrismaClient() {
  if (isGenerating) {
    console.log('⏳ Prismaクライアント生成中... スキップします');
    return;
  }

  isGenerating = true;
  console.log('🔄 Prismaクライアントを再生成中...');

  const prismaGenerate = spawn('npx', ['prisma', 'generate'], {
    stdio: 'inherit',
    shell: true
  });

  prismaGenerate.on('close', (code) => {
    isGenerating = false;
    if (code === 0) {
      console.log('✅ Prismaクライアントの再生成が完了しました');
    } else {
      console.error('❌ Prismaクライアントの再生成に失敗しました');
    }
  });

  prismaGenerate.on('error', (err) => {
    isGenerating = false;
    console.error('❌ Prismaクライアント生成エラー:', err);
  });
}

// ファイル変更時のイベント
watcher.on('change', (path) => {
  console.log(`📝 スキーマファイルが変更されました: ${path}`);
  generatePrismaClient();
});

// エラーハンドリング
watcher.on('error', (error) => {
  console.error('❌ ファイル監視エラー:', error);
});

// 初期生成
console.log('🚀 初期Prismaクライアント生成...');
generatePrismaClient();

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n🛑 Prisma監視を停止します...');
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Prisma監視を停止します...');
  watcher.close();
  process.exit(0);
});

console.log('👀 Prismaスキーマファイルの変更を監視中...');
