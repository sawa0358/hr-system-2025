#!/usr/bin/env node

/**
 * Git Pre-commit Hook
 * コミット前に自動でスキーマ管理とビルドテストを実行
 */

const { execSync } = require('child_process');
const AutoSchemaManager = require('./auto-schema-manager');

async function preCommitCheck() {
  console.log('🚀 Pre-commit チェックを開始...');

  try {
    // 1. 自動スキーマ管理
    console.log('📋 スキーマ管理を実行中...');
    const manager = new AutoSchemaManager();
    await manager.run();

    // 2. 本番環境用スキーマでビルドテスト
    console.log('🔨 本番環境用スキーマでビルドテストを実行中...');
    
    // 一時的に本番環境用スキーマに切り替え
    execSync('node scripts/switch-schema.js prod', { stdio: 'inherit' });
    
    // ビルドテスト
    execSync('npm run build', { stdio: 'inherit' });
    
    // 開発環境用スキーマに戻す
    execSync('node scripts/switch-schema.js dev', { stdio: 'inherit' });

    console.log('✅ Pre-commit チェックが完了しました！');
    console.log('🎉 コミット可能です');

  } catch (error) {
    console.error('❌ Pre-commit チェックに失敗しました:', error.message);
    console.error('💡 エラーを修正してから再度コミットしてください');
    process.exit(1);
  }
}

preCommitCheck();
