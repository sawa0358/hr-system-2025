import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3クライアントの設定
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

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

/**
 * ファイルをS3にアップロード
 */
export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder?: string
): Promise<FileUploadResult> {
  try {
    const key = folder ? `${folder}/${fileName}` : fileName;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'private', // プライベートファイルとして設定
    });

    await s3Client.send(command);
    
    return {
      success: true,
      filePath: key,
    };
  } catch (error) {
    console.error('S3アップロードエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}

/**
 * ファイルの署名付きURLを取得（一時的なアクセス用）
 */
export async function getSignedDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<FileDownloadResult> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error('署名付きURL取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'URL取得に失敗しました',
    };
  }
}

/**
 * ファイルをS3から削除
 */
export async function deleteFileFromS3(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error('S3削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '削除に失敗しました',
    };
  }
}

/**
 * ファイルの存在確認
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * フォルダ内のファイル一覧を取得
 */
export async function listFilesInFolder(folderPath: string): Promise<string[]> {
  try {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: folderPath,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(obj => obj.Key!).filter(key => key !== folderPath) || [];
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return [];
  }
}
