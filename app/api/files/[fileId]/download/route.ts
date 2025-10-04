import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
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
    headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
    headers.set('Content-Length', file.fileSize.toString());

    return new NextResponse(fileBuffer, {
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
