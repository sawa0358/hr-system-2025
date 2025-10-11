import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

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

    // ファイルが存在するかチェック
    if (!existsSync(file.filePath)) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // ファイルを読み込み
    const fileBuffer = await readFile(file.filePath);

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    // ファイル名をURLエンコードして日本語対応
    const encodedFileName = encodeURIComponent(file.originalName);
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    headers.set('Content-Length', file.fileSize.toString());

    return new NextResponse(fileBuffer as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('ファイルダウンロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
