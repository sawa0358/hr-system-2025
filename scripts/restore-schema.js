const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * データベーススキーマを復元
 */
function restoreSchema() {
  try {
    console.log('データベーススキーマの復元を開始します...');
    
    const backupDir = path.join(__dirname, '../prisma/schema-backups');
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    
    // バックアップディレクトリが存在しない場合
    if (!fs.existsSync(backupDir)) {
      console.error('❌ バックアップディレクトリが見つかりません:', backupDir);
      process.exit(1);
    }
    
    // 利用可能なバックアップファイルを取得
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schema.backup.') && file.endsWith('.prisma'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // 新しい順にソート
    
    if (backupFiles.length === 0) {
      console.error('❌ 復元可能なスキーマバックアップが見つかりません');
      process.exit(1);
    }
    
    // コマンドライン引数から復元するファイルを指定
    const targetFile = process.argv[2];
    let selectedBackup;
    
    if (targetFile) {
      // 指定されたファイルを検索
      selectedBackup = backupFiles.find(file => file.name === targetFile);
      if (!selectedBackup) {
        console.error(`❌ 指定されたバックアップファイルが見つかりません: ${targetFile}`);
        console.log('利用可能なバックアップファイル:');
        backupFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name}`);
        });
        process.exit(1);
      }
    } else {
      // 最新のバックアップを使用
      selectedBackup = backupFiles[0];
      console.log(`📁 最新のバックアップを使用します: ${selectedBackup.name}`);
    }
    
    // 現在のスキーマをバックアップ（復元前の安全対策）
    const currentBackupName = `schema.current.${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.prisma`;
    const currentBackupPath = path.join(backupDir, currentBackupName);
    
    if (fs.existsSync(schemaPath)) {
      fs.copyFileSync(schemaPath, currentBackupPath);
      console.log(`💾 現在のスキーマをバックアップしました: ${currentBackupName}`);
    }
    
    // スキーマを復元
    fs.copyFileSync(selectedBackup.path, schemaPath);
    
    console.log('✅ データベーススキーマの復元が完了しました！');
    console.log(`📁 復元元: ${selectedBackup.name}`);
    console.log(`📂 復元先: ${schemaPath}`);
    
    // 復元されたスキーマの情報を表示
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const modelCount = (schemaContent.match(/^model\s+\w+/gm) || []).length;
    const enumCount = (schemaContent.match(/^enum\s+\w+/gm) || []).length;
    
    console.log(`📊 復元されたスキーマ情報:`);
    console.log(`   - モデル数: ${modelCount}`);
    console.log(`   - 列挙型数: ${enumCount}`);
    
    // データベースの再生成を提案
    console.log('\n🔄 次のステップ:');
    console.log('   1. データベースを再生成: npm run db:generate');
    console.log('   2. マイグレーションを実行: npm run db:migrate');
    console.log('   3. シードデータを投入: npm run db:seed');
    
  } catch (error) {
    console.error('❌ スキーマの復元に失敗しました:', error);
    process.exit(1);
  }
}

/**
 * バックアップ一覧を表示
 */
function listBackups() {
  try {
    const backupDir = path.join(__dirname, '../prisma/schema-backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('❌ バックアップディレクトリが見つかりません');
      return;
    }
    
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schema.backup.') && file.endsWith('.prisma'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    if (backupFiles.length === 0) {
      console.log('❌ 利用可能なスキーマバックアップがありません');
      return;
    }
    
    console.log(`📋 利用可能なスキーマバックアップ (${backupFiles.length}個):`);
    backupFiles.forEach((file, index) => {
      const date = file.stats.mtime.toLocaleString('ja-JP');
      const size = (file.stats.size / 1024).toFixed(1);
      console.log(`   ${index + 1}. ${file.name} (${date}, ${size}KB)`);
    });
    
  } catch (error) {
    console.error('❌ バックアップ一覧の取得に失敗しました:', error);
  }
}

// コマンドライン引数の処理
const command = process.argv[2];

if (command === 'list') {
  listBackups();
} else {
  restoreSchema();
}
