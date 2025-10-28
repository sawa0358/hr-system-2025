/**
 * バックアップスケジューラーの初期化
 * サーバー起動時に自動的に実行される
 */

import { startBackupScheduler } from './backup-scheduler';

// 本番環境でのみ自動起動（環境変数で制御可能）
const shouldAutoStart = 
  process.env.AUTO_S3_BACKUP === 'true' &&
  (process.env.NODE_ENV === 'production' || process.env.AUTO_START_SCHEDULER === 'true');

if (shouldAutoStart) {
  console.log('🚀 バックアップスケジューラーを初期化中...');
  startBackupScheduler();
}

