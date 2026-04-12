import { NextRequest, NextResponse } from 'next/server';
import { handleFileDelete } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // 認証チェック（ミドルウェアがJWTから設定した値）
    const employeeId = request.headers.get('x-employee-id');
    const employeeRole = request.headers.get('x-employee-role');
    if (!employeeId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディからtaskIdを取得
    let taskId: string | undefined;
    try {
      const body = await request.json();
      taskId = body.taskId;
    } catch {
      // JSONボディがない場合はundefinedのまま
    }

    // HR/admin権限者はファイルの所有者IDを使って削除（他従業員のファイルも削除可能）
    const isAdminOrHR = employeeRole === 'admin' || employeeRole === 'hr';
    let deleteAsEmployeeId = employeeId;

    if (isAdminOrHR) {
      // ファイルの実際の所有者IDを取得
      const file = await prisma.file.findUnique({
        where: { id: params.fileId },
        select: { employeeId: true }
      });
      if (file) {
        deleteAsEmployeeId = file.employeeId;
      }
    }

    const result = await handleFileDelete(params.fileId, deleteAsEmployeeId, taskId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ファイルが削除されました',
    });
  } catch (error) {
    console.error('ファイル削除APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
