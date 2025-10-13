import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSignedDownloadUrl } from '@/lib/s3-client';
import { getLocalDownloadUrl } from '@/lib/local-file-storage';
import { promises as fs } from 'fs';
import path from 'path';

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

    // 開発環境ではローカルファイルシステムから、本番環境ではS3からダウンロード
    const isProduction = process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET_NAME;
    
    if (isProduction) {
      // 本番環境：S3から署名付きURLを取得（1時間有効）
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
    } else {
      // 開発環境：ローカルファイルシステムから直接ファイルを配信
      try {
        const uploadDir = path.join(process.cwd(), 'uploads');
        const absolutePath = path.join(uploadDir, file.filePath);
        
        // ファイルの存在確認
        await fs.access(absolutePath);
        
        // ファイルを読み込み
        const fileBuffer = await fs.readFile(absolutePath);
        
        // レスポンスヘッダーを設定
        const headers = new Headers();
        headers.set('Content-Type', file.mimeType);
        headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
        headers.set('Content-Length', fileBuffer.length.toString());
        
        // ファイルを返す
        return new NextResponse(fileBuffer, { headers });
      } catch (error) {
        console.error('ローカルファイル読み込みエラー:', error);
        return NextResponse.json(
          { error: 'ファイルの読み込みに失敗しました' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('ファイルダウンロードAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
