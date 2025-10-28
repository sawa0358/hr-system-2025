/**
 * S3自動バックアップスケジューラー
 * 
 * 設定された間隔で自動的にデータベースとファイルをバックアップしてS3にアップロードします
 */

const INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24', 10);
const ENABLED = process.env.AUTO_S3_BACKUP === 'true';

let intervalId: NodeJS.Timeout | null = null;

/**
 * バックアップを実行
 */
async function executeBackup() {
  if (!ENABLED) {
    console.log('⏭️  自動バックアップは無効化されています');
    return;
  }

  try {
    console.log(`🔄 自動バックアップを開始... (${new Date().toISOString()})`);
    
    // バックアップAPIを呼び出し
    // 本番環境のURLを自動検出
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      if (process.env.NODE_ENV === 'production') {
        // Heroku環境の場合
        if (process.env.HEROKU_APP_NAME) {
          baseUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
        } else if (process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else {
          // その他の本番環境
          baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        }
      } else {
        // 開発環境
        baseUrl = 'http://localhost:3007';
      }
    }
    
    const response = await fetch(`${baseUrl}/api/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'scheduled' }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 自動バックアップ完了:', {
        backupFile: result.backupFile,
        s3Uploaded: result.s3Uploaded,
        s3Path: result.s3Path,
      });
    } else {
      console.error('❌ 自動バックアップ失敗:', result.error);
    }
  } catch (error) {
    console.error('❌ 自動バックアップ実行エラー:', error);
  }
}

/**
 * スケジューラーを開始
 */
export function startBackupScheduler() {
  if (!ENABLED) {
    console.log('⏭️  自動バックアップスケジューラーは無効化されています');
    return;
  }

  if (intervalId) {
    console.log('⚠️  バックアップスケジューラーは既に実行中です');
    return;
  }

  console.log(`🚀 自動バックアップスケジューラーを開始 (間隔: ${INTERVAL_HOURS}時間)`);
  
  // 初回実行（起動後すぐ）
  executeBackup();
  
  // 定期実行を設定
  const intervalMs = INTERVAL_HOURS * 60 * 60 * 1000;
  intervalId = setInterval(executeBackup, intervalMs);
}

/**
 * スケジューラーを停止
 */
export function stopBackupScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 自動バックアップスケジューラーを停止しました');
  }
}

/**
 * スケジューラーの状態を取得
 */
export function getSchedulerStatus() {
  return {
    enabled: ENABLED,
    running: intervalId !== null,
    intervalHours: INTERVAL_HOURS,
  };
}

