import { NextRequest, NextResponse } from 'next/server';
import { startBackupScheduler, stopBackupScheduler, getSchedulerStatus } from '@/lib/backup-scheduler';

// シングルトンパターンで管理
let schedulerStarted = false;

// 本番環境では自動起動しない（APIを通じて制御する）
// 開発環境でのみ自動起動
if (!schedulerStarted && process.env.AUTO_S3_BACKUP === 'true' && process.env.NODE_ENV !== 'production') {
  startBackupScheduler();
  schedulerStarted = true;
}

/**
 * スケジューラーの状態を取得
 */
export async function GET() {
  const status = getSchedulerStatus();
  
  return NextResponse.json({
    success: true,
    status,
  });
}

/**
 * スケジューラーを開始
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      startBackupScheduler();
      schedulerStarted = true;
      return NextResponse.json({
        success: true,
        message: 'バックアップスケジューラーを開始しました',
      });
    } else if (action === 'stop') {
      stopBackupScheduler();
      schedulerStarted = false;
      return NextResponse.json({
        success: true,
        message: 'バックアップスケジューラーを停止しました',
      });
    } else {
      return NextResponse.json(
        { success: false, error: '無効なアクションです' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '操作に失敗しました' 
      },
      { status: 500 }
    );
  }
}

