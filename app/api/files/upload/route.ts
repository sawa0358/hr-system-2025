import { NextRequest, NextResponse } from 'next/server';
import { handleFileUpload } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // クエリパラメータまたはヘッダーからemployeeIdを取得
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId') || request.headers.get('x-employee-id');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const result = await handleFileUpload(request, employeeId);

    if (!result.success || !result.fileId) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // ファイル情報を取得
    const file = await prisma.file.findUnique({
      where: { id: result.fileId }
    });

    if (!file) {
      return NextResponse.json(
        { error: 'ファイル情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // アバター画像の場合は、ファイル表示用のURLを生成
    const url = `/api/files/${result.fileId}/download`;

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      url: url,
    });
  } catch (error) {
    console.error('ファイルアップロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
