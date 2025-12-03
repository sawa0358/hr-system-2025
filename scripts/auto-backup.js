#!/usr/bin/env node

/**
 * HR System v1.9.3 自動バックアップスクリプト
 * 
 * このスクリプトは以下のタイミングで実行されます：
 * - アプリケーション起動時
 * - 定期的なバックアップ（cron等）
 * - Gitコミット前（pre-commit hook）
 * - デプロイ前
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// バックアップ設定
const BACKUP_CONFIG = {
  // バックアップ保存先ディレクトリ
  backupDir: 'backups',
  // バックアップファイルの保持期間（日数）
  retentionDays: 30,
  // バックアップファイルの最大数
  maxBackups: 50,
  // 圧縮するかどうか
  compress: true
};

/**
 * バックアップディレクトリを作成
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
    fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
    console.log(`📁 バックアップディレクトリを作成しました: ${BACKUP_CONFIG.backupDir}`);
  }
}

/**
 * 古いバックアップファイルを削除
 */
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir)
      .filter(file => file.startsWith('current-db-backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_CONFIG.backupDir, file),
        stats: fs.statSync(path.join(BACKUP_CONFIG.backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    // 保持期間を過ぎたファイルを削除
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);

    let deletedCount = 0;
    files.forEach(file => {
      if (file.stats.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        deletedCount++;
        console.log(`🗑️  古いバックアップを削除: ${file.name}`);
      }
    });

    // 最大数を超えたファイルを削除
    if (files.length - deletedCount > BACKUP_CONFIG.maxBackups) {
      const filesToDelete = files.slice(BACKUP_CONFIG.maxBackups);
      filesToDelete.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          deletedCount++;
          console.log(`🗑️  最大数を超えたバックアップを削除: ${file.name}`);
        }
      });
    }

    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount}個の古いバックアップファイルを削除しました`);
    }
  } catch (error) {
    console.error('❌ 古いバックアップの削除エラー:', error.message);
  }
}

/**
 * データベースのバックアップを実行
 */
function createBackup() {
  try {
    console.log('🔄 自動バックアップを開始します...');
    
    // バックアップディレクトリを確保
    ensureBackupDir();
    
    // 既存のバックアップスクリプトを実行
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_CONFIG.backupDir, `current-db-backup-${timestamp}.json`);
    
    // バックアップスクリプトを実行
    execSync(`node scripts/export-current-db.js`, { stdio: 'inherit' });
    
    // 最新のバックアップファイルをバックアップディレクトリに移動
    const latestBackup = fs.readdirSync('.')
      .filter(file => file.startsWith('current-db-backup-') && file.endsWith('.json'))
      .sort()
      .pop();
    
    if (latestBackup) {
      const sourcePath = latestBackup;
      const destPath = path.join(BACKUP_CONFIG.backupDir, latestBackup);
      
      if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, destPath);
        console.log(`✅ バックアップを保存しました: ${destPath}`);
        
        // 圧縮オプションが有効な場合
        if (BACKUP_CONFIG.compress) {
          try {
            execSync(`gzip "${destPath}"`, { stdio: 'inherit' });
            console.log(`📦 バックアップを圧縮しました: ${destPath}.gz`);
          } catch (error) {
            console.log('⚠️  圧縮に失敗しました（gzipが利用できない可能性があります）');
          }
        }
      }
    }
    
    // 古いバックアップをクリーンアップ
    cleanupOldBackups();
    
    console.log('🎉 自動バックアップが完了しました！');
    
  } catch (error) {
    console.error('❌ 自動バックアップエラー:', error.message);
    process.exit(1);
  }
}

/**
 * スキーマのバックアップも作成
 */
function createSchemaBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const schemaBackup = path.join(BACKUP_CONFIG.backupDir, `schema-backup-${timestamp}.prisma`);
    
    if (fs.existsSync('prisma/schema.prisma')) {
      fs.copyFileSync('prisma/schema.prisma', schemaBackup);
      console.log(`📋 スキーマバックアップを作成: ${schemaBackup}`);
    }
  } catch (error) {
    console.error('❌ スキーマバックアップエラー:', error.message);
  }
}

// メイン実行
if (require.main === module) {
  createBackup();
  createSchemaBackup();
}

module.exports = {
  createBackup,
  createSchemaBackup,
  cleanupOldBackups
};








