import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSignedDownloadUrl } from '@/lib/s3-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
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

    // ファイル情報を取得
    const file = await prisma.file.findUnique({
      where: { id: params.fileId }
    });

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // タスクに関連するファイルの場合、タスクのメンバーかどうかをチェック
    if (file.category === 'task' && file.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: file.taskId },
        include: { members: true }
      });
      
      if (!task) {
        return NextResponse.json(
          { error: 'タスクが見つかりません' },
          { status: 404 }
        );
      }
      
      // タスクのメンバーかオーナーかチェック
      const isMember = task.members.some(member => member.employeeId === employeeId);
      const isOwner = file.employeeId === employeeId;
      
      if (!isMember && !isOwner) {
        return NextResponse.json(
          { error: 'このファイルにアクセスする権限がありません' },
          { status: 403 }
        );
      }
    } else {
      // 他のカテゴリのファイルは所有者のみアクセス可能
      if (file.employeeId !== employeeId) {
        return NextResponse.json(
          { error: 'このファイルにアクセスする権限がありません' },
          { status: 403 }
        );
      }
    }

    // S3から署名付きURLを取得（1時間有効）
    const downloadResult = await getSignedDownloadUrl(file.filePath, 3600);

    if (!downloadResult.success || !downloadResult.url) {
      console.error('S3署名付きURL取得エラー:', downloadResult.error);
      return NextResponse.json(
        { error: downloadResult.error || 'ファイルのダウンロードURLの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 署名付きURLにリダイレクト
    return NextResponse.redirect(downloadResult.url);
  } catch (error) {
    console.error('ファイルダウンロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
