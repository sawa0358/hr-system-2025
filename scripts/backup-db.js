const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * データベースのバックアップを作成
 */
function backupDatabase() {
  try {
    console.log('データベースのバックアップを開始します...');
    
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    const backupDir = path.join(__dirname, '../prisma');
    
    // バックアップファイル名を生成（タイムスタンプ付き）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `dev.db.backup.${timestamp}`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // データベースファイルが存在するかチェック
    if (!fs.existsSync(dbPath)) {
      console.error('❌ データベースファイルが見つかりません:', dbPath);
      process.exit(1);
    }
    
    // バックアップを作成
    fs.copyFileSync(dbPath, backupPath);
    
    console.log('✅ データベースのバックアップが完了しました！');
    console.log(`📁 バックアップファイル: ${backupFileName}`);
    console.log(`📂 保存先: ${backupPath}`);
    
    // バックアップファイルのサイズを表示
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 ファイルサイズ: ${fileSizeInMB} MB`);
    
    // 古いバックアップファイルを削除（5個以上ある場合）
    cleanupOldBackups(backupDir);
    
  } catch (error) {
    console.error('❌ データベースのバックアップに失敗しました:', error);
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
      .filter(file => file.startsWith('dev.db.backup.'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // 新しい順にソート
    
    // 5個以上のバックアップがある場合、古いものを削除
    if (backupFiles.length > 5) {
      const filesToDelete = backupFiles.slice(5);
      console.log(`🗑️  古いバックアップファイルを削除します (${filesToDelete.length}個)`);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`   - 削除: ${file.name}`);
      });
    }
    
  } catch (error) {
    console.warn('⚠️  古いバックアップファイルの削除に失敗しました:', error);
  }
}

// 実行
backupDatabase();
