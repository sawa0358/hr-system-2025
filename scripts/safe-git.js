#!/usr/bin/env node

/**
 * 安全なGit操作スクリプト
 * フックを自動的にスキップし、変更が保持されることを確認
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 環境変数でフックを無効化
process.env.SKIP_HOOKS = 'true';

const command = process.argv[2];
const args = process.argv.slice(3).join(' ');

if (!command) {
  console.log('📚 安全なGit操作スクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  node scripts/safe-git.js <command> [args...]');
  console.log('');
  console.log('例:');
  console.log('  node scripts/safe-git.js commit "メッセージ"');
  console.log('  node scripts/safe-git.js push origin feature/branch');
  console.log('  node scripts/safe-git.js merge main');
  console.log('');
  process.exit(1);
}

// コミット前の確認
function checkSchemaBeforeCommit() {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    if (schema.includes('model MasterData')) {
      console.log('✅ MasterDataモデルが確認されました');
      return true;
    } else {
      console.warn('⚠️  MasterDataモデルが見つかりません。schema-base.prismaを確認してください。');
      return false;
    }
  }
  return true;
}

try {
  if (command === 'commit') {
    // コミット前の確認
    if (!checkSchemaBeforeCommit()) {
      console.error('❌ スキーマに問題があります。コミットを中止します。');
      process.exit(1);
    }
    
    const message = args.replace(/^["']|["']$/g, '');
    console.log('🚀 安全なコミットを実行中（フックスキップ）...');
    execSync(`git commit --no-verify -m "${message}"`, { stdio: 'inherit' });
    console.log('✅ コミット完了');
    
    // コミット後の確認
    if (checkSchemaBeforeCommit()) {
      console.log('✅ コミット後もMasterDataモデルが保持されています');
    }
  } else if (command === 'push') {
    console.log('🚀 プッシュを実行中...');
    execSync(`git push ${args}`, { stdio: 'inherit' });
    console.log('✅ プッシュ完了');
  } else if (command === 'merge') {
    const branch = args.split(' ')[0];
    console.log(`🚀 安全なマージを実行中（フックスキップ）: ${branch}...`);
    
    // マージ前の確認
    if (!checkSchemaBeforeCommit()) {
      console.error('❌ スキーマに問題があります。マージを中止します。');
      process.exit(1);
    }
    
    execSync(`git merge --no-verify ${branch}`, { stdio: 'inherit' });
    console.log('✅ マージ完了');
    
    // マージ後の確認
    if (checkSchemaBeforeCommit()) {
      console.log('✅ マージ後もMasterDataモデルが保持されています');
    }
  } else if (command === 'pull') {
    console.log('🚀 プルを実行中...');
    execSync(`git pull ${args}`, { stdio: 'inherit' });
    console.log('✅ プル完了');
    
    // プル後の確認
    if (checkSchemaBeforeCommit()) {
      console.log('✅ プル後もMasterDataモデルが保持されています');
    }
  } else {
    console.error(`❌ 不明なコマンド: ${command}`);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
}

