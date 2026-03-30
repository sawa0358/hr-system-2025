import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { uploadBackupToS3, uploadLocalFileToS3 } from '@/lib/s3-client';

// バックアップ設定
const BACKUP_CONFIG = {
  backupDir: 'backups',
  retentionDays: 30,
  maxBackups: 50,
  compress: true
};

/**
 * バックアップを実行
 */
export async function POST(request: NextRequest) {
  try {
    // 認可チェック: admin のみバックアップ実行を許可
    const userRole = request.headers.get('x-employee-role')
    if (userRole !== 'admin' && userRole !== 'hr') {
      return NextResponse.json(
        { error: 'バックアップの実行は管理者または総務のみが可能です' },
        { status: 403 }
      )
    }

    const { reason } = await request.json();
    
    console.log(`🔄 バックアップAPI実行開始 (理由: ${reason})`);
    
    // バックアップディレクトリを確保
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
    }
    
    // バックアップスクリプトを実行
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // 既存のバックアップスクリプトを実行
      execSync('node scripts/export-current-db.js', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      // 最新のバックアップファイルを移動
      const files = fs.readdirSync('.')
        .filter(file => file.startsWith('current-db-backup-') && file.endsWith('.json'))
        .sort();
      
      if (files.length > 0) {
        const latestFile = files[files.length - 1];
        const sourcePath = latestFile;
        const destPath = path.join(BACKUP_CONFIG.backupDir, `auto-backup-${timestamp}.json`);
        
        fs.renameSync(sourcePath, destPath);
        
        // 圧縮
        if (BACKUP_CONFIG.compress) {
          try {
            execSync(`gzip "${destPath}"`, { stdio: 'pipe' });
            console.log(`📦 バックアップを圧縮: ${destPath}.gz`);
          } catch (error) {
            console.log('⚠️  圧縮に失敗しました');
          }
        }
        
        // 古いバックアップをクリーンアップ
        cleanupOldBackups();
        
        console.log(`✅ バックアップ完了: ${destPath}`);
        
        // S3へのアップロード（環境変数で有効化されている場合）
        let s3Result = null;
        if (process.env.AUTO_S3_BACKUP === 'true') {
          try {
            console.log('📤 S3へのアップロードを開始...');
            const finalPath = BACKUP_CONFIG.compress ? `${destPath}.gz` : destPath;
            
            // ファイルが存在することを確認
            if (fs.existsSync(finalPath)) {
              s3Result = await uploadLocalFileToS3(finalPath, 'backups');
              
              if (s3Result.success) {
                console.log(`✅ S3へのアップロード完了: ${s3Result.s3Path}`);
              } else {
                console.error(`⚠️  S3へのアップロード失敗: ${s3Result.error}`);
              }
            } else {
              console.error(`⚠️  バックアップファイルが見つかりません: ${finalPath}`);
              s3Result = { success: false, error: 'バックアップファイルが見つかりません' };
            }
          } catch (error) {
            console.error('⚠️  S3アップロードエラー:', error);
            s3Result = { 
              success: false, 
              error: error instanceof Error ? error.message : 'アップロードに失敗しました' 
            };
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'バックアップが完了しました',
          backupFile: destPath,
          timestamp: new Date().toISOString(),
          s3Uploaded: s3Result?.success || false,
          s3Path: s3Result?.s3Path
        });
      } else {
        throw new Error('バックアップファイルが生成されませんでした');
      }
      
    } catch (error) {
      console.error('❌ バックアップスクリプト実行エラー:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ バックアップAPIエラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'バックアップに失敗しました' 
      },
      { status: 500 }
    );
  }
}

/**
 * バックアップ状態を取得
 */
export async function GET() {
  try {
    const backupDir = BACKUP_CONFIG.backupDir;
    const enabled = process.env.AUTO_BACKUP === 'true' || process.env.NODE_ENV === 'production';
    
    // バックアップファイル一覧を取得
    let backupFiles: any[] = [];
    if (fs.existsSync(backupDir)) {
      backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('auto-backup-') && (file.endsWith('.json') || file.endsWith('.json.gz')))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    
    return NextResponse.json({
      enabled,
      backupDir,
      backupFiles,
      config: {
        retentionDays: BACKUP_CONFIG.retentionDays,
        maxBackups: BACKUP_CONFIG.maxBackups,
        compress: BACKUP_CONFIG.compress
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
 * 古いバックアップファイルを削除
 */
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir)
      .filter(file => file.startsWith('auto-backup-') && (file.endsWith('.json') || file.endsWith('.json.gz')))
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
      }
    });

    // 最大数を超えたファイルを削除
    if (files.length - deletedCount > BACKUP_CONFIG.maxBackups) {
      const filesToDelete = files.slice(BACKUP_CONFIG.maxBackups);
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















