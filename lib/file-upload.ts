import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { uploadFileToS3, deleteFileFromS3 } from './s3-client';
import { uploadFileToLocal, deleteFileFromLocal } from './local-file-storage';

export interface FileUploadData {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  employeeId: string;
  folder?: string;
  taskId?: string;
}

/**
 * ファイルアップロード処理（S3使用）
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
    const folderName = formData.get('folderName') as string;
    const taskId = formData.get('taskId') as string;

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
    
    // 開発環境ではローカルファイルシステムを使用、本番環境ではS3を使用
    const isProduction = process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME;
    
    let uploadResult;
    
    if (isProduction) {
      // 本番環境：S3にアップロード
      const s3Folder = `${employeeId}/${category || 'general'}`;
      uploadResult = await uploadFileToS3(
        buffer,
        fileName,
        file.type,
        s3Folder
      );
    } else {
      // 開発環境：ローカルファイルシステムにアップロード
      uploadResult = await uploadFileToLocal(
        buffer,
        fileName,
        file.type,
        employeeId,
        category || 'general',
        folderName || folder
      );
    }

    if (!uploadResult.success || !uploadResult.filePath) {
      return { 
        success: false, 
        error: uploadResult.error || 'ファイルアップロードに失敗しました' 
      };
    }

    // データベースにファイル情報を保存
    const fileRecord = await prisma.file.create({
      data: {
        filename: fileName,
        originalName: file.name,
        filePath: uploadResult.filePath, // S3のキーパスを保存
        fileSize: file.size,
        mimeType: file.type,
        category: category || 'general',
        folderName: folderName || folder || null,
        employee: {
          connect: { id: employeeId }
        }
      },
    });

    // タスクカードのファイルの場合は、カードのattachmentsフィールドを更新
    if (taskId && category === 'task') {
      try {
        // カードの現在のattachmentsを取得
        const card = await prisma.card.findUnique({
          where: { id: taskId },
          select: { attachments: true }
        });

        if (card) {
          const currentAttachments = card.attachments as any[] || [];
          
          // ファイル情報をattachmentsに追加
          const fileInfo = {
            id: fileRecord.id,
            name: file.name,
            type: file.type,
            uploadDate: new Date().toISOString().split("T")[0],
            size: `${Math.round(file.size / 1024)}KB`,
            folderName: folderName || folder || 'general'
          };

          // ファイルをattachmentsに追加
          const updatedAttachments = [...currentAttachments, fileInfo];

          await prisma.card.update({
            where: { id: taskId },
            data: { attachments: updatedAttachments }
          });

          console.log("Card attachments updated with new file:", fileInfo);
        }
      } catch (error) {
        console.error("Error updating card attachments:", error);
        // ファイルアップロードは成功したが、カード更新に失敗した場合は警告のみ
      }
    }

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
 * ファイルダウンロード処理（S3使用）
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

    // APIエンドポイントのURLを返す（署名付きURL取得はAPIで行う）
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
 * ファイル削除処理（S3使用）
 */
export async function handleFileDelete(
  fileId: string,
  employeeId: string,
  taskId?: string
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

    // 開発環境ではローカルファイルシステムから削除、本番環境ではS3から削除
    const isProduction = process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME;
    
    let deleteResult;
    if (isProduction) {
      deleteResult = await deleteFileFromS3(file.filePath);
    } else {
      deleteResult = await deleteFileFromLocal(file.filePath);
    }
    
    if (!deleteResult.success) {
      console.error('ファイル削除エラー:', deleteResult.error);
      // ファイル削除に失敗してもデータベースからは削除する（孤立ファイル回避）
    }

    // タスクカードのファイルの場合は、カードのattachmentsフィールドからも削除
    if (taskId) {
      try {
        const card = await prisma.card.findUnique({
          where: { id: taskId },
          select: { attachments: true }
        });

        if (card && card.attachments) {
          const currentAttachments = card.attachments as any[] || [];
          let updatedAttachments = currentAttachments;

          // フォルダ構造が存在する場合は、フォルダ内のファイルから削除
          if (currentAttachments.some((item: any) => item.files)) {
            updatedAttachments = currentAttachments.map((folder: any) => {
              if (folder.files && Array.isArray(folder.files)) {
                return {
                  ...folder,
                  files: folder.files.filter((file: any) => file.id !== fileId)
                };
              }
              return folder;
            });
          } else {
            // フラットな構造の場合は直接フィルタ
            updatedAttachments = currentAttachments.filter((attachment: any) => attachment.id !== fileId);
          }

          await prisma.card.update({
            where: { id: taskId },
            data: { attachments: updatedAttachments }
          });

          console.log("File removed from card attachments:", fileId);
        }
      } catch (error) {
        console.error("Error updating card attachments after file deletion:", error);
        // ファイル削除は続行
      }
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
