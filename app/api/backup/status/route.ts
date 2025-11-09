import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * バックアップ状態を取得
 */
export async function GET() {
  try {
    const backupDir = 'backups';
    const enabled = process.env.AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production';
    
    // バックアップファイル一覧を取得
    let backupFiles: any[] = [];
    let totalSize = 0;
    
    if (fs.existsSync(backupDir)) {
      backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('auto-backup-') && (file.endsWith('.json') || file.endsWith('.json.gz')))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          return {
            name: file,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            created: stats.mtime.toISOString(),
            createdFormatted: stats.mtime.toLocaleString('ja-JP')
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    
    // 最新のバックアップファイル
    const latestBackup = backupFiles.length > 0 ? backupFiles[0] : null;
    
    return NextResponse.json({
      enabled,
      backupDir,
      totalBackups: backupFiles.length,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      latestBackup,
      backupFiles: backupFiles.slice(0, 10), // 最新10件のみ
      config: {
        retentionDays: 30,
        maxBackups: 50,
        compress: true
      }
    });
    
  } catch (error) {
    console.error('❌ バックアップ状態取得エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '状態取得に失敗しました' 
      },
      { status: 500 }
    );
  }
}

/**
 * ファイルサイズをフォーマット
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

