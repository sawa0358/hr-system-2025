#!/usr/bin/env node

/**
 * Git Hooks セットアップスクリプト
 * 自動スキーマ管理のためのGit hooksを設定
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const gitHooksDir = path.join(__dirname, '..', '.git', 'hooks');
const scriptsDir = path.join(__dirname);

function setupGitHooks() {
  console.log('🔧 Git Hooks をセットアップ中...');

  // .git/hooks ディレクトリが存在するか確認
  if (!fs.existsSync(gitHooksDir)) {
    console.error('❌ .git/hooks ディレクトリが見つかりません');
    console.error('💡 このプロジェクトがGitリポジトリであることを確認してください');
    process.exit(1);
  }

  // Pre-commit hook
  const preCommitHook = `#!/bin/sh
# Pre-commit hook for automatic schema management
node ${path.join(scriptsDir, 'pre-commit.js')}
`;

  // Post-merge hook
  const postMergeHook = `#!/bin/sh
# Post-merge hook for automatic schema management
node ${path.join(scriptsDir, 'post-merge.js')}
`;

  try {
    // Pre-commit hook を設定
    fs.writeFileSync(path.join(gitHooksDir, 'pre-commit'), preCommitHook);
    fs.chmodSync(path.join(gitHooksDir, 'pre-commit'), '755');
    console.log('✅ Pre-commit hook を設定しました');

    // Post-merge hook を設定
    fs.writeFileSync(path.join(gitHooksDir, 'post-merge'), postMergeHook);
    fs.chmodSync(path.join(gitHooksDir, 'post-merge'), '755');
    console.log('✅ Post-merge hook を設定しました');

    console.log('🎉 Git Hooks のセットアップが完了しました！');
    console.log('');
    console.log('📋 設定された機能:');
    console.log('  - Pre-commit: コミット前に自動スキーマ管理とビルドテスト');
    console.log('  - Post-merge: マージ後に自動スキーマ管理');
    console.log('');
    console.log('🚀 これで自動運用が開始されます！');

  } catch (error) {
    console.error('❌ Git Hooks のセットアップに失敗しました:', error.message);
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  setupGitHooks();
}

module.exports = setupGitHooks;
