import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface FileDownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// ローカルファイル保存用のディレクトリ
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * アップロードディレクトリを確保
 */
async function ensureUploadDir(employeeId: string, category: string): Promise<string> {
  const dirPath = path.join(UPLOAD_DIR, employeeId, category);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * ファイルをローカルファイルシステムにアップロード
 */
export async function uploadFileToLocal(
  file: Buffer,
  fileName: string,
  contentType: string,
  employeeId: string,
  category: string,
  folder?: string
): Promise<FileUploadResult> {
  try {
    // アップロードディレクトリを確保
    const uploadDir = await ensureUploadDir(employeeId, category);
    
    // フォルダがある場合はさらにサブディレクトリを作成
    const fullPath = folder ? path.join(uploadDir, folder) : uploadDir;
    if (folder) {
      await fs.mkdir(fullPath, { recursive: true });
    }
    
    // ファイルパス
    const filePath = path.join(fullPath, fileName);
    
    // ファイルを保存
    await fs.writeFile(filePath, file);
    
    // 相対パスを返す（データベース保存用）
    const relativePath = path.relative(UPLOAD_DIR, filePath);
    
    return {
      success: true,
      filePath: relativePath.replace(/\\/g, '/'), // Windowsの場合はスラッシュに統一
    };
  } catch (error) {
    console.error('ローカルファイルアップロードエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}

/**
 * ファイルのダウンロードURLを取得
 */
export async function getLocalDownloadUrl(filePath: string): Promise<FileDownloadResult> {
  try {
    // 絶対パスに変換
    const absolutePath = path.join(UPLOAD_DIR, filePath);
    
    // ファイルの存在確認
    try {
      await fs.access(absolutePath);
    } catch {
      return { success: false, error: 'ファイルが見つかりません' };
    }
    
    // APIエンドポイントのURLを返す
    const url = `/api/files/download/${encodeURIComponent(filePath)}`;
    
    return { success: true, url };
  } catch (error) {
    console.error('ローカルダウンロードURL取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'URL取得に失敗しました',
    };
  }
}

/**
 * ファイルをローカルファイルシステムから削除
 */
export async function deleteFileFromLocal(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const absolutePath = path.join(UPLOAD_DIR, filePath);
    
    // ファイルの存在確認
    try {
      await fs.access(absolutePath);
      await fs.unlink(absolutePath);
    } catch (error) {
      // ファイルが存在しない場合は成功として扱う
      console.warn('削除対象ファイルが見つかりません:', filePath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('ローカルファイル削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '削除に失敗しました',
    };
  }
}

/**
 * ファイルの存在確認
 */
export async function checkLocalFileExists(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.join(UPLOAD_DIR, filePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * フォルダ内のファイル一覧を取得
 */
export async function listLocalFilesInFolder(folderPath: string): Promise<string[]> {
  try {
    const absolutePath = path.join(UPLOAD_DIR, folderPath);
    const files = await fs.readdir(absolutePath, { withFileTypes: true });
    
    return files
      .filter(file => file.isFile())
      .map(file => file.name);
  } catch (error) {
    console.error('ローカルファイル一覧取得エラー:', error);
    return [];
  }
}
