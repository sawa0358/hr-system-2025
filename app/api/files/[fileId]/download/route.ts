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

    // タスクに関連するファイルの場合、カードのメンバーかどうかをチェック
    if (file.category === 'task' && file.taskId) {
      // taskIdを使用してカードを取得
      const card = await prisma.card.findUnique({
        where: { id: file.taskId },
        select: {
          id: true,
          createdBy: true,
          members: {
            select: {
              employeeId: true
            }
          }
        }
      });
      
      if (!card) {
        return NextResponse.json(
          { error: 'このファイルに関連するカードが見つかりません' },
          { status: 404 }
        );
      }
      
      // ユーザーの権限を確認（総務・管理者は全てのファイルにアクセス可能）
      const user = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { role: true }
      });

      const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

      // カードのメンバーかオーナーかチェック
      const cardMemberIds = card.members.map(member => member.employeeId);
      const isCardMember = cardMemberIds.includes(employeeId) || card.createdBy === employeeId;
      const isOwner = file.employeeId === employeeId;
      
      if (!isCardMember && !isOwner && !isAdminOrHr) {
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
      try {
        // 本番環境：S3から署名付きURLを取得（1時間有効）
        const downloadResult = await getSignedDownloadUrl(file.filePath, 3600);

        if (!downloadResult.success || !downloadResult.url) {
          console.error('S3署名付きURL取得エラー:', downloadResult.error);
          // S3が失敗した場合は、ローカルファイルシステムにフォールバック
          console.log('S3フォールバック: ローカルファイルシステムを使用');
          throw new Error('S3アクセス失敗');
        }

        // 署名付きURLからファイルを取得して直接配信（CORS問題を回避）
        const fileResponse = await fetch(downloadResult.url);
        if (!fileResponse.ok) {
          throw new Error(`S3ファイル取得失敗: ${fileResponse.status}`);
        }

        const fileBuffer = await fileResponse.arrayBuffer();
        
        // レスポンスヘッダーを設定
        const headers = new Headers();
        headers.set('Content-Type', file.mimeType);
        // 日本語ファイル名を安全に処理（RFC 5987準拠）
        const safeFileName = file.originalName.replace(/[^\x00-\x7F]/g, '_');
        const encodedFileName = encodeURIComponent(file.originalName);
        headers.set('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
        headers.set('Content-Length', fileBuffer.byteLength.toString());
        
        // ファイルを返す
        return new NextResponse(fileBuffer, { headers });
      } catch (s3Error) {
        console.error('S3アクセスエラー、ローカルファイルシステムにフォールバック:', s3Error);
        // S3エラーの場合はローカルファイルシステムにフォールバック
      }
    }
    
    // 開発環境またはS3フォールバック: ローカルファイルシステムから直接ファイルを配信
    {
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
        // 日本語ファイル名を安全に処理（RFC 5987準拠）
        const safeFileName = file.originalName.replace(/[^\x00-\x7F]/g, '_');
        const encodedFileName = encodeURIComponent(file.originalName);
        headers.set('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
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
