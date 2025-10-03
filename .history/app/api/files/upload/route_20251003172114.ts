import { NextRequest, NextResponse } from 'next/server';
import { handleFileUpload } from '@/lib/file-upload';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（実際の実装では適切な認証を行ってください）
    const employeeId = request.headers.get('x-employee-id');
    if (!employeeId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const result = await handleFileUpload(request, employeeId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
    });
  } catch (error) {
    console.error('ファイルアップロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
