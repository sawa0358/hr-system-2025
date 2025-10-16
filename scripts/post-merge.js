#!/usr/bin/env node

/**
 * Git Post-merge Hook
 * マージ後に自動でスキーマ管理を実行
 */

const AutoSchemaManager = require('./auto-schema-manager');

async function postMergeCheck() {
  console.log('🔄 Post-merge チェックを開始...');

  try {
    // 自動スキーマ管理
    const manager = new AutoSchemaManager();
    await manager.run();

    console.log('✅ Post-merge チェックが完了しました！');
    console.log('🎉 最新のスキーマが適用されました');

  } catch (error) {
    console.error('❌ Post-merge チェックに失敗しました:', error.message);
    console.error('💡 手動でスキーマ管理を実行してください: npm run schema:sync');
  }
}

postMergeCheck();
