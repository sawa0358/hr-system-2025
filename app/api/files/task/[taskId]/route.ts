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

    const taskId = params.taskId;

    // カードのメンバー情報を取得
    const card = await prisma.card.findUnique({
      where: { id: taskId },
      select: { 
        attachments: true,
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
        { error: 'カードが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーの権限を確認（総務・管理者は全てのカードにアクセス可能）
    const user = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { role: true }
    });

    const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

    // カードメンバーのIDリストを取得
    const cardMemberIds = card.members.map(member => member.employeeId);
    const isCardMember = cardMemberIds.includes(employeeId) || card.createdBy === employeeId;

    if (!isCardMember && !isAdminOrHr) {
      return NextResponse.json(
        { error: 'このカードのメンバーではありません' },
        { status: 403 }
      );
    }

    // カードのattachmentsからファイルIDを取得
    let fileIds: string[] = [];
    if (card.attachments) {
      const attachments = card.attachments as any[];
      if (Array.isArray(attachments)) {
        fileIds = attachments
          .filter(attachment => attachment.id)
          .map(attachment => attachment.id);
      }
    }

    // ファイルが存在しない場合は空配列を返す
    if (fileIds.length === 0) {
      return NextResponse.json([]);
    }

    // ファイルIDに基づいてファイルを取得（カードメンバーがアップロードしたファイルすべて）
    const files = await prisma.file.findMany({
      where: {
        id: {
          in: fileIds
        },
        category: 'task'
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
