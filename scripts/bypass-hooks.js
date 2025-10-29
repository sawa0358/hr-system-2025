#!/usr/bin/env node

/**
 * Gitフック自動回避スクリプト
 * --no-verifyフラグを使用してGitフックをスキップできます
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];
const restArgs = args.slice(1);

if (!command) {
  console.log('📚 Gitフック回避スクリプト使用方法:');
  console.log('');
  console.log('  node scripts/bypass-hooks.js commit "メッセージ"  - コミット（フックスキップ）');
  console.log('  node scripts/bypass-hooks.js push                - プッシュ');
  console.log('  node scripts/bypass-hooks.js merge <branch>      - マージ（フックスキップ）');
  console.log('');
  process.exit(1);
}

try {
  switch (command) {
    case 'commit':
      if (!restArgs[0]) {
        console.error('❌ コミットメッセージが必要です');
        process.exit(1);
      }
      const message = restArgs[0];
      console.log('🚀 フックをスキップしてコミットします...');
      execSync(`git commit --no-verify -m "${message}"`, { stdio: 'inherit' });
      console.log('✅ コミット完了（フックをスキップしました）');
      break;

    case 'push':
      console.log('🚀 プッシュします...');
      execSync(`git push ${restArgs.join(' ')}`, { stdio: 'inherit' });
      console.log('✅ プッシュ完了');
      break;

    case 'merge':
      if (!restArgs[0]) {
        console.error('❌ マージするブランチ名が必要です');
        process.exit(1);
      }
      const branch = restArgs[0];
      console.log(`🚀 フックをスキップしてマージします: ${branch}`);
      execSync(`git merge --no-verify ${branch}`, { stdio: 'inherit' });
      console.log('✅ マージ完了（フックをスキップしました）');
      break;

    case 'pull':
      console.log('🚀 フックをスキップしてプルします...');
      execSync(`git pull --no-verify ${restArgs.join(' ')}`, { stdio: 'inherit' });
      console.log('✅ プル完了（フックをスキップしました）');
      break;

    default:
      console.error(`❌ 不明なコマンド: ${command}`);
      console.log('利用可能なコマンド: commit, push, merge, pull');
      process.exit(1);
  }
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
}

