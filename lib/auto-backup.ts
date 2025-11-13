/**
 * HR System v1.9.3 自動バックアップ機能
 * 
 * アプリケーション起動時や特定のイベント時に自動的にバックアップを実行します
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface BackupConfig {
  enabled: boolean;
  backupDir: string;
  retentionDays: number;
  maxBackups: number;
  compress: boolean;
  // バックアップを実行するタイミング
  triggers: {
    onStartup: boolean;
    onEmployeeUpdate: boolean;
    onFileUpload: boolean;
    onDaily: boolean;
  };
}

const DEFAULT_CONFIG: BackupConfig = {
  enabled: process.env.NODE_ENV === 'production' || process.env.AUTO_BACKUP === 'true',
  backupDir: 'backups',
  retentionDays: 30,
  maxBackups: 50,
  compress: true,
  triggers: {
    onStartup: true,
    onEmployeeUpdate: false, // 頻繁すぎる場合は無効化
    onFileUpload: false,
    onDaily: true
  }
};

class AutoBackupManager {
  private config: BackupConfig;
  private lastBackupTime: Date | null = null;
  private backupInProgress = false;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * バックアップを実行
   */
  async createBackup(reason: string = 'manual'): Promise<void> {
    if (!this.config.enabled || this.backupInProgress) {
      return;
    }

    // 最後のバックアップから1時間以内の場合はスキップ
    if (this.lastBackupTime && 
        Date.now() - this.lastBackupTime.getTime() < 60 * 60 * 1000) {
      console.log('⏭️  バックアップをスキップ（1時間以内に実行済み）');
      return;
    }

    this.backupInProgress = true;

    try {
      console.log(`🔄 自動バックアップを開始 (理由: ${reason})`);
      
      // バックアップディレクトリを確保
      this.ensureBackupDir();
      
      // バックアップスクリプトを実行
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.config.backupDir, `auto-backup-${timestamp}.json`);
      
      // 既存のバックアップスクリプトを使用
      execSync('node scripts/export-current-db.js', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      // 最新のバックアップファイルを移動
      const latestBackup = this.getLatestBackupFile();
      if (latestBackup) {
        const destPath = path.join(this.config.backupDir, `auto-backup-${timestamp}.json`);
        fs.renameSync(latestBackup, destPath);
        
        console.log(`✅ 自動バックアップ完了: ${destPath}`);
        
        // 圧縮
        if (this.config.compress) {
          this.compressBackup(destPath);
        }
      }
      
      // 古いバックアップをクリーンアップ
      this.cleanupOldBackups();
      
      this.lastBackupTime = new Date();
      
    } catch (error) {
      console.error('❌ 自動バックアップエラー:', error);
    } finally {
      this.backupInProgress = false;
    }
  }

  /**
   * バックアップディレクトリを確保
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
      console.log(`📁 バックアップディレクトリを作成: ${this.config.backupDir}`);
    }
  }

  /**
   * 最新のバックアップファイルを取得
   */
  private getLatestBackupFile(): string | null {
    try {
      const files = fs.readdirSync('.')
        .filter(file => file.startsWith('current-db-backup-') && file.endsWith('.json'))
        .sort()
        .pop();
      
      return files || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * バックアップファイルを圧縮
   */
  private compressBackup(filePath: string): void {
    try {
      execSync(`gzip "${filePath}"`, { stdio: 'pipe' });
      console.log(`📦 バックアップを圧縮: ${filePath}.gz`);
    } catch (error) {
      console.log('⚠️  圧縮に失敗しました');
    }
  }

  /**
   * 古いバックアップファイルを削除
   */
  private cleanupOldBackups(): void {
    try {
      const files = fs.readdirSync(this.config.backupDir)
        .filter(file => file.startsWith('auto-backup-') && (file.endsWith('.json') || file.endsWith('.json.gz')))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDir, file),
          stats: fs.statSync(path.join(this.config.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // 保持期間を過ぎたファイルを削除
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      files.forEach(file => {
        if (file.stats.mtime < cutoffDate) {
          fs.unlinkSync(file.path);
          deletedCount++;
        }
      });

      // 最大数を超えたファイルを削除
      if (files.length - deletedCount > this.config.maxBackups) {
        const filesToDelete = files.slice(this.config.maxBackups);
        filesToDelete.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            deletedCount++;
          }
        });
      }

      if (deletedCount > 0) {
        console.log(`🗑️  ${deletedCount}個の古いバックアップを削除`);
      }
    } catch (error) {
      console.error('❌ 古いバックアップの削除エラー:', error);
    }
  }

  /**
   * アプリケーション起動時のバックアップ
   */
  async onStartup(): Promise<void> {
    if (this.config.triggers.onStartup) {
      await this.createBackup('startup');
    }
  }

  /**
   * 社員データ更新時のバックアップ
   */
  async onEmployeeUpdate(): Promise<void> {
    if (this.config.triggers.onEmployeeUpdate) {
      await this.createBackup('employee-update');
    }
  }

  /**
   * ファイルアップロード時のバックアップ
   */
  async onFileUpload(): Promise<void> {
    if (this.config.triggers.onFileUpload) {
      await this.createBackup('file-upload');
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * バックアップ状態を取得
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      lastBackupTime: this.lastBackupTime,
      backupInProgress: this.backupInProgress,
      backupDir: this.config.backupDir
    };
  }
}

// シングルトンインスタンス
export const autoBackupManager = new AutoBackupManager();

// 環境変数から設定を読み込み
if (process.env.AUTO_BACKUP_CONFIG) {
  try {
    const envConfig = JSON.parse(process.env.AUTO_BACKUP_CONFIG);
    autoBackupManager.updateConfig(envConfig);
  } catch (error) {
    console.error('❌ 自動バックアップ設定の読み込みエラー:', error);
  }
}

export default autoBackupManager;


