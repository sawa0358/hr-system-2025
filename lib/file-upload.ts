import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface FileUploadData {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  employeeId: string;
  folder?: string;
}

/**
 * ファイルアップロード処理
 */
export async function handleFileUpload(
  request: NextRequest,
  employeeId: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' };
    }

    // ファイルサイズ制限（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'ファイルサイズが大きすぎます（最大10MB）' };
    }

    // 許可されたファイルタイプ
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'サポートされていないファイル形式です' };
    }

    // ファイルをBufferに変換
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // ファイル名の生成（重複回避）
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name}`;
    
    // ローカルファイルシステムに保存
    const uploadDir = join(process.cwd(), 'uploads', employeeId, category);
    
    // ディレクトリが存在しない場合は作成
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // データベースにファイル情報を保存
    const fileRecord = await prisma.file.create({
      data: {
        filename: fileName,
        originalName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        employeeId,
        category,
        folderName: folder || null,
      },
    });

    return { success: true, fileId: fileRecord.id };
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}

/**
 * ファイルダウンロード処理
 */
export async function handleFileDownload(
  fileId: string,
  employeeId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // ファイル情報を取得
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        employeeId,
      },
    });

    if (!file) {
      return { success: false, error: 'ファイルが見つかりません' };
    }

    // ローカルファイルのURLを生成
    const fileUrl = `/api/files/download/${fileId}`;
    
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error('ファイルダウンロードエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ダウンロードに失敗しました',
    };
  }
}

/**
 * ファイル削除処理
 */
export async function handleFileDelete(
  fileId: string,
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ファイル情報を取得
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        employeeId,
      },
    });

    if (!file) {
      return { success: false, error: 'ファイルが見つかりません' };
    }

    // ローカルファイルを削除
    try {
      await unlink(file.filePath);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      // ファイルが存在しない場合は無視
    }

    // データベースからファイル情報を削除
    await prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true };
  } catch (error) {
    console.error('ファイル削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '削除に失敗しました',
    };
  }
}

/**
 * ファイル一覧取得
 */
export async function getFilesByCategory(
  employeeId: string,
  category: string,
  folder?: string
) {
  try {
    const files = await prisma.file.findMany({
      where: {
        employeeId,
        category,
        folderName: folder || null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files;
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return [];
  }
}
