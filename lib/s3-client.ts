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

/**
 * 社員情報をS3に保存
 */
export async function saveEmployeeToS3(
  employeeId: string,
  employeeData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `employee-${employeeId}.json`;
    const folder = 'employee-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(employeeData, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`社員情報をS3に保存しました: ${employeeId}`);
      return { success: true };
    } else {
      console.error('S3への社員情報保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('社員情報S3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * 社員情報をS3から取得
 */
export async function getEmployeeFromS3(
  employeeId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const fileName = `employee-${employeeId}.json`;
    const folder = 'employee-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('社員情報S3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}

/**
 * 家族構成情報をS3に保存
 */
export async function saveFamilyMembersToS3(
  employeeId: string,
  familyMembers: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `family-members-${employeeId}.json`;
    const folder = 'family-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(familyMembers, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`家族構成情報をS3に保存しました: ${employeeId}`);
      return { success: true };
    } else {
      console.error('S3への家族構成情報保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('家族構成情報S3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * 家族構成情報をS3から取得
 */
export async function getFamilyMembersFromS3(
  employeeId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const fileName = `family-members-${employeeId}.json`;
    const folder = 'family-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('家族構成情報S3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}

/**
 * カスタムフォルダ情報をS3に保存
 */
export async function saveCustomFoldersToS3(
  employeeId: string,
  customFolders: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `custom-folders-${employeeId}.json`;
    const folder = 'folder-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(customFolders, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`カスタムフォルダ情報をS3に保存しました: ${employeeId}`);
      return { success: true };
    } else {
      console.error('S3へのカスタムフォルダ情報保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('カスタムフォルダ情報S3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * カスタムフォルダ情報をS3から取得
 */
export async function getCustomFoldersFromS3(
  employeeId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const fileName = `custom-folders-${employeeId}.json`;
    const folder = 'folder-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('カスタムフォルダ情報S3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}

/**
 * 勤怠管理データをS3に保存
 */
export async function saveAttendanceDataToS3(
  employeeId: string,
  attendanceData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `attendance-${employeeId}.json`;
    const folder = 'attendance-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(attendanceData, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`勤怠データをS3に保存しました: ${employeeId}`);
      return { success: true };
    } else {
      console.error('S3への勤怠データ保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('勤怠データS3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * 勤怠管理データをS3から取得
 */
export async function getAttendanceDataFromS3(
  employeeId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const fileName = `attendance-${employeeId}.json`;
    const folder = 'attendance-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('勤怠データS3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}

/**
 * 給与管理データをS3に保存
 */
export async function savePayrollDataToS3(
  employeeId: string,
  payrollData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `payroll-${employeeId}.json`;
    const folder = 'payroll-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(payrollData, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`給与データをS3に保存しました: ${employeeId}`);
      return { success: true };
    } else {
      console.error('S3への給与データ保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('給与データS3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * 給与管理データをS3から取得
 */
export async function getPayrollDataFromS3(
  employeeId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const fileName = `payroll-${employeeId}.json`;
    const folder = 'payroll-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('給与データS3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}

/**
 * ワークスペースデータをS3に保存
 */
export async function saveWorkspaceDataToS3(
  workspaceId: string,
  workspaceData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `workspace-${workspaceId}.json`;
    const folder = 'workspace-data';
    const filePath = `${folder}/${fileName}`;
    
    const dataString = JSON.stringify(workspaceData, null, 2);
    const buffer = Buffer.from(dataString, 'utf-8');
    
    const result = await uploadFileToS3(
      buffer,
      fileName,
      'application/json',
      folder
    );
    
    if (result.success) {
      console.log(`ワークスペースデータをS3に保存しました: ${workspaceId}`);
      return { success: true };
    } else {
      console.error('S3へのワークスペース保存に失敗:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('ワークスペースS3保存エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存に失敗しました',
    };
  }
}

/**
 * ワークスペースデータをS3から取得
 */
export async function getWorkspaceDataFromS3(
  workspaceId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const fileName = `workspace-${workspaceId}.json`;
    const folder = 'workspace-data';
    const filePath = `${folder}/${fileName}`;
    
    const urlResult = await getSignedDownloadUrl(filePath);
    
    if (!urlResult.success || !urlResult.url) {
      return { success: false, error: 'S3からファイルが見つかりません' };
    }
    
    const response = await fetch(urlResult.url);
    if (!response.ok) {
      return { success: false, error: 'ファイルの取得に失敗しました' };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('ワークスペースS3取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '取得に失敗しました',
    };
  }
}
