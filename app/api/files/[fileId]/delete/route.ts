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

    // ファイルの所有者を確認（明示的な認可チェック）
    const file = await prisma.file.findUnique({
      where: { id: params.fileId },
      select: { employeeId: true, taskId: true, category: true }
    });
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    const isAdminOrHR = employeeRole === 'admin' || employeeRole === 'hr';
    const isOwner = file.employeeId === employeeId;

    // タスクカードに紐づくファイルの場合、カードメンバーも削除可能
    let isTaskMember = false;
    if (file.category === 'task' && file.taskId) {
      const card = await prisma.card.findUnique({
        where: { id: file.taskId },
        select: {
          createdBy: true,
          members: { select: { employeeId: true } }
        }
      });
      if (card) {
        const memberIds = card.members.map((m) => m.employeeId);
        isTaskMember = memberIds.includes(employeeId) || card.createdBy === employeeId;
      }
    }

    // 権限チェック: 所有者 or admin/HR or タスクメンバー のみ削除可能
    if (!isOwner && !isAdminOrHR && !isTaskMember) {
      return NextResponse.json(
        { error: 'このファイルを削除する権限がありません' },
        { status: 403 }
      );
    }

    // handleFileDelete の内部WHERE句はファイル所有者IDで照合するため、実所有者IDを渡す
    const result = await handleFileDelete(params.fileId, file.employeeId, taskId);

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
