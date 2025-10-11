import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // 認証チェック
    const employeeId = request.headers.get('x-employee-id');
    if (!employeeId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // タスクのファイルを取得
    const files = await prisma.file.findMany({
      where: {
        category: 'task',
        // タスクに関連するファイルを取得（フォルダ名で判定）
        OR: [
          {
            folderName: {
              not: null
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // ファイル情報を整形
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.originalName,
      type: file.mimeType,
      uploadDate: file.createdAt.toISOString().split('T')[0],
      size: formatFileSize(file.fileSize),
      folderName: file.folderName || '資料'
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error('タスクファイル取得エラー:', error);
    return NextResponse.json(
      { error: 'ファイルの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ファイルサイズをフォーマットする関数
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
