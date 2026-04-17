import { NextRequest, NextResponse } from 'next/server';
import { handleFileUpload } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // ミドルウェアが設定した認証済みユーザーのID
    const authenticatedUserId = request.headers.get('x-employee-id');
    const authenticatedUserRole = request.headers.get('x-employee-role');

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // FormDataからtargetEmployeeIdを取得（HR/adminが他従業員フォルダにアップロードする場合）
    // 注: FormDataは一度しか読めないため、cloneしてから読む
    // clone() はBodyストリームをメモリに二重バッファリングするため、アップロードファイルが大きい場合はメモリ2倍になる点に注意
    const clonedRequest = request.clone();
    let targetEmployeeId = authenticatedUserId;
    try {
      const peekFormData = await clonedRequest.formData();
      const formTargetIdRaw = peekFormData.get('targetEmployeeId');
      // FormData.get() は FormDataEntryValue | null を返す。文字列値のみ受け入れる
      const formTargetId = typeof formTargetIdRaw === 'string' ? formTargetIdRaw.trim() : '';
      if (formTargetId && formTargetId !== authenticatedUserId) {
        // HR/admin権限チェック
        const isAdminOrHR = authenticatedUserRole === 'admin' || authenticatedUserRole === 'hr';
        if (!isAdminOrHR) {
          return NextResponse.json(
            { error: '他の従業員のフォルダにアップロードする権限がありません' },
            { status: 403 }
          );
        }
        // 対象従業員の存在確認
        const targetEmployee = await prisma.employee.findUnique({
          where: { id: formTargetId },
          select: { id: true }
        });
        if (!targetEmployee) {
          return NextResponse.json(
            { error: '指定された従業員が存在しません' },
            { status: 404 }
          );
        }
        targetEmployeeId = formTargetId;
      }
    } catch (err: unknown) {
      // FormData読み取り失敗時は認証済みユーザーIDを使用
      // サイレントフォールバックによる不具合検知のため、必ずログを残す
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[POST /api/files/upload] targetEmployeeId先読み失敗、認証ユーザーIDにフォールバック:', errMsg);
    }

    const result = await handleFileUpload(request, targetEmployeeId);

    if (!result.success || !result.fileId) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // ファイル情報を取得
    const file = await prisma.file.findUnique({
      where: { id: result.fileId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'ファイル情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 勤怠管理または給与管理のフォルダにアップロードされた場合、本人へメール通知
    const folderName = result.folderName;
    const category = result.category;

    const isAttendanceOrPayroll = 
      folderName === '勤怠管理' || 
      folderName === '給与管理' ||
      category === 'attendance' ||
      category === 'payroll';

    if (isAttendanceOrPayroll && file.employee?.email) {
      const { sendMail } = await import('@/lib/mail')
      
      const folderLabel = folderName === '勤怠管理' ? '勤怠管理' : 
                         folderName === '給与管理' ? '給与管理' :
                         category === 'attendance' ? '勤怠管理' :
                         category === 'payroll' ? '給与管理' : 'あなたのフォルダ';
      
      const subject = `【${folderLabel}】新しいファイルがアップロードされました`
      
      const textBody = [
        `${file.employee.name}さん`,
        '',
        `${folderLabel}に新しいファイルがアップロードされました。`,
        `ファイル名：${file.originalName}`,
        '',
        '詳細はHRシステムで確認してください。',
        'https://hr-system-2025-33b161f586cd.herokuapp.com/employees',
      ].join('\n')
      
      const htmlBody = [
        `<p>${file.employee.name}さん</p>`,
        `<p><strong>${folderLabel}に新しいファイルがアップロードされました。</strong></p>`,
        `<p>ファイル名：${file.originalName}</p>`,
        '<p>詳細はHRシステムで確認してください。</p>',
        '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/employees">https://hr-system-2025-33b161f586cd.herokuapp.com/employees</a></p>',
      ].join('')
      
      const mailResult = await sendMail({
        to: file.employee.email,
        subject,
        text: textBody,
        html: htmlBody,
      })
      
      if (mailResult.success) {
        console.log('[POST /api/files/upload] ファイルアップロード通知送信成功:', file.employee.email)
      } else if (!mailResult.skipped) {
        console.error('[POST /api/files/upload] ファイルアップロード通知送信失敗:', mailResult.error)
      }
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
