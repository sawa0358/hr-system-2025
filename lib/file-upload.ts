import { NextRequest } from 'next/server';
import { uploadFileToS3, getSignedDownloadUrl, deleteFileFromS3 } from './s3-client';
import { prisma } from './prisma';

export interface FileUploadData {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  employeeId: string;
  folderId?: string;
  description?: string;
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
    const folderId = formData.get('folderId') as string;
    const description = formData.get('description') as string;

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
    
    // S3にアップロード
    const folderPath = `hr-system/${employeeId}/${category}`;
    const uploadResult = await uploadFileToS3(
      buffer,
      fileName,
      file.type,
      folderPath
    );

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    // データベースにファイル情報を保存
    const fileRecord = await prisma.file.create({
      data: {
        filename: fileName,
        originalName: file.name,
        filePath: uploadResult.filePath!,
        fileSize: file.size,
        mimeType: file.type,
        employeeId,
        category,
        folderId: folderId || null,
        description: description || null,
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

    // 署名付きURLを生成（1時間有効）
    const downloadResult = await getSignedDownloadUrl(file.filePath, 3600);

    if (!downloadResult.success) {
      return { success: false, error: downloadResult.error };
    }

    return { success: true, url: downloadResult.url };
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

    // S3からファイルを削除
    const deleteResult = await deleteFileFromS3(file.filePath);
    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error };
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
  folderId?: string
) {
  try {
    const files = await prisma.file.findMany({
      where: {
        employeeId,
        category,
        folderId: folderId || null,
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
