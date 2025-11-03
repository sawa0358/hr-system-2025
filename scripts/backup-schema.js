const fs = require('fs');
const path = require('path');

/**
 * データベーススキーマのバックアップを作成
 */
function backupSchema() {
  try {
    console.log('データベーススキーマのバックアップを開始します...');
    
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const backupDir = path.join(__dirname, '../prisma/schema-backups');
    
    // バックアップディレクトリが存在しない場合は作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // バックアップファイル名を生成（タイムスタンプ付き）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `schema.backup.${timestamp}.prisma`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // スキーマファイルが存在するかチェック
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ スキーマファイルが見つかりません:', schemaPath);
      process.exit(1);
    }
    
    // バックアップを作成
    fs.copyFileSync(schemaPath, backupPath);
    
    console.log('✅ データベーススキーマのバックアップが完了しました！');
    console.log(`📁 バックアップファイル: ${backupFileName}`);
    console.log(`📂 保存先: ${backupPath}`);
    
    // 現在のスキーマの情報を表示
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const modelCount = (schemaContent.match(/^model\s+\w+/gm) || []).length;
    const enumCount = (schemaContent.match(/^enum\s+\w+/gm) || []).length;
    
    console.log(`📊 スキーマ情報:`);
    console.log(`   - モデル数: ${modelCount}`);
    console.log(`   - 列挙型数: ${enumCount}`);
    
    // 古いバックアップファイルを削除（10個以上ある場合）
    cleanupOldBackups(backupDir);
    
    // バックアップ一覧を表示
    listBackups(backupDir);
    
  } catch (error) {
    console.error('❌ スキーマのバックアップに失敗しました:', error);
    process.exit(1);
  }
}

/**
 * 古いバックアップファイルを削除
 */
function cleanupOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schema.backup.') && file.endsWith('.prisma'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // 新しい順にソート
    
    // 10個以上のバックアップがある場合、古いものを削除
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      console.log(`🗑️  古いスキーマバックアップファイルを削除します (${filesToDelete.length}個)`);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`   - 削除: ${file.name}`);
      });
    }
    
  } catch (error) {
    console.warn('⚠️  古いバックアップファイルの削除に失敗しました:', error);
  }
}

/**
 * バックアップ一覧を表示
 */
function listBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schema.backup.') && file.endsWith('.prisma'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    if (backupFiles.length > 0) {
      console.log(`\n📋 利用可能なスキーマバックアップ (${backupFiles.length}個):`);
      backupFiles.forEach((file, index) => {
        const date = file.stats.mtime.toLocaleString('ja-JP');
        const size = (file.stats.size / 1024).toFixed(1);
        console.log(`   ${index + 1}. ${file.name} (${date}, ${size}KB)`);
      });
    }
    
  } catch (error) {
    console.warn('⚠️  バックアップ一覧の取得に失敗しました:', error);
  }
}

// 実行
backupSchema();
